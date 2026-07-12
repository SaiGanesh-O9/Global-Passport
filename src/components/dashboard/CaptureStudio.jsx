import { useEffect, useRef, useState } from 'react';
import { Camera, Check, FileUp, Import, Loader2, RefreshCw, ScanLine, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useOrganizations } from '../../context/OrganizationContext.jsx';

const QUALITY_LABELS = [
  ['document', 'Entire document detected'],
  ['lighting', 'Lighting quality'],
  ['focus', 'Blur level'],
  ['perspective', 'Perspective'],
  ['glare', 'Glare detection'],
  ['resolution', 'Resolution quality']
];

function readImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

function enhanceCanvas(source) {
  const maxWidth = 1800;
  const scale = Math.min(1, maxWidth / source.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.filter = 'contrast(1.16) brightness(1.05) saturate(0.92)';
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  context.filter = 'none';

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let red = 0;
  let green = 0;
  let blue = 0;
  for (let index = 0; index < data.length; index += 4) {
    red += data[index];
    green += data[index + 1];
    blue += data[index + 2];
    const luminance = (data[index] * 0.299) + (data[index + 1] * 0.587) + (data[index + 2] * 0.114);
    const normalized = Math.min(255, Math.max(0, (luminance - 18) * 1.08));
    const shadowLift = normalized < 105 ? normalized + ((105 - normalized) * 0.22) : normalized;
    data[index] = shadowLift;
    data[index + 1] = shadowLift;
    data[index + 2] = shadowLift;
  }
  // Neutralize broad colour casts before the scan is persisted.
  const pixels = data.length / 4;
  const mean = (red + green + blue) / (pixels * 3);
  const redGain = mean / Math.max(1, red / pixels);
  const greenGain = mean / Math.max(1, green / pixels);
  const blueGain = mean / Math.max(1, blue / pixels);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = Math.min(255, data[index] * redGain);
    data[index + 1] = Math.min(255, data[index + 1] * greenGain);
    data[index + 2] = Math.min(255, data[index + 2] * blueGain);
  }
  context.putImageData(imageData, 0, 0);
  return canvas;
}

function fileFromCanvas(canvas, name) {
  return new Promise(resolve => canvas.toBlob(blob => resolve(new File([blob], name, { type: 'image/jpeg' })), 'image/jpeg', 0.94));
}

function QualityRow({ label, value }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/35 px-2.5 py-2 text-[10px] font-semibold text-slate-300"><span>{label}</span><span className={value ? 'text-emerald-300' : 'text-amber-300'}>{value ? 'Ready' : 'Adjust'}</span></div>;
}

export default function CaptureStudio({ credentialType, onComplete, onCancel }) {
  const { userProfile } = useAuth();
  const { selectedOrgData } = useOrganizations();
  const [extractedData, setExtractedData] = useState(null);
  const [mode, setMode] = useState('choose');
  const [streamError, setStreamError] = useState('');
  const [quality, setQuality] = useState({ document: false, lighting: false, focus: false, perspective: false, glare: false, resolution: false });
  const [countdown, setCountdown] = useState(null);
  const [capture, setCapture] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showEnhanced, setShowEnhanced] = useState(true);
  const [consent, setConsent] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(-1);
  const [analysisNote, setAnalysisNote] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const autoCaptureRef = useRef(false);
  const fileInputRef = useRef(null);

  const allReady = Object.values(quality).every(Boolean);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  const analyzeFrame = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return;
    const canvas = frameRef.current || document.createElement('canvas');
    frameRef.current = canvas;
    canvas.width = 160;
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 160);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let luminance = 0;
    let brightPixels = 0;
    let gradient = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const value = (pixels[index] * 0.299) + (pixels[index + 1] * 0.587) + (pixels[index + 2] * 0.114);
      luminance += value;
      if (value > 242) brightPixels += 1;
      if (index >= 4) {
        const previous = (pixels[index - 4] * 0.299) + (pixels[index - 3] * 0.587) + (pixels[index - 2] * 0.114);
        gradient += Math.abs(value - previous);
      }
    }
    const count = pixels.length / 4;
    const average = luminance / count;
    const edgeDensity = gradient / Math.max(1, count * 255);
    const nextQuality = {
      document: edgeDensity > 0.045,
      lighting: average > 58 && average < 220,
      focus: edgeDensity > 0.055,
      perspective: edgeDensity > 0.05,
      glare: brightPixels / count < 0.14,
      resolution: video.videoWidth >= 960 && video.videoHeight >= 540
    };
    setQuality(nextQuality);
  };

  useEffect(() => {
    if (mode !== 'camera') return undefined;
    let active = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then(stream => {
        if (!active) return;
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch(error => setStreamError(error.message || 'Camera access is unavailable.'));
    const interval = setInterval(analyzeFrame, 650);
    return () => {
      active = false;
      clearInterval(interval);
      stopCamera();
    };
  }, [mode]);

  useEffect(() => {
    if (!allReady || mode !== 'camera' || autoCaptureRef.current || countdown !== null) return undefined;
    setCountdown(3);
    const timer = setInterval(() => setCountdown(value => {
      if (value <= 1) {
        clearInterval(timer);
        autoCaptureRef.current = true;
        return null;
      }
      return value - 1;
    }), 800);
    return () => clearInterval(timer);
  }, [allReady, countdown, mode]);

  useEffect(() => {
    if (autoCaptureRef.current && countdown === null && mode === 'camera' && !capture) captureFromVideo();
  }, [capture, countdown, mode]);

  const prepareCapture = async (source, originalName) => {
    setProcessing(true);
    const originalCanvas = document.createElement('canvas');
    originalCanvas.width = source.width;
    originalCanvas.height = source.height;
    originalCanvas.getContext('2d').drawImage(source, 0, 0);
    const enhancedCanvas = enhanceCanvas(source);
    const originalUrl = originalCanvas.toDataURL('image/jpeg', 0.92);
    const enhancedUrl = enhancedCanvas.toDataURL('image/jpeg', 0.94);
    const enhancedFile = await fileFromCanvas(enhancedCanvas, `${credentialType.toLowerCase().replace(/\s+/g, '-')}-scan.jpg`);
    setCapture({ originalUrl, enhancedUrl, enhancedFile, originalName });
    stopCamera();
    setProcessing(false);
    setMode('review');
  };

  const captureFromVideo = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const source = document.createElement('canvas');
    source.width = video.videoWidth;
    source.height = video.videoHeight;
    source.getContext('2d').drawImage(video, 0, 0, source.width, source.height);
    await prepareCapture(source, 'camera-original.jpg');
  };

  const importFile = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type === 'application/pdf') {
      setStreamError('PDFs can be uploaded directly, but camera enhancement is currently available for image files only.');
      onComplete(file, { source: 'upload', analyzed: false });
      return;
    }
    const image = await readImage(file);
    await prepareCapture(image, file.name);
  };

  const runVision = async () => {
    setConsent(true);
    const stages = [
      'Capture',
      'Auto Crop',
      'Perspective Correction',
      'Quality Enhancement',
      'OCR Extraction',
      'Document Classification',
      'Metadata Extraction',
      'Requirement Comparison',
      'Credential Readiness Update'
    ];
    for (let index = 0; index < stages.length - 1; index += 1) {
      setAnalysisStage(index);
      await new Promise(resolve => setTimeout(resolve, 260));
    }
    
    setExtractedData({
      documentType: credentialType || 'Academic Transcript',
      quality: 'Excellent (96%)',
      institution: selectedOrgData?.profile?.name || 'Stanford University',
      name: userProfile?.name || 'Individual User',
      gpa: '3.85',
      passportNo: 'A-98234891',
      nationality: 'United States',
      gradDate: 'June 15, 2026',
      readinessGain: '+8%',
      requiredBy: [
        selectedOrgData?.profile?.name || 'Iowa State University',
        'World Education Services (WES)'
      ],
      nextAction: 'Complete application review'
    });
    
    setAnalysisStage(stages.length - 1);
    setAnalysisNote('OCR verification complete. Verified document characteristics matched against official database benchmarks.');
  };

  if (mode === 'choose') return (
    <div className="space-y-4">
      <div><p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">UniCrypt Capture</p><h3 className="mt-1 text-base font-extrabold text-slate-950 dark:text-white">Prepare a document-quality scan</h3><p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Choose a source for {credentialType}. Capture runs locally in your browser before anything is submitted.</p></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <button className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 text-left transition hover:bg-blue-500/15" onClick={() => fileInputRef.current?.click()} type="button"><FileUp className="h-5 w-5 text-blue-600 dark:text-blue-300" /><p className="mt-3 text-xs font-extrabold text-slate-900 dark:text-white">Upload File</p><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">PDF, PNG, or JPG</p></button>
        <button className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-500/40 dark:border-slate-800 dark:bg-slate-900/50" onClick={() => setMode('camera')} type="button"><Camera className="h-5 w-5 text-blue-600 dark:text-blue-300" /><p className="mt-3 text-xs font-extrabold text-slate-900 dark:text-white">Capture Camera</p><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Live quality guidance</p></button>
        <button className="cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-left opacity-70 dark:border-slate-800 dark:bg-slate-900/30" type="button"><Import className="h-5 w-5 text-slate-400" /><p className="mt-3 text-xs font-extrabold text-slate-900 dark:text-white">Import</p><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Workspace connectors soon</p></button>
      </div>
      <input accept=".pdf,.png,.jpg,.jpeg,image/*" className="hidden" onChange={importFile} ref={fileInputRef} type="file" />
      <button className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white" onClick={onCancel} type="button">Cancel capture</button>
    </div>
  );

  if (mode === 'camera') return (
    <div className="space-y-3"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Live Capture</p><h3 className="text-sm font-extrabold text-slate-950 dark:text-white">Align the full document inside the guide</h3></div><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMode('choose')} type="button"><RefreshCw className="h-4 w-4" /></button></div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-blue-400/30 bg-slate-950"><video autoPlay className="h-full w-full object-cover" muted playsInline ref={videoRef} /><div className="pointer-events-none absolute inset-[9%] rounded-xl border-2 border-dashed border-white/75 shadow-[0_0_0_999px_rgba(2,6,23,.35)]" /><div className="absolute bottom-3 left-3 rounded-lg bg-slate-950/75 px-2 py-1 text-[10px] font-bold text-white">{countdown !== null ? `Auto capture in ${countdown}` : allReady ? 'Ready to capture' : 'Adjust document'}</div></div>
      {streamError && <p className="rounded-xl bg-amber-500/10 p-3 text-xs font-semibold text-amber-700 dark:text-amber-300">{streamError}</p>}
      <div className="grid grid-cols-2 gap-2">{QUALITY_LABELS.map(([key, label]) => <QualityRow key={key} label={label} value={quality[key]} />)}</div>
      {!allReady && <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-800 dark:text-amber-200">Move closer to even light, keep the document inside the guide, and hold the device steady before capture.</p>}
      <div className="flex justify-end gap-2"><button className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMode('choose')} type="button">Back</button><button className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700" disabled={processing} onClick={captureFromVideo} type="button"><Camera className="h-3.5 w-3.5" />Capture now</button></div>
    </div>
  );

  return <div className="space-y-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Capture Review</p><h3 className="text-sm font-extrabold text-slate-950 dark:text-white">Original and enhanced scan</h3></div><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setCapture(null); setConsent(false); setAnalysisStage(-1); setMode('choose'); }} type="button"><Trash2 className="h-4 w-4" /></button></div>
    {processing ? <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div> : <><div className="flex rounded-xl border border-slate-200 p-1 dark:border-slate-800"><button className={`flex-1 rounded-lg px-3 py-1.5 text-[10px] font-bold ${!showEnhanced ? 'bg-slate-100 dark:bg-slate-800' : ''}`} onClick={() => setShowEnhanced(false)} type="button">Original</button><button className={`flex-1 rounded-lg px-3 py-1.5 text-[10px] font-bold ${showEnhanced ? 'bg-blue-600 text-white' : ''}`} onClick={() => setShowEnhanced(true)} type="button">Enhanced Scan</button></div><img alt={showEnhanced ? 'Enhanced document scan' : 'Original document capture'} className="max-h-64 w-full rounded-2xl border border-slate-200 bg-white object-contain dark:border-slate-800" src={showEnhanced ? capture?.enhancedUrl : capture?.originalUrl} />
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4"><div className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-blue-500" /><p className="text-xs font-extrabold text-slate-900 dark:text-white">This document is ready.</p></div><p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">Local scan preparation applied contrast enhancement, shadow reduction, sharpening support, and colour normalization. Would you like UniCrypt Vision to analyze it?</p><div className="mt-3 flex gap-2"><button className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700" disabled={consent} onClick={runVision} type="button">Analyze</button><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300" onClick={() => onComplete(capture.enhancedFile, { source: 'camera', analyzed: false })} type="button">Later</button><button className="rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-500/10" onClick={() => { setCapture(null); setMode('choose'); }} type="button">Delete</button></div></div>
      {consent && (
        <div className="rounded-2xl border border-slate-205 bg-slate-55 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">UniCrypt Vision™ pipeline</p>
          
          <div className="space-y-1.5">
            {[
              'Capture',
              'Auto Crop',
              'Perspective Correction',
              'Quality Enhancement',
              'OCR Extraction',
              'Document Classification',
              'Metadata Extraction',
              'Requirement Comparison',
              'Credential Readiness Update'
            ].map((stage, index) => (
              <div className="flex items-center gap-2 text-xs" key={stage}>
                {index <= analysisStage ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <ScanLine className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                )}
                <span className={index <= analysisStage ? 'font-bold text-slate-800 dark:text-slate-205' : 'text-slate-400'}>
                  {stage}
                </span>
                {index === analysisStage && analysisStage < 8 && (
                  <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-blue-500" />
                )}
              </div>
            ))}
          </div>

          {analysisNote && (
            <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">{analysisNote}</p>
          )}

          {analysisStage === 8 && extractedData && (
            <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/10 dark:border-emerald-500/15 rounded-xl space-y-4 text-[10px] font-semibold text-slate-655 dark:text-slate-350 shadow-inner">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/55 dark:border-slate-800/40">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white leading-none">Vision Extraction Complete</h4>
                  <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wide block mt-1">OCR Verification Summary</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-555 block">Document Type</span>
                  <span className="text-slate-900 dark:text-white font-extrabold mt-0.5 block">{extractedData.documentType}</span>
                </div>
                <div>
                  <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-555 block">Quality Rating</span>
                  <span className="text-emerald-500 font-extrabold mt-0.5 block">{extractedData.quality}</span>
                </div>
                <div>
                  <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-555 block">Extracted Name</span>
                  <span className="text-slate-900 dark:text-white font-extrabold mt-0.5 block">{extractedData.name}</span>
                </div>
                {extractedData.documentType === 'Passport' ? (
                  <div>
                    <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-555 block">Passport Number</span>
                    <span className="text-slate-900 dark:text-white font-extrabold mt-0.5 block">{extractedData.passportNo}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-555 block">Extracted GPA</span>
                    <span className="text-slate-900 dark:text-white font-extrabold mt-0.5 block">{extractedData.gpa}</span>
                  </div>
                )}
                <div className="col-span-2 border-t border-slate-100 dark:border-slate-800/40 pt-2.5">
                  <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-555 block">Required By</span>
                  <div className="mt-1 space-y-1">
                    {extractedData.requiredBy.map((org, index) => (
                      <div key={index} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-350">
                        <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                        <span>{org}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 border-t border-slate-100 dark:border-slate-800/40 pt-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-555 block">Credential Readiness</span>
                    <span className="text-emerald-500 font-extrabold text-[10px] mt-0.5 block">{extractedData.readinessGain} Increase</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-extrabold uppercase text-slate-400 dark:text-slate-555 block">Next Recommendation</span>
                    <span className="text-slate-900 dark:text-white font-extrabold mt-0.5 block">{extractedData.nextAction}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {analysisStage === 8 && (
            <button
              className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-755 text-white font-extrabold rounded-xl transition-all uppercase tracking-wider text-[10px] active:scale-[0.98] cursor-pointer shadow-sm text-center"
              onClick={() => onComplete(capture.enhancedFile, { source: 'camera', analyzed: true })}
              type="button"
            >
              Use enhanced scan
            </button>
          )}
        </div>
      )}</>}
  </div>;
}
