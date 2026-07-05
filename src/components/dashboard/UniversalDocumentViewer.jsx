import { useState } from 'react';
import Card from '../ui/Card.jsx';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Info,
  History,
  FileText,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function UniversalDocumentViewer({ document, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);

  if (!document) return null;

  const isPdf = document.fileName?.toLowerCase().endsWith('.pdf');
  const fileUrl = document.fileUrl || '';

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-black/90 backdrop-blur-md transition-all duration-200 ${
      isFullscreen ? 'p-0' : 'p-4 sm:p-6'
    }`}>
      <Card className={`bg-white dark:bg-[#12131a] shadow-2xl border border-slate-205 dark:border-slate-800/40 flex flex-col overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'w-screen h-screen rounded-none' : 'w-full max-w-5xl h-[85vh] rounded-2xl'
      }`}>
        {/* Header Toolbar */}
        <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/50 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{document.fileName}</h3>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5">Version {document.version || 1} • Uploaded {document.uploadedAt}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Zoom Controls */}
            {!isPdf && (
              <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                <button
                  onClick={handleZoomOut}
                  className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                  title="Reset Zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* View controls */}
            <button
              onClick={() => setShowMetadata(prev => !prev)}
              className={`p-2 rounded-lg border cursor-pointer ${
                showMetadata 
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' 
                  : 'bg-white dark:bg-slate-800 border-slate-202 dark:border-slate-700 text-slate-500 dark:text-slate-450 hover:bg-slate-50'
              }`}
              title="Toggle Details"
            >
              <Info className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-pointer"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center"
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </a>
            )}

            <span className="w-px bg-slate-200 dark:bg-slate-800 h-6 mx-1"></span>

            <button
              onClick={onClose}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-slate-500 hover:text-rose-600 cursor-pointer"
              title="Close viewer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="flex-1 flex overflow-hidden bg-slate-100 dark:bg-slate-950 relative">
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            {isPdf ? (
              fileUrl ? (
                <iframe
                  src={fileUrl}
                  title="Document Preview"
                  className="w-full h-full max-w-4xl border-0 shadow-lg bg-white rounded-xl"
                />
              ) : (
                <div className="text-center p-8 bg-white dark:bg-[#12131a] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/40 space-y-2">
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">Preview Unavailable</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold max-w-xs">
                    This file is stored in local developer fallback mode without active cloud storage. Click download to access the file resource.
                  </p>
                </div>
              )
            ) : (
              <div 
                className="transition-transform duration-100 ease-out origin-center max-w-full max-h-full"
                style={{ transform: `scale(${zoom})` }}
              >
                <img
                  src={fileUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=600'}
                  alt="Document Preview"
                  className="max-w-[85vw] max-h-[70vh] rounded-xl shadow-lg object-contain bg-white dark:bg-[#12131a] border border-slate-200/50 dark:border-slate-800/35"
                />
              </div>
            )}
          </div>

          {/* Details Sidebar Pane */}
          {showMetadata && (
            <div className="w-80 border-l border-slate-200 dark:border-slate-800/55 bg-white dark:bg-[#12131a] overflow-y-auto p-5 space-y-6 hidden md:block select-none animate-slide-in">
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Document Attributes</span>
                <div className="space-y-2.5 text-xs font-semibold text-slate-655 dark:text-slate-350 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-850">
                  <div className="flex justify-between">
                    <span>Format</span>
                    <span className="font-bold text-slate-950 dark:text-white uppercase">{isPdf ? 'PDF File' : 'Image'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Version</span>
                    <span className="font-bold text-slate-950 dark:text-white">{document.version || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upload Mode</span>
                    <span className="font-bold text-slate-950 dark:text-white uppercase">{document.uploadMode || 'cloud'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Status</span>
                    <span className="font-bold text-slate-950 dark:text-white uppercase">{document.storageStatus || 'enabled'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  <History className="h-3.5 w-3.5" />
                  <span>Audit History logs</span>
                </div>
                
                <div className="space-y-3.5 border-l border-slate-200 dark:border-slate-800/60 pl-3 ml-1.5">
                  <div className="relative text-[11px] leading-relaxed">
                    <span className="absolute -left-[17.5px] top-1 h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0"></span>
                    <p className="font-bold text-slate-850 dark:text-slate-250">File Hash Generated</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold mt-0.5">SHA-256 Checksum locked securely in records.</p>
                  </div>
                  <div className="relative text-[11px] leading-relaxed">
                    <span className="absolute -left-[17.5px] top-1 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20 shrink-0"></span>
                    <p className="font-bold text-slate-850 dark:text-slate-250">Document Uploaded</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold mt-0.5">Created version 1 details on {document.uploadedAt}.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
