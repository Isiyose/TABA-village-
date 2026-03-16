import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { Search, Baby, Users, Phone, MapPin, User, UserPlus, Calendar, Printer, X } from 'lucide-react';

type Role = 'child' | 'husband' | 'wife' | 'all';

export function PopulationSearch() {
  const { t } = useLanguage();
  const [citizens, setCitizens] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role>('all');
  const [ageRange, setAgeRange] = useState({ min: '', max: '' });

  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'citizens'), (snapshot) => {
      setCitizens(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((c: any) => !c.isArchived));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'citizens');
    });
    return () => unsub();
  }, []);

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Prepare data based on roles
  const getPopulationData = () => {
    const data: any[] = [];

    citizens.forEach(citizen => {
      // Husband (Registered Parent)
      const husbandAge = calculateAge(citizen.dob);
      data.push({
        id: citizen.id,
        name: `${citizen.firstName} ${citizen.lastName}`,
        phone: citizen.phone || 'N/A',
        phoneOwnership: citizen.phoneOwnership || 'Own',
        nationalId: citizen.nationalId || 'N/A',
        isibo: citizen.isibo,
        age: husbandAge,
        role: 'husband',
        gender: citizen.gender,
        hasCertificate: citizen.hasCertificate,
        certificateNumber: citizen.certificateNumber
      });

      // Wife (Spouse)
      if (citizen.spName) {
        const wifeAge = citizen.spDob ? calculateAge(citizen.spDob) : null;
        data.push({
          id: `${citizen.id}-spouse`,
          name: citizen.spName,
          phone: citizen.spPhone || citizen.phone || 'N/A',
          nationalId: citizen.spId || citizen.spNationalId || 'N/A',
          isibo: citizen.isibo,
          age: wifeAge,
          role: 'wife',
          gender: citizen.gender === 'Male' ? 'Female' : 'Male',
          hasCertificate: citizen.hasCertificate, // Assuming household certificate covers spouse
          certificateNumber: citizen.certificateNumber
        });
      }

      // Children
      if (citizen.children) {
        citizen.children.forEach((child: any, idx: number) => {
          const childAge = calculateAge(child.dob);
          data.push({
            id: `${citizen.id}-child-${idx}`,
            name: child.name,
            phone: child.phone || citizen.phone || 'N/A',
            nationalId: child.nationalId || 'N/A',
            isibo: citizen.isibo,
            age: childAge,
            role: 'child',
            gender: child.gender,
            currentLocation: child.currentLocation || 'N/A',
            hasCertificate: false, // Children usually don't have separate residence certificates
            certificateNumber: ''
          });
        });
      }
    });

    return data;
  };

  const allData = getPopulationData();

  const filteredData = allData.filter(person => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = person.name.toLowerCase().includes(searchLower) || 
                         person.nationalId.toLowerCase().includes(searchLower);
    
    const matchesRole = roleFilter === 'all' || person.role === roleFilter;
    
    let matchesAge = true;
    if (ageRange.min !== '') {
      matchesAge = matchesAge && (person.age !== null && person.age >= parseInt(ageRange.min));
    }
    if (ageRange.max !== '') {
      matchesAge = matchesAge && (person.age !== null && person.age <= parseInt(ageRange.max));
    }

    return matchesSearch && matchesRole && matchesAge;
  });

  return (
    <div className="animate-in fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{t('pop_t')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('pop_s')}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{t('lbl_role')}</label>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setRoleFilter('all')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${roleFilter === 'all' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                All
              </button>
              <button 
                onClick={() => setRoleFilter('child')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${roleFilter === 'child' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('opt_child')}
              </button>
              <button 
                onClick={() => setRoleFilter('husband')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${roleFilter === 'husband' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('opt_husband')}
              </button>
              <button 
                onClick={() => setRoleFilter('wife')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${roleFilter === 'wife' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('opt_wife')}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{t('lbl_age_range')}:</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Min" 
              className="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
              value={ageRange.min}
              onChange={(e) => setAgeRange(prev => ({ ...prev, min: e.target.value }))}
            />
            <span className="text-slate-400">-</span>
            <input 
              type="number" 
              placeholder="Max" 
              className="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
              value={ageRange.max}
              onChange={(e) => setAgeRange(prev => ({ ...prev, max: e.target.value }))}
            />
            <select 
              className="ml-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
              onChange={(e) => {
                const [min, max] = e.target.value.split('-');
                setAgeRange({ min: min || '', max: max || '' });
              }}
              value={`${ageRange.min}-${ageRange.max}`}
            >
              <option value="-">Custom</option>
              <option value="0-5">0-5 (Infants)</option>
              <option value="6-12">6-12 (Children)</option>
              <option value="13-17">13-17 (Teens)</option>
              <option value="18-35">18-35 (Youth)</option>
              <option value="36-60">36-60 (Adults)</option>
              <option value="61-120">60+ (Seniors)</option>
              <option value="20-30">20-30 (Specific Range)</option>
            </select>
          </div>
          <button 
            onClick={() => { setAgeRange({ min: '', max: '' }); setRoleFilter('all'); setSearchTerm(''); }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 ml-auto"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-bottom border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('t_nam')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Age</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('t_phn')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('t_nid')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('t_isn')}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredData.map((person) => (
                <tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        person.role === 'child' ? 'bg-blue-50 text-blue-600' : 
                        person.role === 'husband' ? 'bg-emerald-50 text-emerald-600' : 
                        'bg-purple-50 text-purple-600'
                      }`}>
                        {person.role === 'child' ? <Baby size={16} /> : <User size={16} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{person.name}</span>
                        {person.role === 'child' && person.currentLocation && person.currentLocation !== 'N/A' && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">Lives in: {person.currentLocation}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      person.role === 'child' ? 'bg-blue-100 text-blue-700' : 
                      person.role === 'husband' ? 'bg-emerald-100 text-emerald-700' : 
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {person.role === 'child' ? t('opt_child') : person.role === 'husband' ? t('opt_husband') : t('opt_wife')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{person.age ?? 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{person.phone}</span>
                      {person.phoneOwnership && person.phoneOwnership !== 'Own' && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">
                          {t(`ph_${person.phoneOwnership.toLowerCase().substring(0, 2)}`)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{person.nationalId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{person.isibo}</span>
                  </td>
                  <td className="px-6 py-4">
                    {person.hasCertificate && (
                      <button 
                        onClick={() => { setSelectedPerson(person); setShowCertificate(true); }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Print Certificate"
                      >
                        <Printer size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="py-20 text-center">
            <Search size={48} className="mx-auto mb-4 text-slate-300 opacity-20" />
            <p className="text-slate-500 font-medium">No results found matching your filters.</p>
          </div>
        )}
      </div>

      {showCertificate && selectedPerson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Certificate of Residence</h3>
              <button onClick={() => setShowCertificate(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <div id="certificate-content" className="p-12 bg-white text-black font-serif">
              <div className="border-4 border-double border-slate-800 p-8">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold uppercase mb-2">Republic of Rwanda</h1>
                  <h2 className="text-xl font-bold uppercase mb-4">City of Kigali / Gasabo District</h2>
                  <h3 className="text-lg font-bold uppercase border-b-2 border-slate-800 pb-2 inline-block">Taba Cell Administration</h3>
                </div>

                <div className="flex justify-between mb-8">
                  <div>
                    <p className="font-bold">No: <span className="text-blue-600">{selectedPerson.certificateNumber}</span></p>
                  </div>
                  <div>
                    <p className="font-bold">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-6 text-lg leading-relaxed">
                  <h4 className="text-xl font-bold text-center underline mb-6">CERTIFICATE OF RESIDENCE</h4>
                  
                  <p>
                    This is to certify that <strong>{selectedPerson.name}</strong>, 
                    holder of National ID No: <strong>{selectedPerson.nationalId}</strong>, 
                    is a recognized resident of <strong>Taba Cell</strong>, 
                    living in <strong>{selectedPerson.isibo} Isibo</strong>.
                  </p>

                  <p>
                    This certificate is issued to facilitate administrative processes and 
                    confirm the residency status of the aforementioned citizen within our jurisdiction.
                  </p>
                </div>

                <div className="mt-16 flex justify-between items-end">
                  <div className="text-center">
                    <div className="w-32 h-32 border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 uppercase mb-2">
                      Official Stamp
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-slate-800 pt-2 w-48">
                      <p className="font-bold">Cell Executive Secretary</p>
                      <p className="text-sm italic">Signature & Date</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
              <button 
                onClick={() => setShowCertificate(false)}
                className="px-6 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  const printContent = document.getElementById('certificate-content');
                  const windowUrl = 'about:blank';
                  const uniqueName = new Date().getTime();
                  const windowName = 'Print' + uniqueName;
                  const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');
                  
                  if (printWindow && printContent) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Certificate - ${selectedPerson.name}</title>
                          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                          <style>
                            @media print {
                              body { padding: 0; margin: 0; }
                              .no-print { display: none; }
                            }
                            body { font-family: 'Georgia', serif; }
                          </style>
                        </head>
                        <body>
                          ${printContent.innerHTML}
                          <script>
                            window.onload = function() {
                              window.print();
                              window.close();
                            }
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                  }
                }}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
              >
                Print Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
