import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';

export function RegistrationForm() {
  const { t } = useLanguage();
  const [isibos, setIsibos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleName: '', dob: '', gender: '', nationalId: '', phone: '', phoneOwnership: 'Own', isibo: '', housingType: 'Homeowner', marital: 'Single',
    llName: '', llGender: '', llId: '', llPhone: '',
    spName: '', spGender: '', spId: '', spPhone: '', spDob: '',
    children: [] as { name: string, gender: string, dob: string, livesWithParent: boolean, currentLocation?: string, nationalId?: string, phone?: string }[],
    photoUrl: '',
    hasCertificate: false,
    certificateNumber: '',
    registeredAt: new Date().toISOString().split('T')[0]
  });

  const addChild = () => {
    setFormData({
      ...formData,
      children: [...formData.children, { name: '', gender: '', dob: '', livesWithParent: true }]
    });
  };

  const removeChild = (index: number) => {
    const newChildren = [...formData.children];
    newChildren.splice(index, 1);
    setFormData({ ...formData, children: newChildren });
  };

  const updateChild = (index: number, field: string, value: any) => {
    const newChildren = [...formData.children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setFormData({ ...formData, children: newChildren });
  };

  const [citizensCount, setCitizensCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'isibos'), (snapshot) => {
      setIsibos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'isibos');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'citizens'), (snapshot) => {
      setCitizensCount(snapshot.size);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (formData.hasCertificate && !formData.certificateNumber) {
      const nextNum = (citizensCount + 1).toString().padStart(3, '0');
      setFormData(prev => ({ ...prev, certificateNumber: `IJ${nextNum}` }));
    }
  }, [formData.hasCertificate, citizensCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting citizen data:', formData);
    try {
      await addDoc(collection(db, 'citizens'), {
        ...formData,
        approvalStatus: 'approved',
        residency: 'Still in Cell',
        isArchived: false,
        registeredAt: new Date().toISOString()
      });
      alert('Citizen registered successfully!');
      setFormData({ 
        firstName: '', lastName: '', middleName: '', dob: '', gender: '', nationalId: '', phone: '', phoneOwnership: 'Own', isibo: '', housingType: 'Homeowner', marital: 'Single',
        llName: '', llGender: '', llId: '', llPhone: '',
        spName: '', spGender: '', spId: '', spPhone: '', spDob: '',
        children: [],
        photoUrl: '',
        hasCertificate: false,
        certificateNumber: '',
        registeredAt: new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'citizens');
      alert('Failed to register citizen.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto animate-in fade-in">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{t('reg_t')}</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_fnam')}</label>
          <input required type="text" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_lnam')}</label>
          <input required type="text" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_mnam')}</label>
          <input type="text" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white" value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_dob')}</label>
          <input required type="date" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_gen')}</label>
          <select required className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
            <option value="">{t('opt_sel')}</option>
            <option value="Male">{t('opt_male')}</option>
            <option value="Female">{t('opt_female')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-blue-500 dark:text-blue-400 uppercase mb-2">{t('lbl_nid')}</label>
          <input required type="text" maxLength={16} minLength={16} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-bold text-blue-500 dark:text-blue-400 uppercase mb-2">{t('lbl_phn')}</label>
          <div className="flex flex-col gap-2">
            <input required type="text" maxLength={10} minLength={10} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <select required className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white" value={formData.phoneOwnership} onChange={e => setFormData({...formData, phoneOwnership: e.target.value})}>
              <option value="Own">{t('ph_own')}</option>
              <option value="Spouse">{t('ph_sp')}</option>
              <option value="Parent">{t('ph_pa')}</option>
              <option value="Friend">{t('ph_fr')}</option>
            </select>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-amber-500 dark:text-amber-400 uppercase mb-2">{t('lbl_isn')}</label>
          <select required className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.isibo} onChange={e => setFormData({...formData, isibo: e.target.value})}>
            <option value="">Select Isibo...</option>
            {isibos.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-rose-500 dark:text-rose-400 uppercase mb-2">{t('lbl_typ')}</label>
          <select required className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.housingType} onChange={e => setFormData({...formData, housingType: e.target.value})}>
            <option value="Homeowner">{t('st_own')}</option>
            <option value="Tenant">{t('st_ten')}</option>
          </select>
        </div>

        <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
          <h3 className="text-blue-600 dark:text-blue-400 font-bold mb-4">Certificate of Residence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="hasCertificate"
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={formData.hasCertificate} 
                onChange={e => setFormData({...formData, hasCertificate: e.target.checked})} 
              />
              <label htmlFor="hasCertificate" className="text-sm font-bold text-slate-700 dark:text-slate-300">Has Certificate of Residence?</label>
            </div>
            {formData.hasCertificate && (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Certificate Number</label>
                <input type="text" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.certificateNumber} onChange={e => setFormData({...formData, certificateNumber: e.target.value})} />
              </div>
            )}
          </div>
        </div>

        {formData.housingType === 'Tenant' && (
          <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
            <h3 className="text-rose-500 dark:text-rose-400 font-bold mb-4">{t('ll_t')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_fnm')}</label>
                <input type="text" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.llName} onChange={e => setFormData({...formData, llName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_gen')}</label>
                <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.llGender} onChange={e => setFormData({...formData, llGender: e.target.value})}>
                  <option value="">{t('opt_sel')}</option>
                  <option value="Male">{t('opt_male')}</option>
                  <option value="Female">{t('opt_female')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_nid')}</label>
                <input type="text" maxLength={16} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.llId} onChange={e => setFormData({...formData, llId: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_phn')}</label>
                <input type="text" maxLength={10} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.llPhone} onChange={e => setFormData({...formData, llPhone: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_mar')}</label>
          <select required className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.marital} onChange={e => setFormData({...formData, marital: e.target.value})}>
            <option value="Single">{t('st_sin')}</option>
            <option value="Married">{t('st_mar')}</option>
            <option value="Divorced">{t('st_div')}</option>
            <option value="Widowed">{t('st_wid')}</option>
          </select>
        </div>

        {['Married', 'Divorced', 'Widowed'].includes(formData.marital) && (
          <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
            <h3 className="text-slate-800 dark:text-white font-bold mb-4">{t('fam_t')}</h3>
            <h4 className="text-blue-500 dark:text-blue-400 text-sm font-bold mb-2">
              {formData.marital === 'Married' ? t('fam_sp') : 'Spouse / Current Partner'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_fnm')}</label>
                <input type="text" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.spName} onChange={e => setFormData({...formData, spName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_gen')}</label>
                <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.spGender} onChange={e => setFormData({...formData, spGender: e.target.value})}>
                  <option value="">{t('opt_sel')}</option>
                  <option value="Male">{t('opt_male')}</option>
                  <option value="Female">{t('opt_female')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_dob')}</label>
                <input type="date" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.spDob} onChange={e => setFormData({...formData, spDob: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_nid')}</label>
                <input type="text" maxLength={16} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.spId} onChange={e => setFormData({...formData, spId: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_phn')}</label>
                <input type="text" maxLength={10} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white" value={formData.spPhone} onChange={e => setFormData({...formData, spPhone: e.target.value})} />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-blue-500 dark:text-blue-400 text-sm font-bold">{t('fam_ch')}</h4>
              <button 
                type="button" 
                onClick={addChild}
                className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors"
              >
                + Add Another Child
              </button>
            </div>

            <div className="space-y-4">
              {formData.children.map((child, index) => (
                <div key={index} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 relative group">
                  <button 
                    type="button" 
                    onClick={() => removeChild(index)}
                    className="absolute top-2 right-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:text-white" value={child.name} onChange={e => updateChild(index, 'name', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gender</label>
                      <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:text-white" value={child.gender} onChange={e => updateChild(index, 'gender', e.target.value)}>
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">DOB</label>
                      <input type="date" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:text-white" value={child.dob} onChange={e => updateChild(index, 'dob', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ID (Optional)</label>
                      <input type="text" maxLength={16} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:text-white" value={child.nationalId} onChange={e => updateChild(index, 'nationalId', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone (Optional)</label>
                      <input type="text" maxLength={10} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:text-white" value={child.phone} onChange={e => updateChild(index, 'phone', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input 
                        type="checkbox" 
                        id={`livesWith-${index}`}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600"
                        checked={child.livesWithParent} 
                        onChange={e => updateChild(index, 'livesWithParent', e.target.checked)} 
                      />
                      <label htmlFor={`livesWith-${index}`} className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Lives with Parent?</label>
                    </div>
                    {!child.livesWithParent && (
                      <div className="lg:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Current Location / Status</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Studying in Kigali, Living in Rubavu..."
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 dark:text-white" 
                          value={child.currentLocation || ''} 
                          onChange={e => updateChild(index, 'currentLocation', e.target.value)} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {formData.children.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">No children added yet.</p>
              )}
            </div>
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Citizen Photo</label>
          <div className="flex items-center gap-4">
            {formData.photoUrl && (
              <img src={formData.photoUrl} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
            )}
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setFormData({ ...formData, photoUrl: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="flex-grow text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('lbl_rdt')}</label>
          <input required type="date" className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-white" value={formData.registeredAt} onChange={e => setFormData({...formData, registeredAt: e.target.value})} />
        </div>

        <div className="md:col-span-2 mt-4">
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98]">
            {t('btn_sav')}
          </button>
        </div>
      </form>
    </div>
  );
}