'use client';

import { useEffect, useRef, useState } from 'react';
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

export default function ScanPage() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [cameraAllowed, setCameraAllowed] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Request camera permission
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        setCameraAllowed(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => setCameraAllowed(false));

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
  }, []);

  const resolveCode = async (code: string) => {
    if (!code.trim()) return;
    setSubmitting(true);
    setScanState('scanning');
    try {
      const { data } = await api.post('/api/catalog/redeem/scan/', { qr_code: code });
      setResult(data);
      setScanState('success');
      toast(`Redeemed: ${data.perk_name}`, 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (msg?.includes('already')) {
        setErrorMsg('This QR code has already been redeemed.');
      } else if (msg?.includes('expired')) {
        setErrorMsg('This redemption has expired.');
      } else {
        setErrorMsg('Invalid or unrecognized QR code.');
      }
      setScanState('error');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setScanState('idle');
    setResult(null);
    setErrorMsg('');
    setManualCode('');
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
            <p className="text-lg font-semibold text-[#15161A] mb-1">Redeemed</p>
            <p className="text-sm text-[#5B5F6B] mb-0.5">{result.perk_name}</p>
            <p className="text-xs text-[#5B5F6B]">for {result.employee_name}</p>
            <button onClick={reset} className="mt-5 px-5 py-2 rounded-[8px] bg-[#3D5AFE] text-white text-sm font-semibold hover:bg-[#2E45C4] transition-colors">
              Scan another
            </button>
          </div>
        )}

        {scanState === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-[12px] p-6 text-center fade-up">
            <AlertCircle size={40} className="text-[#D23B3B] mx-auto mb-3" />
            <p className="text-base font-semibold text-[#15161A] mb-1">Redemption failed</p>
            <p className="text-sm text-[#5B5F6B]">{errorMsg}</p>
            <button onClick={reset} className="mt-5 px-5 py-2 rounded-[8px] border border-[#E7E9EE] text-sm font-medium text-[#5B5F6B] hover:bg-white transition-colors">
              Try again
            </button>
          </div>
        )}

        {(scanState === 'idle' || scanState === 'scanning') && (
          <div className="space-y-4">
            {/* Camera viewfinder */}
            <div className="bg-[#15161A] rounded-[12px] overflow-hidden aspect-square relative">
              {cameraAllowed === true && (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
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
                <div className="w-48 h-48 border-2 border-white/60 rounded-[8px]">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-[6px]" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-[6px]" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-[6px]" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-[6px]" />
                </div>
              </div>
            </div>

            {/* Manual fallback */}
            <div className="bg-white rounded-[12px] border border-[#E7E9EE] p-4">
              <p className="text-xs font-medium text-[#5B5F6B] mb-2">Or enter code manually</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') resolveCode(manualCode); }}
                  placeholder="Paste redemption code"
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
    </AppShell>
  );
}
