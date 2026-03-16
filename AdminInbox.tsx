import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { Trash2, Mail, MailOpen, Reply } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export function AdminInbox() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'messages');
    });
    return () => unsub();
  }, []);

  const handleSelectMessage = async (m: any) => {
    setSelectedMessage(m);
    if (!m.isRead) {
      const path = `messages/${m.id}`;
      try {
        await updateDoc(doc(db, 'messages', m.id), { isRead: true });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const path = `messages/${deleteId}`;
      try {
        await deleteDoc(doc(db, 'messages', deleteId));
        if (selectedMessage?.id === deleteId) {
          setSelectedMessage(null);
        }
      } catch (error: any) {
        handleFirestoreError(error, OperationType.DELETE, path);
      } finally {
        setDeleteId(null);
      }
    }
  };

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteId(id);
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !m.isRead;
    if (filter === 'read') return m.isRead;
    return true;
  });
  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{t('inb_t')}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t('inb_s')}</p>
        </div>
        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-1">
          <button 
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            All Messages
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${filter === 'unread' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{unreadCount}</span>
            )}
          </button>
          <button 
            onClick={() => setFilter('read')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${filter === 'read' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            Read
          </button>
        </div>
      </div>
      
      <div className="flex-grow flex gap-6 overflow-hidden">
        {/* Message List */}
        <div className="w-1/3 min-w-[350px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-y-auto flex flex-col">
          {filteredMessages.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm font-medium p-8 text-center">
              <MailOpen size={48} className="mb-4 opacity-20" />
              <p>No messages found in this category.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50 p-2">
              {filteredMessages.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => handleSelectMessage(m)}
                  className={`p-4 m-1 rounded-xl cursor-pointer transition-all relative group ${selectedMessage?.id === m.id ? 'bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-blue-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${!m.isRead ? 'bg-white dark:bg-slate-800/30' : 'opacity-75'}`}
                >
                  {!m.isRead && (
                    <div className="absolute top-5 left-3 w-2 h-2 rounded-full bg-blue-500"></div>
                  )}
                  <div className={`pl-${!m.isRead ? '4' : '0'}`}>
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className={`font-bold truncate pr-4 text-base ${!m.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {m.from}
                      </h4>
                      <span className={`text-xs whitespace-nowrap ${!m.isRead ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                        {new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-2 truncate font-medium flex items-center gap-2">
                      <Mail size={14} className="opacity-50" />
                      {m.email}
                    </div>
                    <p className={`text-sm line-clamp-2 leading-relaxed ${!m.isRead ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                      {m.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Reading Pane */}
        <div className="flex-grow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-y-auto flex flex-col">
          {selectedMessage ? (
            <div className="flex flex-col h-full animate-in fade-in">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{selectedMessage.from}</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      {selectedMessage.email}
                    </a>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {new Date(selectedMessage.date).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`mailto:${selectedMessage.email}`}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Reply"
                  >
                    <Reply size={20} />
                  </a>
                  <button 
                    onClick={(e) => handleDeleteClick(selectedMessage.id, e)}
                    className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all font-bold text-sm border border-rose-100 dark:border-rose-900/50"
                    title="Delete"
                  >
                    <Trash2 size={18} /> Delete Message
                  </button>
                </div>
              </div>
              <div className="p-8 flex-grow">
                <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Mail size={32} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No Message Selected</h3>
              <p className="max-w-xs">Select a message from the list to read its contents.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
