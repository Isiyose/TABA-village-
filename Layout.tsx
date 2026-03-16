import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, Users, FolderOpen, UserPlus, 
  Repeat, Inbox, Bell, HeartPulse, CheckSquare, 
  ShieldAlert, ScrollText, LogOut, Moon, Sun, Palette,
  Check, Building2, Map as MapIcon, BellRing, MessageSquare,
  ChevronDown, ChevronRight, Baby, Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export function Layout({ children, activeTab, setActiveTab }: { children: React.ReactNode, activeTab: string, setActiveTab: (t: string) => void }) {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { isDark, toggleDark, accentColor, setAccentColor } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string, type: string, title: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubMessages = onSnapshot(
      query(collection(db, 'messages'), where('isRead', '==', false)),
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, type: 'message', title: `New message from ${doc.data().from}` }));
        setNotifications(prev => [...prev.filter(n => n.type !== 'message'), ...msgs]);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'messages')
    );

    const unsubTransfers = onSnapshot(
      query(collection(db, 'transfers'), where('status', '==', 'pending')),
      (snapshot) => {
        const trfs = snapshot.docs.map(doc => ({ id: doc.id, type: 'transfer', title: `Pending transfer: ${doc.data().citizenName}` }));
        setNotifications(prev => [...prev.filter(n => n.type !== 'transfer'), ...trfs]);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'transfers')
    );

    return () => {
      unsubMessages();
      unsubTransfers();
    };
  }, [user]);

  if (!user) return null;

  const accentColors: { id: 'blue' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'violet', class: string }[] = [
    { id: 'blue', class: 'bg-blue-500' },
    { id: 'emerald', class: 'bg-emerald-500' },
    { id: 'rose', class: 'bg-rose-500' },
    { id: 'amber', class: 'bg-amber-500' },
    { id: 'indigo', class: 'bg-indigo-500' },
    { id: 'violet', class: 'bg-violet-500' },
  ];

  const navCategories = [
    {
      title: 'Main',
      items: [
        { id: 'home', icon: LayoutDashboard, label: t('sd_dash'), roles: ['superadmin', 'admin', 'viewer'] },
        { id: 'map', icon: MapIcon, label: t('sd_map'), roles: ['superadmin', 'admin'] },
      ]
    },
    {
      title: 'Citizens',
      items: [
        { id: 'data', icon: FolderOpen, label: t('sd_db'), roles: ['superadmin', 'admin', 'viewer'] },
        { id: 'population', icon: Search, label: t('sd_pop') || 'Population Search', roles: ['superadmin', 'admin', 'viewer'] },
        { id: 'form', icon: UserPlus, label: t('sd_reg'), roles: ['superadmin', 'admin'] },
        { id: 'isibo', icon: Building2, label: t('sd_isi') || 'Isibo Directory', roles: ['superadmin', 'admin', 'viewer'] },
        { id: 'transfer', icon: Repeat, label: t('sd_trf') || 'Transfer Citizen', roles: ['superadmin'] },
      ]
    },
    {
      title: 'Services',
      items: [
        { id: 'insurance', icon: HeartPulse, label: t('sd_ins'), roles: ['superadmin', 'admin', 'viewer'] },
        { id: 'umuganda', icon: CheckSquare, label: t('sd_umu'), roles: ['superadmin', 'admin'] },
      ]
    },
    {
      title: 'Administration',
      items: [
        { id: 'inbox', icon: Inbox, label: t('sd_inbox'), roles: ['superadmin', 'admin'] },
        { id: 'notices', icon: Bell, label: t('sd_ntc') || 'Staff Notices', roles: ['superadmin', 'admin'] },
        { id: 'manage-admins', icon: ShieldAlert, label: t('sd_adm') || 'Manage Admins', roles: ['superadmin'], color: 'text-amber-500' },
        { id: 'logs', icon: ScrollText, label: t('sd_log'), roles: ['superadmin', 'admin'] },
      ]
    }
  ];

  const [collapsedCats, setCollapsedCats] = useState<Record<number, boolean>>({});

  const toggleCat = (idx: number) => {
    setCollapsedCats(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="p-6 text-center border-b border-white/10">
          <h2 className="m-0 text-2xl uppercase tracking-wider font-bold">Taba Village</h2>
          <div className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs mt-3 inline-block font-bold capitalize">
            {user.role}
          </div>
        </div>
        <div className="flex-grow pt-4 flex flex-col overflow-y-auto pb-8">
          {navCategories.map((category, catIdx) => {
            const visibleItems = category.items.filter(item => item.roles?.includes(user.role));
            if (visibleItems.length === 0) return null;

            const isCollapsed = collapsedCats[catIdx];

            return (
              <div key={catIdx} className="mb-2">
                <button 
                  onClick={() => toggleCat(catIdx)}
                  className="w-full px-6 py-2 flex items-center justify-between group hover:bg-white/5 transition-colors rounded-lg"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white/60 transition-colors">
                    {category.title}
                  </span>
                  <div className="text-white/20 group-hover:text-white/40 transition-colors">
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>
                
                {!isCollapsed && (
                  <div className="animate-in slide-in-from-top-1 duration-200 space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={twMerge(
                            "nav-link",
                            isActive && "active",
                            item.id === 'manage-admins' && !isActive && "text-amber-500"
                          )}
                        >
                          <Icon size={18} className={isActive ? "icon" : ""} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button 
          onClick={logout}
          className="bg-rose-700 hover:bg-rose-800 text-white border-none p-4 text-sm cursor-pointer transition-colors font-semibold uppercase flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          {t('sd_out')}
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Topbar */}
        <div className="top-bar">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white m-0 tracking-tight capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{t('app_sub')}</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-full cursor-pointer flex items-center justify-center text-slate-800 dark:text-slate-200 transition-all shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 relative"
                title="Notifications"
              >
                <BellRing size={20} className={notifications.length > 0 ? "text-rose-500 animate-pulse" : ""} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{notifications.length} New</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <button 
                          key={n.id}
                          onClick={() => {
                            if (n.type === 'message') setActiveTab('inbox');
                            if (n.type === 'transfer') setActiveTab('transfer');
                            if (n.type === 'notice') setActiveTab('notices');
                            setShowNotifications(false);
                          }}
                          className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700/50 transition-colors flex gap-3 items-start"
                        >
                          <div className={twMerge(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            n.type === 'notice' ? "bg-rose-500" : n.type === 'transfer' ? "bg-amber-500" : "bg-blue-500"
                          )} />
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{n.title}</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{n.type}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-full cursor-pointer flex items-center justify-center text-slate-800 dark:text-slate-200 transition-all shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                title="Change Theme Color"
              >
                <Palette size={20} />
              </button>
              
              {showThemePicker && (
                <div className="absolute right-0 mt-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 flex gap-2 animate-in fade-in zoom-in-95 slide-in-from-top-2">
                  {accentColors.map(color => (
                    <button
                      key={color.id}
                      onClick={() => {
                        setAccentColor(color.id);
                        setShowThemePicker(false);
                      }}
                      className={twMerge(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95",
                        color.class
                      )}
                    >
                      {accentColor === color.id && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select 
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full font-semibold text-slate-800 dark:text-slate-200 cursor-pointer outline-none transition-all shadow-sm"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="en">🇬🇧 EN</option>
              <option value="rw">🇷🇼 RW</option>
              <option value="fr">🇫🇷 FR</option>
            </select>
            <button 
              onClick={toggleDark}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full cursor-pointer flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 transition-all shadow-sm"
            >
              {isDark ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-slate-600" />} 
              {isDark ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="content-section">
          {children}
        </div>
      </div>
    </div>
  );
}
