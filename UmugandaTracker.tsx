import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { Download, FileText, Save, CheckSquare, Square } from 'lucide-react';
import { exportToExcel } from '../utils/exportUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function UmugandaTracker() {
  const { t } = useLanguage();
  const [citizens, setCitizens] = useState<any[]>([]);
  const [date, setDate] = useState('');
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    if (date) {
      const initialAttendance: Record<string, boolean> = {};
      citizens.forEach(c => {
        initialAttendance[c.id] = c.umugandaDates?.includes(date) || false;
      });
      setAttendance(initialAttendance);
    }
  }, [date, citizens]);

  const handleCheckboxChange = (id: string) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAll = () => {
    const newAttendance: Record<string, boolean> = {};
    citizens.forEach(c => newAttendance[c.id] = true);
    setAttendance(newAttendance);
  };

  const handleClearAll = () => {
    const newAttendance: Record<string, boolean> = {};
    citizens.forEach(c => newAttendance[c.id] = false);
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (!date) {
      alert('Please select a date first.');
      return;
    }
    try {
      const promises: Promise<void>[] = [];
      
      citizens.forEach(c => {
        const attended = attendance[c.id] || false;
        const umugandaDates = c.umugandaDates ? [...c.umugandaDates] : [];
        const currentlyAttended = umugandaDates.includes(date);
        
        if (attended !== currentlyAttended) {
          if (attended) {
            umugandaDates.push(date);
          } else {
            const index = umugandaDates.indexOf(date);
            if (index > -1) {
              umugandaDates.splice(index, 1);
            }
          }
          promises.push(updateDoc(doc(db, 'citizens', c.id), { umugandaDates }));
        }
      });

      if (promises.length === 0) {
        alert('No changes to save.');
        return;
      }

      await Promise.all(promises);
      alert('Attendance saved successfully!');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'citizens');
      alert('Failed to save attendance: ' + error.message);
    }
  };

  const handleExportExcel = () => {
    if (!date) {
      alert('Please select a date first.');
      return;
    }
    const data = citizens.map(c => ({
      'Name': `${c.firstName} ${c.lastName}`,
      'National ID': c.nationalId,
      'Isibo': c.isibo,
      'Status': attendance[c.id] ? 'Present' : 'Absent'
    }));
    exportToExcel(data, `Umuganda_Attendance_${date}`);
  };

  const handleExportPDF = () => {
    if (!date) {
      alert('Please select a date first.');
      return;
    }
    const docPDF = new jsPDF();
    docPDF.text(`Umuganda Attendance Report - ${date}`, 14, 15);
    docPDF.text(`Cell: Taba Cell`, 14, 22);
    
    const tableData = citizens.map(c => [
      `${c.firstName} ${c.lastName}`,
      c.nationalId,
      c.isibo,
      attendance[c.id] ? 'Present' : 'Absent'
    ]);

    autoTable(docPDF, {
      head: [['Name', 'National ID', 'Isibo', 'Status']],
      body: tableData,
      startY: 30,
    });

    docPDF.save(`Umuganda_Attendance_${date}.pdf`);
  };

  const totalExpected = citizens.length;
  const attendedCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = totalExpected - attendedCount;
  const participationRate = totalExpected > 0 ? Math.round((attendedCount / totalExpected) * 100) : 0;

  return (
    <div className="animate-in fade-in">
      <div className="bg-gradient-to-r from-slate-800 to-blue-700 dark:from-slate-900 dark:to-blue-900 p-8 rounded-3xl text-white mb-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">{t('u_b_t')}</h2>
          <p className="text-white/80">{t('u_b_s')}</p>
        </div>
        <div className="flex flex-col gap-4">
          <input 
            type="date" 
            className="px-6 py-4 rounded-2xl text-slate-900 dark:text-white font-bold outline-none shadow-inner bg-white/90 dark:bg-slate-800/90 focus:bg-white dark:focus:bg-slate-800 transition-colors w-full md:w-auto color-scheme-light dark:color-scheme-dark"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
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
            <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/40 text-sm">
              <Save size={16}/> {t('btn_sv_at')}
            </button>
          </div>
        </div>
      </div>

      {date && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('u_s_tt')}</div>
            <div className="text-4xl font-extrabold text-slate-800 dark:text-white">{totalExpected}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('u_s_at')}</div>
            <div className="text-4xl font-extrabold text-emerald-500 dark:text-emerald-400">{attendedCount}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('u_s_ab')}</div>
            <div className="text-4xl font-extrabold text-rose-500 dark:text-rose-400">{absentCount}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('u_s_rt')}</div>
            <div className="text-4xl font-extrabold text-blue-500 dark:text-blue-400">{participationRate}%</div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('u_l_t')}</h3>
          {date && (
            <div className="flex gap-2">
              <button onClick={handleSelectAll} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-md font-bold text-xs transition-colors">
                <CheckSquare size={14}/> {t('btn_s_al')}
              </button>
              <button onClick={handleClearAll} className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-md font-bold text-xs transition-colors">
                <Square size={14}/> {t('btn_c_al')}
              </button>
            </div>
          )}
        </div>
        
        {date ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 w-16 text-center rounded-tl-lg">Mark</th>
                  <th className="p-4">{t('t_nam')}</th>
                  <th className="p-4">{t('t_nid')}</th>
                  <th className="p-4">{t('t_isn')}</th>
                  <th className="p-4 rounded-tr-lg">{t('t_sts')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {citizens.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-emerald-500 cursor-pointer" 
                        checked={attendance[c.id] || false}
                        onChange={() => handleCheckboxChange(c.id)}
                      />
                    </td>
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{c.firstName} {c.lastName}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-sm">{c.nationalId}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{c.isibo}</td>
                    <td className="p-4">
                      {attendance[c.id] ? (
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full text-xs font-bold">{t('st_pre')}</span>
                      ) : (
                        <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-2 py-1 rounded-full text-xs font-bold">{t('st_abs')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <div className="text-4xl mb-4">📅</div>
            <p className="font-medium">{t('u_m_sd')}</p>
          </div>
        )}
      </div>
    </div>
  );
}