import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { Trash2, UserPlus, Key, Shield, User } from 'lucide-react';
import { logAction } from '../utils/logUtils';

export function ManageAdmins() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [admins, setAdmins] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'admin' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admins'), (snapshot) => {
      setAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'admins');
    });
    return () => unsub();
  }, []);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
    let pass = "";
    for(let i=0; i<12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData({ ...formData, password: pass });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = formData.username.toLowerCase().trim();
    const normalizedPassword = formData.password.trim();
    try {
      await setDoc(doc(db, 'admins', normalizedUsername), {
        ...formData,
        username: normalizedUsername,
        password: normalizedPassword,
        status: 'active',
        createdAt: new Date().toLocaleDateString(),
        uid: '' // Will be populated on first login
      });
      
      await logAction(
        db,
        currentUser?.username || 'System',
        'Create Admin',
        `Created admin account: ${normalizedUsername}`
      );
      
      setShowForm(false);
      setFormData({ username: '', password: '', role: 'admin' });
      alert('Admin added successfully!');
    } catch (error: any) {
      console.error("Error saving admin:", error);
      handleFirestoreError(error, OperationType.CREATE, 'admins');
      alert('Failed to save admin: ' + error.message);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const adminToDelete = admins.find(a => a.id === deleteId);
      const path = `admins/${deleteId}`;
      try {
        await deleteDoc(doc(db, 'admins', deleteId));
        await logAction(
          db,
          currentUser?.username || 'System',
          'Delete Admin',
          `Revoked access for: ${adminToDelete?.username}`
        );
        alert('Admin access revoked successfully!');
      } catch (error: any) {
        handleFirestoreError(error, OperationType.DELETE, path);
        alert('Failed to revoke admin access: ' + error.message);
      } finally {
        setDeleteId(null);
      }
    }
  };

  return (
    <div className="animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('ma_t')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('ma_s')}</p>
        </div>
        {currentUser?.role === 'superadmin' && (
          <button 
            onClick={() => { setShowForm(!showForm); if(!showForm) generatePassword(); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
          >
            {showForm ? t('btn_cnl') : <><UserPlus size={18} /> {t('btn_ad_ad')}</>}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl mb-10 max-w-md animate-in slide-in-from-top-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">{t('ma_nc')}</h3>
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('lbl_usr')}</label>
            <input required type="text" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-900/50 dark:text-white" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('lbl_rol')}</label>
            <select className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-900/50 dark:text-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="admin">{t('opt_adm')}</option>
              <option value="viewer">{t('opt_vw')}</option>
            </select>
          </div>
          <div className="mb-8">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('lbl_pass')}</label>
            <div className="flex gap-3">
              <input 
                required 
                type="text" 
                className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              <button type="button" onClick={generatePassword} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-5 rounded-xl font-bold text-slate-700 dark:text-slate-300 transition-colors text-xl" title="Generate Random Password">🎲</button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">You can edit the generated password above if needed.</p>
          </div>
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30">
            {t('btn_cr_ad')}
          </button>
        </form>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-5">{t('t_usr')}</th>
                <th className="p-5">{t('t_rol')}</th>
                <th className="p-5">{t('t_sts')}</th>
                <th className="p-5">{t('t_cat')}</th>
                <th className="p-5">{t('t_act')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {admins.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{a.username}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize tracking-wide flex items-center gap-1 w-fit ${a.role === 'admin' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {a.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                      {a.role}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold capitalize tracking-wide">
                      {a.status}
                    </span>
                  </td>
                  <td className="p-5 text-slate-500 dark:text-slate-400 text-sm">{a.createdAt}</td>
                  <td className="p-5">
                    {currentUser?.role === 'superadmin' && currentUser?.username !== a.username && (
                      <button 
                        onClick={() => setDeleteId(a.id)} 
                        className="text-rose-500 dark:text-rose-400 font-bold text-sm hover:text-rose-700 dark:hover:text-rose-300 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} /> {t('btn_rmv')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Revoke Access"
        message="Are you sure you want to revoke access for this administrator? They will no longer be able to log in."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

    </div>
  );
}
