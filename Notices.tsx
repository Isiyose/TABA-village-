import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Trash2, AlertCircle, Info, Bell } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { logAction } from '../utils/logUtils';

export function Notices() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notices, setNotices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', priority: 'normal' });
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'normal'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notices');
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'notices'), {
        ...formData,
        author: user?.username || user?.email,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now()
      });
      
      await logAction(
        db,
        user?.username || user?.email || 'Unknown',
        'Create Notice',
        `Created notice: ${formData.title}`
      );

      setShowForm(false);
      setFormData({ title: '', message: '', priority: 'normal' });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'notices');
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const notice = notices.find(n => n.id === deleteId);
      const path = `notices/${deleteId}`;
      try {
        await deleteDoc(doc(db, 'notices', deleteId));
        
        await logAction(
          db,
          user?.username || user?.email || 'Unknown',
          'Delete Notice',
          `Deleted notice: ${notice?.title || deleteId}`
        );
        alert('Notice deleted successfully!');
      } catch (error: any) {
        console.error("Error deleting notice:", error);
        handleFirestoreError(error, OperationType.DELETE, path);
        alert('Failed to delete notice: ' + error.message);
      } finally {
        setDeleteId(null);
      }
    }
  };

  const filteredNotices = notices.filter(n => activeTab === 'all' || n.priority === activeTab);

  return (
    <div className="animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('nt_t')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('nt_s')}</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-1">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveTab('urgent')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'urgent' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
              <AlertCircle size={16} /> Urgent
            </button>
            <button 
              onClick={() => setActiveTab('normal')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'normal' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
              <Info size={16} /> Normal
            </button>
          </div>
          {(user?.role === 'superadmin' || user?.role === 'admin') && (
            <button 
              onClick={() => setShowForm(!showForm)} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
            >
              {showForm ? t('btn_cnl') : <><Bell size={18} /> {t('btn_cr_nt')}</>}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl mb-10 max-w-2xl animate-in slide-in-from-top-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">{t('nt_na')}</h3>
          <div className="grid gap-5 mb-6">
            <input 
              required type="text" placeholder={t('lbl_tit')} 
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white" 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
            />
            <select 
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white" 
              value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
            >
              <option value="normal">{t('opt_nrm')}</option>
              <option value="urgent">{t('opt_urg')}</option>
            </select>
            <textarea 
              required placeholder={t('lbl_msg')} rows={5} 
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white resize-none" 
              value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} 
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30">
            {t('btn_pub')}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredNotices.map(n => (
          <div key={n.id} className={`bg-white dark:bg-slate-900 p-8 rounded-3xl border dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${n.priority === 'urgent' ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-blue-500'}`}>
            {n.priority === 'urgent' && (
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute top-4 -right-4 bg-rose-500 text-white text-[10px] font-bold py-1 px-8 rotate-45 shadow-sm">
                  URGENT
                </div>
              </div>
            )}
            <div className="flex justify-between items-start mb-6">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${n.priority === 'urgent' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                {n.priority === 'urgent' ? <><AlertCircle size={12} /> {t('opt_urg')}</> : <><Info size={12} /> {t('opt_nrm')}</>}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full">{n.date}</span>
                {(user?.role === 'superadmin' || user?.role === 'admin') && (
                  <button 
                    onClick={() => setDeleteId(n.id)}
                    className="flex items-center gap-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-2 py-1 rounded-lg transition-colors font-bold text-xs"
                    title="Delete Notice"
                  >
                    <Trash2 size={14} /> {t('btn_del') || 'Delete'}
                  </button>
                )}
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 leading-tight pr-6">{n.title}</h3>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-bold">
                {n.author?.charAt(0).toUpperCase() || 'A'}
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{n.author}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{n.message}</p>
            </div>
          </div>
        ))}
        {filteredNotices.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            <Bell size={48} className="mb-4 opacity-20" />
            <p className="font-medium">{t('nt_nn')}</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Notice"
        message="Are you sure you want to delete this notice? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
