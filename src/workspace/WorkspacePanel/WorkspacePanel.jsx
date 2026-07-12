import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { EventBus, EVENTS } from '../../core/eventBus/index.js';
import ObjectRenderer from '../PanelRenderer/ObjectRenderer.jsx';
import ActionRenderer from '../ActionBar/ActionRenderer.jsx';

export default function WorkspacePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeObject, setActiveObject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const panelRef = useRef(null);

  useEffect(() => {
    const handleOpen = (data) => {
      setActiveObject(data);
      setIsOpen(true);
      setActiveTab('overview');
    };

    const handleClose = () => {
      setIsOpen(false);
    };

    const unsubOpen = EventBus.subscribe(EVENTS.WORKSPACE_OPEN, handleOpen);
    const unsubClose = EventBus.subscribe(EVENTS.WORKSPACE_CLOSE, handleClose);

    // Global keyboard listener for Escape key to close the panel
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubOpen();
      unsubClose();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!isOpen || !activeObject) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'ai', label: 'AI Insights' },
    { id: 'history', label: 'History & Audits' },
    { id: 'sources', label: 'Verified Sources' }
  ];

  return (
    <div 
      ref={panelRef}
      className="fixed bottom-6 right-6 z-50 w-[440px] h-[72vh] rounded-[36px] bg-white/90 dark:bg-[#0f111a]/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/40 shadow-2xl flex flex-col overflow-hidden transition-all duration-350 ease-out animate-in slide-in-from-bottom-5"
    >
      {/* 1. Header layout */}
      <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-850/50 flex justify-between items-center flex-shrink-0">
        <div className="space-y-0.5">
          <span className="text-[9px] font-black text-blue-600 dark:text-blue-450 uppercase tracking-widest block">
            {activeObject.type} Workspace
          </span>
          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
            {activeObject.title}
          </h3>
          <p className="text-[10px] text-slate-450 dark:text-slate-455 font-bold">
            {activeObject.subtitle}
          </p>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-450 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Tabs selection bar */}
      <div className="px-5 border-b border-slate-100 dark:border-slate-850/30 flex gap-4 text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3.5 outline-none cursor-pointer border-b-2 transition-all ${
              activeTab === tab.id 
                ? 'border-blue-600 text-slate-950 dark:text-white' 
                : 'border-transparent text-slate-450 hover:text-slate-600'
            }`}
          >
            {tab.id === 'ai' && <Sparkles className="h-3 w-3 inline mr-1 text-blue-500 animate-pulse" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Render content body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <ObjectRenderer activeTab={activeTab} obj={activeObject} />
      </div>

      {/* 4. Action bar footer */}
      <ActionRenderer obj={activeObject} />
    </div>
  );
}
