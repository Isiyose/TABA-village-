import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
          <p className="text-slate-600 dark:text-slate-400">{message}</p>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-500 text-white font-bold rounded-lg hover:bg-rose-600 transition-colors shadow-sm shadow-rose-500/20"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
