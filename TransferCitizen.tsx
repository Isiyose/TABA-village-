import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { Search, ArrowRight } from 'lucide-react';
import { db } from '../lib/firebase';

export function TransferCitizen() {
  const { t } = useLanguage();
  const [nationalId, setNationalId] = useState('');
  const [citizen, setCitizen] = useState<any>(null);
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!nationalId || nationalId.length !== 16) {
      alert('Please enter a valid 16-digit National ID.');
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'citizens'), where('id', '==', nationalId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setCitizen({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
      } else {
        setCitizen(null);
        alert('Citizen not found.');
      }
    } catch (error: any) {
      handleFirestoreError(error, OperationType.GET, 'citizens');
      alert('Failed to search citizen.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!citizen || !destination || !reason) {
      alert('Please fill all fields.');
      return;
    }
    try {
      const today = new Date().toISOString();
      
      // Prepare data for destination cell
      const transferData = { 
        ...citizen,
        isibo: 'Pending Assignment',
        approvalStatus: 'pending',
        residency: 'Still in Cell',
        regDate: today.split('T')[0],
        transferredFrom: 'Taba Village',
        transferReason: reason
      };
      delete transferData.id; // Remove source doc ID

      // Update source record
      try {
        await updateDoc(doc(db, 'citizens', citizen.id), {
          residency: 'Relocated',
          relocatedTo: destination,
          transferReason: reason,
          dateLeft: today.split('T')[0]
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `citizens/${citizen.id}`);
        throw error;
      }

      // Log the action
      try {
        await addDoc(collection(db, 'logs'), {
          timestamp: new Date().toLocaleString(),
          user: 'Admin', // Should use actual user
          action: 'Transferred Citizen',
          details: `Transferred ${citizen.firstName} to ${destination}. Reason: ${reason}`
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.CREATE, 'logs');
      }

      // Create a transfer record for notifications
      try {
        await addDoc(collection(db, 'transfers'), {
          citizenId: citizen.id,
          citizenName: `${citizen.firstName} ${citizen.lastName}`,
          fromCell: 'Taba Village',
          toCell: destination,
          status: 'pending',
          date: today,
          reason: reason
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.CREATE, 'transfers');
      }

      alert(`Citizen successfully transferred to ${destination}!`);
      setCitizen(null);
      setNationalId('');
      setDestination('');
      setReason('');
    } catch (error: any) {
      // Error already handled in sub-try blocks or general catch
      alert('Failed to transfer citizen.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-3xl mx-auto animate-in fade-in">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t('tr_t')}</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_nid')}</label>
          <div className="flex gap-4">
            <input 
              type="text" 
              maxLength={16}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white" 
              value={nationalId} 
              onChange={e => setNationalId(e.target.value)} 
              placeholder="Enter 16-digit National ID"
            />
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              <Search size={18} /> {t('btn_src')}
            </button>
          </div>
        </div>

        {citizen && (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">👤</span>
              Citizen Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500 dark:text-slate-400">Name:</span> <span className="font-bold text-slate-800 dark:text-white">{citizen.firstName} {citizen.lastName}</span></div>
              <div><span className="text-slate-500 dark:text-slate-400">Isibo:</span> <span className="font-bold text-slate-800 dark:text-white">{citizen.isibo}</span></div>
              <div><span className="text-slate-500 dark:text-slate-400">Phone:</span> <span className="font-bold text-slate-800 dark:text-white">{citizen.phone}</span></div>
              <div><span className="text-slate-500 dark:text-slate-400">Status:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">{citizen.residency}</span></div>
            </div>
          </div>
        )}

        {citizen && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_dst')}</label>
              <select 
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white" 
                value={destination} 
                onChange={e => setDestination(e.target.value)}
              >
                <option value="" disabled>Select destination...</option>
                <option value="Taba">Taba Cell</option>
                <option value="Nyagatare">Nyagatare Cell</option>
                <option value="Kinyinya">Kinyinya Cell</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_rsn')}</label>
              <textarea 
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white" 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="Reason for transfer..."
              />
            </div>
            <button 
              onClick={handleTransfer}
              className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-500/30 transition-all active:scale-[0.98]"
            >
              <ArrowRight size={20} /> {t('btn_trf')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
