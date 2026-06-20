'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import { QrCode, CheckCircle, AlertCircle, Camera } from 'lucide-react';

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

interface RedemptionResult {
  perk_name: string;
  employee_name: string;
  status: string;
}

declare class BarcodeDetector {
  constructor(options?: { formats: string[] });
  detect(image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<Array<{ rawValue: string }>>;
  static getSupportedFormats(): Promise<string[]>;
}

export default function ScanPage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const processingRef = useRef(false);

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [cameraAllowed, setCameraAllowed] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);

  const resolveCode = useCallback(async (code: string) => {
    if (!code.trim() || processingRef.current) return;
    processingRef.current = true;
    setSubmitting(true);
    setScanState('scanning');
    try {
      const { data } = await api.post('/api/catalog/redeem/scan/', { qr_code: code.trim() });
      setResult(data);
      setScanState('success');
      toast(`✅ Redeemed: ${data.perk_name}`, 'success');
      cancelAnimationFrame(rafRef.current);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (msg?.includes('already')) {
        setErrorMsg('This QR code has already been redeemed.');
      } else if (msg?.includes('expired')) {
        setErrorMsg('This redemption has expired.');
      } else if (msg?.includes('not found') || msg?.includes('belong')) {
        setErrorMsg('QR code not recognised — make sure this employee redeemed one of your perks.');
      } else {
        setErrorMsg(msg || 'Invalid or unrecognised QR code.');
      }
      setScanState('error');
      processingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [toast]);

  // Camera + BarcodeDetector setup
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setCameraAllowed(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Try BarcodeDetector (Chrome 83+, Edge, Safari 17+)
        if ('BarcodeDetector' in window) {
          detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
          setScannerReady(true);
          startScanLoop();
        } else {
          // Fallback: no native detector, manual entry only
          setScannerReady(false);
        }
      } catch {
        setCameraAllowed(false);
      }
    }

    function startScanLoop() {
      async function tick() {
        if (processingRef.current || !videoRef.current || !detectorRef.current) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        if (videoRef.current.readyState >= 2) {
          try {
            const barcodes = await detectorRef.current.detect(videoRef.current);
            if (barcodes.length > 0) {
              await resolveCode(barcodes[0].rawValue);
              return;
            }
          } catch { /* detector not ready yet */ }
        }
        rafRef.current = requestAnimationFrame(tick);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    startCamera();

    return () => {
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [resolveCode]);

  const reset = () => {
    setScanState('idle');
    setResult(null);
    setErrorMsg('');
    setManualCode('');
    processingRef.current = false;
    // Restart scan loop
    if (detectorRef.current && videoRef.current) {
      const tick = async () => {
        if (processingRef.current || !videoRef.current || !detectorRef.current) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        if (videoRef.current.readyState >= 2) {
          try {
            const barcodes = await detectorRef.current.detect(videoRef.current);
            if (barcodes.length > 0) {
              await resolveCode(barcodes[0].rawValue);
              return;
            }
          } catch { /* ignore */ }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  return (
    <AppShell role="provider" pageTitle="Scan QR">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <QrCode size={16} className="text-[#5B5F6B]" />
          <h2 className="text-base font-semibold text-[#15161A]">Redeem employee QR</h2>
        </div>

        {scanState === 'success' && result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-[12px] p-6 text-center fade-up">
            <CheckCircle size={40} className="text-[#1F9D6B] mx-auto mb-3" />
            <p className="text-lg font-semibold text-[#15161A] mb-1">Redeemed!</p>
            <p className="text-sm text-[#5B5F6B] mb-0.5 font-medium">{result.perk_name}</p>
            <p className="text-xs text-[#5B5F6B]">for {result.employee_name}</p>
            <button
              onClick={reset}
              className="mt-5 px-5 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors"
            >
              Scan another
            </button>
          </div>
        )}

        {scanState === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-[12px] p-6 text-center fade-up">
            <AlertCircle size={40} className="text-[#D23B3B] mx-auto mb-3" />
            <p className="text-base font-semibold text-[#15161A] mb-1">Redemption failed</p>
            <p className="text-sm text-[#5B5F6B]">{errorMsg}</p>
            <button
              onClick={reset}
              className="mt-5 px-5 py-2 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-white transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {(scanState === 'idle' || scanState === 'scanning') && (
          <div className="space-y-4">
            {/* Camera viewfinder */}
            <div className="bg-[#15161A] rounded-[12px] overflow-hidden aspect-square relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {cameraAllowed === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Camera size={32} className="text-[#5B5F6B]" />
                  <p className="text-sm text-[#5B5F6B]">Camera access denied</p>
                </div>
              )}

              {cameraAllowed === null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}

              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-52 h-52">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-white rounded-tl-[6px]" />
                  <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-white rounded-tr-[6px]" />
                  <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-white rounded-bl-[6px]" />
                  <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-white rounded-br-[6px]" />
                  {/* Animated scan line */}
                  {scannerReady && scanState !== 'scanning' && (
                    <div className="absolute left-1 right-1 h-[2px] bg-[#3D5AFE]/80 animate-[scanline_2s_linear_infinite]" style={{ top: '50%' }} />
                  )}
                </div>
              </div>

              {/* Status label */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                {scanState === 'scanning' ? (
                  <span className="bg-[#3D5AFE] text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Processing…
                  </span>
                ) : scannerReady ? (
                  <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                    Point camera at QR code
                  </span>
                ) : cameraAllowed ? (
                  <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                    Auto-scan not supported — use manual entry below
                  </span>
                ) : null}
              </div>
            </div>

            {/* Manual fallback */}
            <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-4">
              <p className="text-xs font-medium text-[#5B5F6B] mb-2">Or enter redemption code manually</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') resolveCode(manualCode); }}
                  placeholder="e.g. REDEMPTION:42"
                  className="flex-1 px-3 py-2 text-sm border border-[#E7E9EE] rounded-[8px] focus:border-[#3D5AFE] focus:ring-1 focus:ring-[#3D5AFE] outline-none"
                />
                <button
                  onClick={() => resolveCode(manualCode)}
                  disabled={!manualCode.trim() || submitting}
                  className="px-4 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] disabled:opacity-50 transition-colors"
                >
                  {submitting ? '…' : 'Redeem'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0% { top: 8px; }
          50% { top: calc(100% - 8px); }
          100% { top: 8px; }
        }
      `}</style>
    </AppShell>
  );
}
