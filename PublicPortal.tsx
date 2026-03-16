import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Building2, Eye, ShieldCheck, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export function PublicPortal() {
  const [activeTab, setActiveTab] = useState<'login' | 'about' | 'contact'>('login');
  const { login, loginWithEmail, loginWithUsername } = useAuth();
  const { lang, setLang, t } = useLanguage();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await login();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Try email login first if it looks like an email
      if (username.includes('@')) {
        await loginWithEmail(username, password);
      } else {
        await loginWithUsername(username, password);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'messages'), {
        from: contactForm.name,
        email: contactForm.email,
        message: contactForm.message,
        date: new Date().toISOString()
      });
      setContactSuccess(true);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
      alert('Failed to send message. Please try again later.');
    }
  };

  return (
    <div className="login-wrapper">
      {/* Public Nav */}
      <div className="public-nav flex flex-wrap gap-2 justify-center items-center">
        <div className="flex bg-white/80 dark:bg-slate-800/80 p-1 rounded-full shadow-sm">
          <button 
            onClick={() => setActiveTab('login')}
            className={clsx("px-6 py-2 rounded-full text-sm font-bold transition-all", activeTab === 'login' ? "bg-blue-600 text-white shadow-md" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700")}
          >
            {t('nav_login')}
          </button>
          <button 
            onClick={() => setActiveTab('about')}
            className={clsx("px-6 py-2 rounded-full text-sm font-bold transition-all", activeTab === 'about' ? "bg-blue-600 text-white shadow-md" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700")}
          >
            {t('nav_about')}
          </button>
          <button 
            onClick={() => setActiveTab('contact')}
            className={clsx("px-6 py-2 rounded-full text-sm font-bold transition-all", activeTab === 'contact' ? "bg-blue-600 text-white shadow-md" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700")}
          >
            {t('nav_contact')}
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              className="pl-9 pr-4 py-2.5 bg-white/80 dark:bg-slate-800/80 border-none rounded-full font-semibold text-slate-900 dark:text-white cursor-pointer outline-none text-sm shadow-sm"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="en">English</option>
              <option value="rw">Kinyarwanda</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>
      </div>

      {/* Login Tab */}
      {activeTab === 'login' && (
        <div className="login-card">
          <div className="login-header">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
              <Building2 size={32} />
            </div>
            <h2>Taba Village</h2>
            <h3>{t('login_sub')}</h3>
          </div>
          
          {error && <p className="text-red-500 dark:text-red-400 text-sm mb-4 font-semibold text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">{error}</p>}
          
          <form className="space-y-4 mb-8" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Username or Email</label>
              <input 
                type="text" 
                required
                className="w-full p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or email"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                required
                className="w-full p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400 font-bold">Or continue with</span>
            </div>
          </div>
          
          <div className="text-center">
            <button 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
              Sign in with Google
            </button>
            <p className="mt-6 text-slate-500 dark:text-slate-400 text-sm">
              Authorized staff only. Please use your registered credentials.
            </p>
          </div>
        </div>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-slate-800 to-blue-600 dark:from-slate-900 dark:to-emerald-900 text-white p-16 text-center">
              <h1 className="text-4xl font-bold tracking-tight mb-3">{t('abt_t')}</h1>
              <p className="text-lg text-white/80 font-light">{t('abt_s')}</p>
            </div>
            <div className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:-translate-y-1 hover:shadow-xl transition-all hover:border-blue-500 dark:hover:border-blue-400">
                  <h3 className="text-blue-600 dark:text-blue-400 text-xl font-bold flex items-center gap-3 mb-4">
                    <Building2 size={24} /> Our Mission
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">To provide efficient, transparent, and modern administrative services to all citizens of Taba Village. We are dedicated to maintaining accurate records, ensuring security, and fostering community development through digital transformation.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:-translate-y-1 hover:shadow-xl transition-all hover:border-blue-500 dark:hover:border-blue-400">
                  <h3 className="text-blue-600 dark:text-blue-400 text-xl font-bold flex items-center gap-3 mb-4">
                    <Eye size={24} /> Our Vision
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">A fully digital and connected community where citizen services are accessible, fast, and reliable. We aim to eliminate paperwork queues and bring governance to the fingertips of every resident.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:-translate-y-1 hover:shadow-xl transition-all hover:border-blue-500 dark:hover:border-blue-400">
                  <h3 className="text-blue-600 dark:text-blue-400 text-xl font-bold flex items-center gap-3 mb-4">
                    <ShieldCheck size={24} /> The System
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">This Citizen Information System manages population data, housing, and family records securely in the cloud.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-slate-800 to-blue-600 dark:from-slate-900 dark:to-emerald-900 text-white p-12 text-center">
              <h1 className="text-4xl font-bold tracking-tight mb-3">{t('cnt_t')}</h1>
              <p className="text-lg text-white/80 font-light">{t('cnt_s')}</p>
            </div>
            <div className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-slate-800 dark:text-white text-xl font-bold mb-6">📍 Contact Information</h3>
                  <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Address</h4>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">Taba Village Office, Nyanza Cell, Gatenga Sector, Kicukiro, Kigali.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone</h4>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">+250 788 000 000</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email</h4>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">info@tabavillage.gov.rw</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-slate-800 dark:text-white text-xl font-bold mb-6">✉️ Send a Message</h3>
                  {contactSuccess && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 p-4 rounded-xl border border-blue-200 dark:border-blue-800 mb-6 font-medium">
                      Message sent successfully! We will get back to you soon.
                    </div>
                  )}
                  <form className="space-y-4" onSubmit={handleContactSubmit}>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">{t('t_nam')}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 outline-none transition-all dark:text-white" 
                        required 
                        value={contactForm.name}
                        onChange={e => setContactForm({...contactForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">{t('t_eml')}</label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 outline-none transition-all dark:text-white" 
                        required 
                        value={contactForm.email}
                        onChange={e => setContactForm({...contactForm, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">{t('t_msg')}</label>
                      <textarea 
                        rows={4} 
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 outline-none transition-all resize-none dark:text-white" 
                        required
                        value={contactForm.message}
                        onChange={e => setContactForm({...contactForm, message: e.target.value})}
                      ></textarea>
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-600/30 dark:shadow-blue-500/20 transition-all active:scale-[0.98]">
                      {t('btn_snd')}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
