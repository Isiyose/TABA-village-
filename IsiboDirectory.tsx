import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Download, FileText, Plus, Edit2, Trash2, Eye, X, Users } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { exportToExcel } from '../utils/exportUtils';
import { logAction } from '../utils/logUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function IsiboDirectory() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isibos, setIsibos] = useState<any[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIsibo, setEditingIsibo] = useState<any>(null);
  const [newIsibo, setNewIsibo] = useState({ name: '', leader: '', phone: '', lat: '', lng: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMembers, setViewMembers] = useState<any | null>(null);

  useEffect(() => {
    const unsubIsibos = onSnapshot(collection(db, 'isibos'), (snapshot) => {
      setIsibos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'isibos');
    });
    const unsubCitizens = onSnapshot(collection(db, 'citizens'), (snapshot) => {
      const activeCitizens = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((c: any) => c.residency === 'Still in Cell' && c.approvalStatus === 'approved' && !c.isArchived);
      setCitizens(activeCitizens);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'citizens');
    });
    return () => {
      unsubIsibos();
      unsubCitizens();
    };
  }, []);

  const handleAddIsibo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isiboData = {
        ...newIsibo,
        lat: newIsibo.lat ? parseFloat(newIsibo.lat) : null,
        lng: newIsibo.lng ? parseFloat(newIsibo.lng) : null
      };
      if (editingIsibo) {
        await updateDoc(doc(db, 'isibos', editingIsibo.id), isiboData);
        await logAction(
          db,
          user?.username || user?.email || 'Unknown',
          'Update Isibo',
          `Updated Isibo: ${isiboData.name}`
        );
      } else {
        await addDoc(collection(db, 'isibos'), isiboData);
        await logAction(
          db,
          user?.username || user?.email || 'Unknown',
          'Create Isibo',
          `Created Isibo: ${isiboData.name}`
        );
      }
      setShowAddModal(false);
      setEditingIsibo(null);
      setNewIsibo({ name: '', leader: '', phone: '', lat: '', lng: '' });
    } catch (error: any) {
      handleFirestoreError(error, editingIsibo ? OperationType.UPDATE : OperationType.CREATE, editingIsibo ? `isibos/${editingIsibo.id}` : 'isibos');
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const isibo = isibos.find(i => i.id === deleteId);
      const path = `isibos/${deleteId}`;
      try {
        await deleteDoc(doc(db, 'isibos', deleteId));
        await logAction(
          db,
          user?.username || user?.email || 'Unknown',
          'Delete Isibo',
          `Deleted Isibo: ${isibo?.name || deleteId}`
        );
      } catch (error: any) {
        handleFirestoreError(error, OperationType.DELETE, path);
      } finally {
        setDeleteId(null);
      }
    }
  };

  const openEditModal = (isibo: any) => {
    setEditingIsibo(isibo);
    setNewIsibo({ 
      name: isibo.name, 
      leader: isibo.leader, 
      phone: isibo.phone,
      lat: isibo.lat?.toString() || '',
      lng: isibo.lng?.toString() || ''
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setEditingIsibo(null);
    setNewIsibo({ name: '', leader: '', phone: '', lat: '', lng: '' });
  };

  const handleExportExcel = () => {
    const data = isibos.map(i => ({
      'Isibo Name': i.name,
      'Leader Name': i.leader,
      'Leader Phone': i.phone,
      'Total Citizens': citizens.filter(c => c.isibo === i.name).length
    }));
    exportToExcel(data, 'Isibo_Directory');
  };

  const handleExportPDF = () => {
    const docPDF = new jsPDF();
    docPDF.text(`Isibo Directory - Taba Cell`, 14, 15);
    
    const tableData = isibos.map(i => [
      i.name,
      i.leader,
      i.phone,
      citizens.filter(c => c.isibo === i.name).length.toString()
    ]);

    autoTable(docPDF, {
      head: [['Isibo Name', 'Leader', 'Phone', 'Total Citizens']],
      body: tableData,
      startY: 20,
    });

    docPDF.save('Isibo_Directory.pdf');
  };

  const totalIsibos = isibos.length;
  const totalLeaders = isibos.filter(i => i.leader).length;
  const totalCitizens = citizens.length;

  return (
    <div className="animate-in fade-in">
      <div className="bg-gradient-to-r from-slate-800 to-blue-700 dark:from-slate-900 dark:to-blue-900 p-8 rounded-3xl text-white mb-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">{t('is_t')}</h2>
          <p className="text-white/80">{t('is_s')}</p>
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
          {user?.role !== 'viewer' && (
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/40 text-sm">
              <Plus size={16}/> {t('btn_ad_is')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('is_s_tt')}</div>
          <div className="text-4xl font-extrabold text-slate-800 dark:text-white">{totalIsibos}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('is_s_ld')}</div>
          <div className="text-4xl font-extrabold text-primary-500 dark:text-primary-400">{totalLeaders}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('is_s_ct')}</div>
          <div className="text-4xl font-extrabold text-emerald-500 dark:text-emerald-400">{totalCitizens}</div>
        </div>
      </div>

      <div className="table-container">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white m-0">{t('is_l_t')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="p-4 rounded-tl-xl">{t('t_isn')}</th>
                <th className="p-4">{t('t_ldn')}</th>
                <th className="p-4">{t('t_ldp')}</th>
                <th className="p-4">{t('t_tct')}</th>
                <th className="p-4 rounded-tr-xl">{t('t_act')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isibos.map(i => {
                const isiboMembers = citizens.filter(c => c.isibo === i.name);
                return (
                  <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="p-4 font-bold text-primary-600 dark:text-primary-400">{i.name}</td>
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{i.leader}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{i.phone}</td>
                    <td className="p-4">
                      <span className="badge bg-blue">
                        {isiboMembers.length}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setViewMembers({ name: i.name, members: isiboMembers })}
                          className="text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/30 p-2 rounded-lg transition-colors"
                          title="View Members"
                        >
                          <Eye size={16} />
                        </button>
                        {user?.role !== 'viewer' && (
                          <>
                            <button 
                              onClick={() => openEditModal(i)}
                              className="text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 p-2 rounded-lg transition-colors"
                              title="Edit Isibo"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => setDeleteId(i.id)}
                              className="text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 p-2 rounded-lg transition-colors"
                              title="Delete Isibo"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {isibos.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500 dark:text-slate-400">No Isibos found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Isibo Members Modal (Special View) */}
      {viewMembers && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-primary-50 dark:bg-primary-900/20">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-2xl text-primary-600 dark:text-primary-400">
                  <Users size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white m-0">
                    Isibo: {viewMembers.name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm m-0">List of Citizens in this Isibo</p>
                </div>
              </div>
              <button 
                onClick={() => setViewMembers(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-0 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">National ID</th>
                    <th className="p-4">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {viewMembers.members.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{m.firstName} {m.lastName}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-sm">{m.nationalId}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{m.phone}</td>
                    </tr>
                  ))}
                  {viewMembers.members.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-center text-slate-500">No members found in this Isibo.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setViewMembers(null)}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingIsibo ? 'Edit Isibo' : t('btn_ad_is')}</h3>
              <button onClick={closeAddModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddIsibo} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('t_isn')}</label>
                  <input required type="text" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 dark:bg-slate-800 dark:text-white" value={newIsibo.name} onChange={e => setNewIsibo({...newIsibo, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('t_ldn')}</label>
                  <input required type="text" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 dark:bg-slate-800 dark:text-white" value={newIsibo.leader} onChange={e => setNewIsibo({...newIsibo, leader: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('t_ldp')}</label>
                  <input required type="text" maxLength={10} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 dark:bg-slate-800 dark:text-white" value={newIsibo.phone} onChange={e => setNewIsibo({...newIsibo, phone: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Latitude</label>
                    <input type="number" step="any" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 dark:bg-slate-800 dark:text-white" value={newIsibo.lat} onChange={e => setNewIsibo({...newIsibo, lat: e.target.value})} placeholder="-1.94" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Longitude</label>
                    <input type="number" step="any" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 dark:bg-slate-800 dark:text-white" value={newIsibo.lng} onChange={e => setNewIsibo({...newIsibo, lng: e.target.value})} placeholder="30.15" />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={closeAddModal} className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  {t('btn_cnl')}
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30">
                  {t('btn_sav')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Isibo"
        message="Are you sure you want to delete this Isibo? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}