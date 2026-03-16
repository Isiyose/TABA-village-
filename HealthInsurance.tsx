import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { Download, FileText } from 'lucide-react';
import { exportToExcel } from '../utils/exportUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function HealthInsurance() {
  const { t } = useLanguage();
  const [citizens, setCitizens] = useState<any[]>([]);

  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'citizens'), (snapshot) => {
      const activeCitizens = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((c: any) => c.residency === 'Still in Cell' && c.approvalStatus === 'approved' && !c.isArchived);
      setCitizens(activeCitizens);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'citizens');
    });
    return () => unsub();
  }, []);

  const handleUpdate = async (id: string, insurance: string) => {
    try {
      await updateDoc(doc(db, 'citizens', id), { insurance });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `citizens/${id}`);
    }
  };

  const filtered = citizens.filter(c => 
    `${c.firstName || ''} ${c.lastName || ''} ${c.nationalId || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportExcel = () => {
    const data = filtered.map(c => ({
      'Name': `${c.firstName} ${c.lastName}`,
      'National ID': c.nationalId,
      'Isibo': c.isibo,
      'Insurance Type': c.insurance || 'None'
    }));
    exportToExcel(data, 'Health_Insurance_Report');
  };

  const handleExportPDF = () => {
    const docPDF = new jsPDF();
    docPDF.text(`Health Insurance Report - Taba Cell`, 14, 15);
    
    const tableData = filtered.map(c => [
      `${c.firstName} ${c.lastName}`,
      c.nationalId,
      c.isibo,
      c.insurance || 'None'
    ]);

    autoTable(docPDF, {
      head: [['Name', 'National ID', 'Isibo', 'Insurance']],
      body: tableData,
      startY: 20,
    });

    docPDF.save('Health_Insurance_Report.pdf');
  };

  const totalCitizens = citizens.length;
  const coveredCount = citizens.filter(c => c.insurance && c.insurance !== 'None').length;
  const uninsuredCount = totalCitizens - coveredCount;
  const coverageRate = totalCitizens > 0 ? Math.round((coveredCount / totalCitizens) * 100) : 0;

  return (
    <div className="animate-in fade-in">
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 dark:from-emerald-900 dark:to-teal-900 p-8 rounded-3xl text-white mb-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">{t('ins_t')}</h2>
          <p className="text-white/80">{t('ins_s')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
          >
            <Download size={16}/> Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
          >
            <FileText size={16}/> {t('btn_dl_rp')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('i_s_tt')}</div>
          <div className="text-4xl font-extrabold text-slate-800 dark:text-white">{totalCitizens}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('i_s_cv')}</div>
          <div className="text-4xl font-extrabold text-emerald-500 dark:text-emerald-400">{coveredCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('i_s_un')}</div>
          <div className="text-4xl font-extrabold text-rose-500 dark:text-rose-400">{uninsuredCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('i_s_rt')}</div>
          <div className="text-4xl font-extrabold text-blue-500 dark:text-blue-400">{coverageRate}%</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('ins_l_t')}</h3>
          <input 
            type="text" 
            placeholder="Search by Name or ID..." 
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 dark:text-white transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 rounded-tl-lg">{t('t_nam')}</th>
                <th className="p-4">{t('t_nid')}</th>
                <th className="p-4">{t('t_isn')}</th>
                <th className="p-4 rounded-tr-lg">{t('t_ins')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{c.firstName} {c.lastName}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-sm">{c.nationalId}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{c.isibo}</td>
                  <td className="p-4">
                    <select 
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 dark:text-slate-300 shadow-sm"
                      value={c.insurance || ''}
                      onChange={(e) => handleUpdate(c.id, e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="Mutuelle de Santé">Mutuelle de Santé</option>
                      <option value="RSSB / RAMA">RSSB / RAMA</option>
                      <option value="MMI">MMI</option>
                      <option value="Private Insurance">Private Insurance</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-12 text-center text-slate-500 dark:text-slate-400">No citizens found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
