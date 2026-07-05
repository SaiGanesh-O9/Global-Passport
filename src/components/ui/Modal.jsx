import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Card from './Card.jsx';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-200" ref={modalRef}>
        <Card className={`p-6 sm:p-8 bg-white dark:bg-[#0f1016] border border-slate-200 dark:border-slate-805 shadow-2xl relative max-h-[90vh] overflow-y-auto ${className}`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors duration-150 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4.5 w-4.5" />
          </button>
          
          {title && (
            <h3 className="text-lg font-bold text-slate-950 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              {title}
            </h3>
          )}
          
          <div className="mt-2">{children}</div>
        </Card>
      </div>
    </div>
  );
}
