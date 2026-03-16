import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, Search, Filter } from 'lucide-react';

export function SystemLogs() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Create start and end of the selected day
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'logs'), 
      where('timestamp', '>=', startOfDay.toISOString()),
      where('timestamp', '<=', endOfDay.toISOString()),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'logs');
    });
    return () => unsub();
  }, [selectedDate]);

  const filteredLogs = logs.filter(l => 
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('sl_t')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor all administrative actions and system events.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search logs..."
                className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-5">{t('t_tim')}</th>
                <th className="p-5">{t('t_usr')}</th>
                <th className="p-5">{t('t_act')}</th>
                <th className="p-5">{t('t_dtl')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="p-5 text-slate-500 dark:text-slate-400 text-sm font-mono">
                    {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Filter size={14} />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{l.user}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      l.action.includes('Delete') ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' :
                      l.action.includes('Create') ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    }`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="p-5 text-slate-600 dark:text-slate-400 text-sm">{l.details}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Search size={48} strokeWidth={1} />
                      <p className="text-lg font-medium">{t('sl_nl')}</p>
                      <p className="text-sm">Try selecting a different date or adjusting your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
