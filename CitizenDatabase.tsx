import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, FileText, Download, Eye, X, Printer, UserCircle, CheckSquare, Archive, RotateCcw } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { generateCertificate, generateIDCard, exportToExcel } from '../utils/exportUtils';
import { logAction } from '../utils/logUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function CitizenDatabase() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [citizens, setCitizens] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewCitizen, setViewCitizen] = useState<any | null>(null);
  const [activeView, setActiveView] = useState<'active' | 'archived'>('active');
  const [restoreId, setRestoreId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'citizens'), (snapshot) => {
      const allCitizens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitizens(allCitizens);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'citizens');
    });
    return () => unsub();
  }, []);

  const confirmDelete = async () => {
    if (deleteId) {
      const citizen = citizens.find(c => c.id === deleteId);
      const path = `citizens/${deleteId}`;
      try {
        await updateDoc(doc(db, 'citizens', deleteId), { 
          isArchived: true,
          archivedAt: new Date().toISOString(),
          archivedBy: user?.email
        });

        await logAction(
          db,
          user?.username || user?.email || 'Unknown',
          'Archive Citizen',
          `Archived citizen: ${citizen?.firstName} ${citizen?.lastName} (${citizen?.nationalId})`
        );
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } finally {
        setDeleteId(null);
      }
    }
  };

  const confirmRestore = async () => {
    if (restoreId) {
      const citizen = citizens.find(c => c.id === restoreId);
      const path = `citizens/${restoreId}`;
      try {
        await updateDoc(doc(db, 'citizens', restoreId), { 
          isArchived: false,
          restoredAt: new Date().toISOString(),
          restoredBy: user?.email
        });

        await logAction(
          db,
          user?.username || user?.email || 'Unknown',
          'Restore Citizen',
          `Restored citizen: ${citizen?.firstName} ${citizen?.lastName} (${citizen?.nationalId})`
        );
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } finally {
        setRestoreId(null);
      }
    }
  };

  const handleUpdatePhoto = async () => {
    try {
      await updateDoc(doc(db, 'citizens', viewCitizen.id), { photoUrl: viewCitizen.photoUrl });
      
      await logAction(
        db,
        user?.username || user?.email || 'Unknown',
        'Update Photo',
        `Updated photo for citizen: ${viewCitizen.firstName} ${viewCitizen.lastName}`
      );
      
      alert('Photo updated!');
    } catch (e) {
      alert('Failed to update photo');
    }
  };

  const handleExportExcel = () => {
    const data = citizens.map(c => ({
      'First Name': c.firstName,
      'Last Name': c.lastName,
      'National ID': c.nationalId,
      'Phone': c.phone,
      'Marital Status': c.marital,
      'Isibo': c.isibo,
      'Housing Type': c.housingType,
      'Insurance': c.insurance,
      'Umuganda Count': c.umugandaDates?.length || 0
    }));
    exportToExcel(data, 'Citizen_Database');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Citizen Database - Taba Village`, 14, 15);
    
    const tableData = citizens.map(c => [
      `${c.firstName} ${c.lastName}`,
      c.nationalId,
      c.phone,
      c.isibo,
      c.insurance || 'None'
    ]);

    autoTable(doc, {
      head: [['Name', 'National ID', 'Phone', 'Isibo', 'Insurance']],
      body: tableData,
      startY: 20,
    });

    doc.save('Citizen_Database.pdf');
  };

  const filtered = citizens.filter(c => {
    const matchesSearch = `${c.firstName || ''} ${c.lastName || ''} ${c.nationalId || ''} ${c.certificateNumber || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesView = activeView === 'active' ? !c.isArchived : c.isArchived;
    return matchesSearch && matchesView;
  });

  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="animate-in fade-in">
      <div className="table-container mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white m-0">{t('sd_db')}</h3>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setActiveView('active')}
                className={`text-sm font-bold pb-1 border-b-2 transition-all ${activeView === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Active Citizens
              </button>
              <button 
                onClick={() => setActiveView('archived')}
                className={`text-sm font-bold pb-1 border-b-2 transition-all ${activeView === 'archived' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Archived Records
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Search by Name, ID or Certificate..." 
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50 dark:bg-slate-800 dark:text-white transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 px-4 py-2 rounded-xl font-bold transition-colors text-sm"
              >
                <FileText size={16}/> PDF
              </button>
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-4 py-2 rounded-xl font-bold transition-colors text-sm"
              >
                <Download size={16}/> Excel
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="p-4 rounded-tl-xl">{t('t_nam')}</th>
                <th className="p-4">{t('t_nid')}</th>
                <th className="p-4">{t('t_phn')}</th>
                <th className="p-4">Certificate</th>
                <th className="p-4">{t('t_mar')}</th>
                <th className="p-4">{t('t_isn')}</th>
                <th className="p-4">{t('t_typ')}</th>
                <th className="p-4">{t('t_ins')}</th>
                <th className="p-4">{t('t_umu')}</th>
                <th className="p-4 rounded-tr-xl">{t('t_act')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4">
                    <button 
                      onClick={() => setViewCitizen(c)}
                      className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                    >
                      {c.firstName} {c.lastName}
                    </button>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-sm">{c.nationalId}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">
                    {c.phone}
                    {c.phoneOwnership && c.phoneOwnership !== 'Own' && (
                      <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                        {t(`ph_${c.phoneOwnership.toLowerCase().substring(0, 2)}`)}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {c.hasCertificate ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            generateCertificate(c);
                          }}
                          className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                          title="Download Certificate"
                        >
                          <CheckSquare size={14} /> {c.certificateNumber || 'Download'}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium italic">Not Issued</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{c.marital || 'Single'}</td>
                  <td className="p-4 text-primary-600 dark:text-primary-400 font-bold">{c.isibo}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{c.housingType}</td>
                  <td className="p-4">
                    <span className="badge bg-green">
                      {c.insurance || 'None'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="badge bg-blue">
                      {c.umugandaDates?.length || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setViewCitizen(c)}
                        className="text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/30 p-2 rounded-lg transition-colors" 
                        title="View Profile"
                      >
                        <Eye size={16}/>
                      </button>
                      {user?.role !== 'viewer' && (
                        <>
                          {activeView === 'active' ? (
                            <button onClick={() => setDeleteId(c.id)} className="text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 p-2 rounded-lg transition-colors" title="Archive">
                              <Archive size={16}/>
                            </button>
                          ) : (
                            <button onClick={() => setRestoreId(c.id)} className="text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 p-2 rounded-lg transition-colors" title="Restore">
                              <RotateCcw size={16}/>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="p-12 text-center text-slate-500 dark:text-slate-400">No citizens found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Citizen Details Modal (Special View) */}
      {viewCitizen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="sticky top-0 z-10 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-primary-50 dark:bg-primary-900/20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-2xl text-primary-600 dark:text-primary-400">
                  <UserCircle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white m-0">
                    {viewCitizen.firstName} {viewCitizen.lastName}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm m-0">Citizen Profile Details</p>
                </div>
              </div>
              <button 
                onClick={() => setViewCitizen(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                {viewCitizen.photoUrl ? (
                  <img 
                    src={viewCitizen.photoUrl} 
                    alt="Citizen" 
                    className="w-32 h-32 rounded-2xl object-cover shadow-lg mb-4"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 mb-4">
                    <UserCircle size={64} />
                  </div>
                )}
                <div className="w-full">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Update Photo</label>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setViewCitizen({ ...viewCitizen, photoUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    <button 
                      onClick={handleUpdatePhoto}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <DetailItem label="National ID" value={viewCitizen.nationalId} />
                <DetailItem 
                  label="Phone Number" 
                  value={viewCitizen.phoneOwnership && viewCitizen.phoneOwnership !== 'Own' 
                    ? `${viewCitizen.phone} (${t(`ph_${viewCitizen.phoneOwnership.toLowerCase().substring(0, 2)}`)})` 
                    : viewCitizen.phone
                  } 
                />
                <DetailItem label="Date of Birth" value={viewCitizen.dob} />
                <DetailItem label="Gender" value={viewCitizen.gender} />
                <DetailItem label="Marital Status" value={viewCitizen.marital} />
              </div>
              <div className="space-y-4 md:col-span-2 grid grid-cols-2 gap-4">
                <DetailItem label="Isibo" value={viewCitizen.isibo} />
                <DetailItem label="Housing Type" value={viewCitizen.housingType} />
                <DetailItem label="Insurance" value={viewCitizen.insurance} />
                <DetailItem label="Certificate No" value={viewCitizen.certificateNumber} />
              </div>

              {/* Children Section */}
              {viewCitizen.children && viewCitizen.children.length > 0 && (
                <div className="md:col-span-2 space-y-4 mt-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Children Information</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {viewCitizen.children.map((child: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{child.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {child.gender} • {calculateAge(child.dob)} years old
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${child.livesWithParent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                            {child.livesWithParent ? 'Lives with Parent' : 'Lives Elsewhere'}
                          </span>
                          {child.nationalId && <p className="text-[10px] text-slate-400 mt-1 font-mono">{child.nationalId}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white px-2">Official Documents</h4>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => generateIDCard({
                    firstName: viewCitizen.firstName,
                    lastName: viewCitizen.lastName,
                    name: `${viewCitizen.firstName} ${viewCitizen.lastName}`,
                    nationalId: viewCitizen.nationalId,
                    dob: viewCitizen.dob,
                    isibo: viewCitizen.isibo,
                    photoUrl: viewCitizen.photoUrl
                  })}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Printer size={18} /> Download Citizen Card
                </button>
                <button 
                  onClick={() => generateCertificate({
                    firstName: viewCitizen.firstName,
                    lastName: viewCitizen.lastName,
                    name: `${viewCitizen.firstName} ${viewCitizen.lastName}`,
                    nationalId: viewCitizen.nationalId,
                    dob: viewCitizen.dob,
                    isibo: viewCitizen.isibo,
                    photoUrl: viewCitizen.photoUrl
                  })}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  <FileText size={18} /> Download Certificate of Residence
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Archive Citizen"
        message="Are you sure you want to archive this citizen? They will be moved to the archive section."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmModal
        isOpen={!!restoreId}
        title="Restore Citizen"
        message="Are you sure you want to restore this citizen to the active database?"
        onConfirm={confirmRestore}
        onCancel={() => setRestoreId(null)}
      />
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-slate-800 dark:text-slate-200 font-medium">{value || 'N/A'}</p>
    </div>
  );
}