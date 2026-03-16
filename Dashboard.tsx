import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Users, Home, CheckSquare, HeartPulse, TrendingUp, TrendingDown, Building2, Download, HelpCircle, Info } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    total: 0,
    isibos: 0,
    umugandaAvg: 0,
    insuredPct: 0,
    adults: 0,
    children: 0,
    totalChildren: 0,
    married: 0,
    separated: 0
  });

  const [chartData, setChartData] = useState({
    growth: { labels: [], data: [] },
    demographics: { labels: ['0-17', '18-35', '36-50', '51+'], data: [0, 0, 0, 0] },
    housing: { homeowner: 0, tenant: 0 },
    insurance: { mutuelle: 0, rssb: 0, mmi: 0, private: 0, none: 0 }
  });

  const [activeCitizens, setActiveCitizens] = useState<any[]>([]);

  useEffect(() => {
    let isibosCount = 0;
    const unsubIsibos = onSnapshot(collection(db, 'isibos'), (snapshot) => {
      isibosCount = snapshot.docs.length;
      setStats(prev => ({ ...prev, isibos: isibosCount }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'isibos');
    });

    const unsubCitizens = onSnapshot(collection(db, 'citizens'), (snapshot) => {
      const citizens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      // Filter active citizens
      const active = citizens.filter((c: any) => 
        (c.residency === 'Still in Cell' || !c.residency) && 
        (c.approvalStatus === 'approved' || !c.approvalStatus) &&
        !c.isArchived
      );
      setActiveCitizens(active);

      const total = active.length;
      
      let adults = 0, children = 0, married = 0, separated = 0;
      let totalChildrenInArray = 0;
      let homeowner = 0, tenant = 0;
      let insMutuelle = 0, insRssb = 0, insMmi = 0, insPrivate = 0, insNone = 0;
      let ageGroups = [0, 0, 0, 0]; // 0-17, 18-35, 36-50, 51+

      // Growth Data Calculation (Last 6 months)
      const monthlyGroups: Record<string, number> = {};

      active.forEach((c: any) => {
        // Count children in array
        if (c.children) totalChildrenInArray += c.children.length;

        // Demographics
        let age = 0;
        if (c.dob) {
          const dob = new Date(c.dob);
          const ageDifMs = Date.now() - dob.getTime();
          const ageDate = new Date(ageDifMs);
          age = Math.abs(ageDate.getUTCFullYear() - 1970);
        }
        
        if (age >= 18) adults++; else children++;
        
        if (age < 18) ageGroups[0]++;
        else if (age <= 35) ageGroups[1]++;
        else if (age <= 50) ageGroups[2]++;
        else ageGroups[3]++;

        if (c.marital === 'Married') married++;
        else if (c.marital === 'Divorced' || c.marital === 'Widowed') separated++;

        // Housing
        if (c.housingType === 'Homeowner') homeowner++;
        else if (c.housingType === 'Tenant') tenant++;

        // Insurance
        const ins = c.insurance || 'None';
        if (ins === 'Mutuelle de Santé') insMutuelle++;
        else if (ins === 'RSSB / RAMA') insRssb++;
        else if (ins === 'MMI') insMmi++;
        else if (ins === 'Private Insurance') insPrivate++;
        else insNone++;

        // Growth
        if (c.registeredAt) {
          const d = new Date(c.registeredAt);
          const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthlyGroups[k] = (monthlyGroups[k] || 0) + 1;
        }
      });

      const sortedKeys = Object.keys(monthlyGroups).sort();
      const chartLabelsAll: string[] = [];
      const chartBarsAll: number[] = [];
      
      sortedKeys.forEach(k => {
        const [yy, mm] = k.split('-');
        const dateObj = new Date(parseInt(yy), parseInt(mm) - 1, 1);
        const monthName = dateObj.toLocaleString('default', { month: 'short' });
        chartLabelsAll.push(monthName);
        chartBarsAll.push(monthlyGroups[k]);
      });

      const labelsGrowth = chartLabelsAll.slice(-6);
      const dataBars = chartBarsAll.slice(-6);

      const insuredTotal = insMutuelle + insRssb + insMmi + insPrivate;
      const insuredPct = total > 0 ? Math.round((insuredTotal / total) * 100) : 0;

      // Mock Umuganda Avg for now
      const umugandaAvg = total > 0 ? 85 : 0;

      setStats({
        total,
        isibos: isibosCount,
        umugandaAvg,
        insuredPct,
        adults,
        children,
        totalChildren: totalChildrenInArray,
        married,
        separated
      });

      setChartData({
        growth: { labels: labelsGrowth.length ? labelsGrowth : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], data: dataBars.length ? dataBars : [12, 19, 15, 25, 32, 45] },
        demographics: { labels: ['0-17', '18-35', '36-50', '51+'], data: ageGroups },
        housing: { homeowner, tenant },
        insurance: { mutuelle: insMutuelle, rssb: insRssb, mmi: insMmi, private: insPrivate, none: insNone }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'citizens');
    });

    return () => {
      unsubCitizens();
      unsubIsibos();
    };
  }, []);

  const growthChartData = {
    labels: chartData.growth.labels,
    datasets: [
      {
        label: 'New Registrations',
        data: chartData.growth.data,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#8b5cf6',
      }
    ]
  };

  const demoChartData = {
    labels: chartData.demographics.labels,
    datasets: [
      {
        label: 'Population by Age',
        data: chartData.demographics.data,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        borderRadius: 6,
      }
    ]
  };

  const housingChartData = {
    labels: ['Homeowner', 'Tenant'],
    datasets: [
      {
        data: [chartData.housing.homeowner, chartData.housing.tenant],
        backgroundColor: ['#2563eb', '#f59e0b'],
        borderWidth: 0,
      }
    ]
  };

  const insuranceChartData = {
    labels: ['Mutuelle', 'RSSB', 'MMI', 'Private', 'None'],
    datasets: [
      {
        data: [chartData.insurance.mutuelle, chartData.insurance.rssb, chartData.insurance.mmi, chartData.insurance.private, chartData.insurance.none],
        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      }
    ]
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Location Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Taba Village</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Kigali City • Gasabo District • Taba Cell • Taba Village
            </p>
          </div>
        </div>
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400">
          Last Updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<Users size={28} />} iconBg="bg-icon-blue"
          title={t('st_tc')} value={stats.total} 
          trend="up" trendText="Active Residents"
        />
        <StatCard 
          icon={<Home size={28} />} iconBg="bg-icon-green"
          title={t('st_ti')} value={stats.isibos} 
          trend="up" trendText="Active"
        />
        <StatCard 
          icon={<CheckSquare size={28} />} iconBg="bg-icon-purple"
          title={t('st_au')} value={`${stats.umugandaAvg}%`} 
          trend="up" trendText="High Participation"
        />
        <StatCard 
          icon={<HeartPulse size={28} />} iconBg="bg-icon-orange"
          title={t('st_hi')} value={`${stats.insuredPct}%`} 
          trend={stats.insuredPct >= 80 ? 'up' : 'down'} 
          trendText={stats.insuredPct >= 80 ? 'Excellent Coverage' : 'Needs Attention'}
        />
      </div>

      {/* Demographics Breakdown Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DemoCard label={t('dl_ad')} value={stats.adults} max={stats.total} color="bg-blue-600" textColor="text-blue-600" />
        <DemoCard label="Village Children" value={stats.totalChildren} max={stats.totalChildren + stats.total} color="bg-purple-600" textColor="text-purple-600" />
        <DemoCard label={t('dl_ma')} value={stats.married} max={stats.total} color="bg-emerald-500" textColor="text-emerald-500" />
        <DemoCard label={t('dl_dw')} value={stats.separated} max={stats.total} color="bg-amber-500" textColor="text-amber-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 chart-card">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('ch_gr_t')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('ch_gr_s')}</p>
          </div>
          <div className="h-72">
            <Line 
              data={growthChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' }, border: { display: false }, ticks: { color: '#94a3b8' } },
                  x: { grid: { display: false }, border: { display: false }, ticks: { color: '#94a3b8' } }
                }
              }} 
            />
          </div>
        </div>

        <div className="chart-card">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('ch_dm_t')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('ch_dm_s')}</p>
          </div>
          <div className="flex-grow flex items-center justify-center h-64">
            <Bar 
              data={demoChartData}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { beginAtZero: true, grid: { display: false }, border: { display: false }, ticks: { color: '#94a3b8' } },
                  y: { grid: { display: false }, border: { display: false }, ticks: { color: '#94a3b8' } }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="chart-card">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('ch_hs_t')}</h3>
          </div>
          <div className="flex-grow flex items-center justify-center h-64">
            <Doughnut 
              data={housingChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
              }}
            />
          </div>
        </div>

        <div className="chart-card">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('ch_in_t')}</h3>
          </div>
          <div className="flex-grow flex items-center justify-center h-64">
            <Doughnut 
              data={insuranceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
              }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

function StatCard({ icon, iconBg, title, value, trend, trendText }: any) {
  return (
    <div className="modern-stat-card group">
      <div className="flex items-center">
        <div className={`stat-icon-wrap ${iconBg}`}>
          {icon}
        </div>
        <div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</div>
          <div className="text-3xl font-extrabold text-slate-800 dark:text-white leading-none mb-2">{value}</div>
          <div className={`text-xs font-bold flex items-center gap-1 ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trendText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoCard({ label, value, max, color, textColor }: any) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="demo-card">
      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-3xl font-extrabold mb-3 ${textColor}`}>{value}</div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
