import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { sendUmugandaReminder, sendInsuranceReminder } from '../services/notificationService';
import { MessageSquare, Send, HeartPulse, Phone, CheckSquare, Users } from 'lucide-react';

export function Communication() {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const [activeCitizens, setActiveCitizens] = useState<any[]>([]);

  useEffect(() => {
    const unsubCitizens = onSnapshot(collection(db, 'citizens'), (snapshot) => {
      const citizens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const active = citizens.filter((c: any) => 
        (c.residency === 'Still in Cell' || !c.residency) && 
        (c.approvalStatus === 'approved' || !c.approvalStatus) &&
        !c.isArchived
      );
      setActiveCitizens(active);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'citizens');
    });

    return () => unsubCitizens();
  }, []);

  const handleBulkUmuganda = async () => {
    if (!confirm('Send Umuganda reminders to all active citizens?')) return;
    setSending(true);
    try {
      const date = new Date();
      date.setDate(date.getDate() + (6 - date.getDay()) + 21); // Next last Saturday
      const dateStr = date.toLocaleDateString();
      
      let successCount = 0;
      for (const citizen of activeCitizens) {
        const res = await sendUmugandaReminder(citizen, dateStr);
        if (res.success) successCount++;
      }
      alert(`Reminders sent successfully to ${successCount} citizens!`);
    } catch (error) {
      console.error(error);
      alert('Failed to send some reminders.');
    } finally {
      setSending(false);
    }
  };

  const handleBulkInsurance = async () => {
    const expiring = activeCitizens.filter(c => {
      if (!c.insuranceExpiry) return false;
      const expiry = new Date(c.insuranceExpiry);
      const diff = expiry.getTime() - Date.now();
      return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000; // Expiring in < 30 days
    });

    if (expiring.length === 0) {
      alert('No citizens found with insurance expiring in the next 30 days.');
      return;
    }

    if (!confirm(`Send insurance renewal reminders to ${expiring.length} citizens?`)) return;
    
    setSending(true);
    try {
      let successCount = 0;
      for (const citizen of expiring) {
        const res = await sendInsuranceReminder(citizen, citizen.insuranceExpiry);
        if (res.success) successCount++;
      }
      alert(`Reminders sent successfully to ${successCount} citizens!`);
    } catch (error) {
      console.error(error);
      alert('Failed to send some reminders.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <MessageSquare className="text-emerald-500" /> Communication Center
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">View and manage citizen communication history for Taba Cell.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-12 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckSquare size={28} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white">Umuganda Reminders</h4>
                <p className="text-sm text-slate-500">Send SMS to all active citizens</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed">
              Automatically notify all registered citizens about the upcoming community work (Umuganda). 
              The system will calculate the next last Saturday of the month and send a personalized SMS.
            </p>
            <button 
              onClick={handleBulkUmuganda}
              disabled={sending || activeCitizens.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              {sending ? 'Sending...' : <><Send size={18} /> Send Bulk Reminders</>}
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <HeartPulse size={28} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800 dark:text-white">Insurance Alerts</h4>
                <p className="text-sm text-slate-500">Notify citizens with expiring insurance</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed">
              Identify citizens whose health insurance is expiring within the next 30 days and send them a renewal reminder via SMS.
            </p>
            <button 
              onClick={handleBulkInsurance}
              disabled={sending || activeCitizens.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              {sending ? 'Sending...' : <><Send size={18} /> Send Renewal Alerts</>}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Communication History</h3>
            <p className="text-slate-500 text-sm mt-1">Recent messages sent from this cell.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">System Online</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Recipient</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50 dark:border-slate-800/50">
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-700 dark:text-slate-300">Jean Paul</div>
                  <div className="text-xs text-slate-400">+250 788 123 456</div>
                </td>
                <td className="py-4 px-4">
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase">Umuganda</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-emerald-500 text-sm font-bold">Delivered</span>
                </td>
                <td className="py-4 px-4 text-sm text-slate-500">Today, 08:30 AM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
