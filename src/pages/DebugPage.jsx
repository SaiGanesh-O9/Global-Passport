import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Cpu, RefreshCw, Layers, Activity, FileCheck, CheckCircle } from 'lucide-react';
import { EventBus, EVENTS } from '../core/eventBus/index.js';
import { useAuth } from '../hooks/useAuth.js';
import { useDocuments } from '../hooks/useDocuments.js';

export default function DebugPage() {
  const { role, currentUser } = useAuth();
  const { userVerificationRequests, documents, credentials } = useDocuments();
  const [eventLogs, setEventLogs] = useState([]);
  const [activeObject, setActiveObject] = useState(null);
  const [performanceTimings, setPerformanceTimings] = useState({});

  // Firestore Mock reads/writes counters (persistent across session renders)
  const [firestoreStats, setFirestoreStats] = useState({
    reads: parseInt(localStorage.getItem('unicrypt_debug_fs_reads') || '24'),
    writes: parseInt(localStorage.getItem('unicrypt_debug_fs_writes') || '3')
  });

  useEffect(() => {
    // Event Bus listeners
    const logEvent = (name, detail) => {
      setEventLogs(prev => [
        { time: new Date().toLocaleTimeString(), name, detail: JSON.stringify(detail) },
        ...prev.slice(0, 49)
      ]);
    };

    const unsubOpen = EventBus.subscribe(EVENTS.WORKSPACE_OPEN, (detail) => {
      setActiveObject(detail);
      logEvent('workspace.open', detail);
      setFirestoreStats(prev => {
        const next = { ...prev, reads: prev.reads + 1 };
        localStorage.setItem('unicrypt_debug_fs_reads', next.reads.toString());
        return next;
      });
    });
    
    const unsubClose = EventBus.subscribe(EVENTS.WORKSPACE_CLOSE, (detail) => {
      logEvent('workspace.close', detail);
    });
    const unsubNotify = EventBus.subscribe(EVENTS.NOTIFICATION_SHOW, (detail) => {
      logEvent('notification.show', detail);
    });
    const unsubChanged = EventBus.subscribe(EVENTS.SELECTION_CHANGED, (detail) => {
      logEvent('selection.changed', detail);
    });

    // Capture timing API parameters
    if (window.performance) {
      const [navigation] = performance.getEntriesByType('navigation');
      if (navigation) {
        setPerformanceTimings({
          'DOM Content Loaded': `${Math.round(navigation.domContentLoadedEventEnd - navigation.startTime)} ms`,
          'Load Complete': `${Math.round(navigation.loadEventEnd - navigation.startTime)} ms`,
          'Request Latency': `${Math.round(navigation.responseStart - navigation.requestStart)} ms`
        });
      }
    }

    return () => {
      unsubOpen();
      unsubClose();
      unsubNotify();
      unsubChanged();
    };
  }, []);

  const clearLogs = () => setEventLogs([]);
  
  const resetFirestoreCounters = () => {
    const next = { reads: 0, writes: 0 };
    setFirestoreStats(next);
    localStorage.setItem('unicrypt_debug_fs_reads', '0');
    localStorage.setItem('unicrypt_debug_fs_writes', '0');
  };

  const triggerDemoReset = () => {
    window.dispatchEvent(new CustomEvent('unicrypt-demo-reset'));
    EventBus.dispatch(EVENTS.NOTIFICATION_SHOW, {
      title: 'Demo State Restored',
      message: 'Passport cleared, WES application reset to 87% progress index.',
      type: 'success'
    });
  };

  const featureFlags = [
    { name: 'FEATURE_COMMAND_CENTER', status: 'Active' },
    { name: 'FEATURE_WORKSPACE_PANEL', status: 'Active' },
    { name: 'FEATURE_METRICS_HUB', status: 'Active' },
    { name: 'FEATURE_TOOL_ORCHESTRATION', status: 'Active' },
    { name: 'FEATURE_DYNAMIC_PROVIDERS', status: 'Coming Soon' }
  ];

  const activeJourney = localStorage.getItem('unicrypt_active_journey') || 'Education';
  const missionProgress = localStorage.getItem('unicrypt_mission_progress') || '72';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-6 font-mono selection:bg-blue-500/30">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-sm font-black text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-500 animate-pulse" />
            UNICRYPT_DEBUG_CONSOLE_v1.1
          </h1>
          <p className="text-[10px] text-slate-550 mt-1">
            System parameter audits, telemetry metrics, and Event Bus registers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerDemoReset}
            className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-xs font-black text-rose-300 rounded-lg border border-rose-900/50 cursor-pointer outline-none transition-colors"
          >
            🔄 Reset Demo
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-xs font-bold text-white rounded-lg border border-slate-800 cursor-pointer outline-none transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Panel 1: Telemetry Latency */}
        <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-900 space-y-4">
          <h2 className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase tracking-widest">
            <Activity className="h-4 w-4" /> Telemetry Latency
          </h2>
          <div className="space-y-2 text-xs">
            {Object.entries(performanceTimings).map(([key, val]) => (
              <div key={key} className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-450">{key}</span>
                <span className="text-white font-extrabold">{val}</span>
              </div>
            ))}
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-455">Target Panel Open</span>
              <span className="text-emerald-500 font-extrabold">&lt; 250 ms</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Active Context & Mission */}
        <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-900 space-y-4">
          <h2 className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase tracking-widest">
            <Layers className="h-4 w-4" /> Active Context
          </h2>
          <div className="text-xs space-y-2">
            <div className="border-b border-slate-900 pb-1.5">
              <span className="text-slate-500 block">User Email / Role:</span>
              <span className="text-white font-bold">{currentUser?.email || 'student@localhost'} / {role || 'candidate'}</span>
            </div>
            <div className="border-b border-slate-900 pb-1.5">
              <span className="text-slate-500 block">Current Mission:</span>
              <span className="text-white font-bold">{activeJourney} Application ({missionProgress}% Complete)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Workflow State:</span>
              <span className="text-white font-bold">Standard Prerequisite Checking</span>
            </div>
          </div>
        </div>

        {/* Panel 3: Firestore Database Telemetry */}
        <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-900 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase tracking-widest">
              <FileCheck className="h-4 w-4" /> Firestore Logs
            </h2>
            <button 
              onClick={resetFirestoreCounters}
              className="text-[9px] hover:text-white text-slate-500 cursor-pointer border-none bg-transparent outline-none"
            >
              Reset
            </button>
          </div>
          <div className="text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-450">Firestore Reads</span>
              <span className="text-blue-500 font-extrabold">{firestoreStats.reads}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-450">Firestore Writes</span>
              <span className="text-blue-500 font-extrabold">{firestoreStats.writes}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-455">Credentials Count</span>
              <span className="text-white font-extrabold">{(credentials || []).length}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-455">Documents Count</span>
              <span className="text-white font-extrabold">{(documents || []).length}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-450">Pending Requests</span>
              <span className="text-white font-extrabold">{(userVerificationRequests || []).length}</span>
            </div>
          </div>
        </div>

        {/* Panel 4: Workspace Flags */}
        <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-900 space-y-4">
          <h2 className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase tracking-widest">
            <Shield className="h-4 w-4" /> Feature Flags
          </h2>
          <div className="space-y-2 text-[10px]">
            {featureFlags.map(flag => (
              <div key={flag.name} className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">{flag.name}</span>
                <span className={`font-black ${
                  flag.status === 'Active' ? 'text-emerald-500' : 'text-amber-500'
                }`}>{flag.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Object Properties and Event Logs */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Object Properties Inspector */}
        <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-900 space-y-4 md:col-span-1">
          <h2 className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase tracking-widest">
            <CheckCircle className="h-4 w-4 text-blue-500" /> Workspace Object
          </h2>
          {activeObject ? (
            <div className="text-xs space-y-3">
              <div>
                <span className="text-slate-500 block">Object ID:</span>
                <span className="text-white font-bold bg-slate-900 px-2 py-0.5 rounded">{activeObject.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Type:</span>
                <span className="text-white font-bold uppercase">{activeObject.type}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Title:</span>
                <span className="text-white font-bold">{activeObject.title}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Value / Status:</span>
                <span className="text-emerald-450 font-bold">{activeObject.val || activeObject.status || 'Verified'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Raw Schema:</span>
                <pre className="text-[9px] p-2 bg-slate-950 rounded border border-slate-900 text-slate-400 overflow-x-auto">
                  {JSON.stringify(activeObject, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-[10px] text-slate-555 font-bold uppercase">
              No Object Selected
            </div>
          )}
        </div>

        {/* Event Logs auditing */}
        <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-900 space-y-4 md:col-span-2 flex flex-col">
          <div className="flex justify-between items-center">
            <h2 className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase tracking-widest">
              <Terminal className="h-4 w-4 text-emerald-500" /> Event Bus Registers
            </h2>
            <button
              onClick={clearLogs}
              className="p-1 hover:bg-slate-900 text-slate-400 hover:text-white rounded cursor-pointer border-none bg-transparent outline-none flex items-center gap-1.5 text-[10px] font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Clear logs
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 h-80 overflow-y-auto space-y-2 text-[11px] leading-relaxed flex-1">
            {eventLogs.map((log, idx) => (
              <div key={idx} className="flex gap-4 hover:bg-slate-900/40 py-1 px-2 rounded">
                <span className="text-slate-555 shrink-0">{log.time}</span>
                <span className="text-blue-400 font-extrabold shrink-0">{log.name}</span>
                <span className="text-slate-350 truncate">{log.detail}</span>
              </div>
            ))}
            {eventLogs.length === 0 && (
              <div className="text-center py-24 text-slate-555 text-xs font-bold uppercase">
                Waiting for Event Bus dispatches...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
