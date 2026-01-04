import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw, Check, X } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signature: string | null) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
    setSignatureData(null);
    onSave(null);
  };

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const data = sigCanvas.current.toDataURL('image/png');
      setSignatureData(data);
      setIsEmpty(false);
      onSave(data);
    }
  };

  // Resize handling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && sigCanvas.current) {
        const canvas = sigCanvas.current.getCanvas();
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = containerRef.current.offsetWidth * ratio;
        canvas.height = containerRef.current.offsetHeight * ratio;
        canvas.getContext('2d')?.scale(ratio, ratio);
        sigCanvas.current.clear(); // Clear on resize to avoid distortion
        setIsEmpty(true);
        setSignatureData(null);
        onSave(null);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full space-y-4">
      <div 
        ref={containerRef}
        className="relative w-full h-48 bg-white rounded-2xl overflow-hidden touch-none"
      >
        <SignatureCanvas
          ref={sigCanvas}
          onEnd={handleEnd}
          canvasProps={{
            className: 'w-full h-full cursor-crosshair'
          }}
          penColor="#1c1917" // stone-900
          backgroundColor="rgba(0,0,0,0)"
        />
        
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-stone-300 text-sm font-medium">Sign here...</p>
          </div>
        )}

        <div className="absolute top-3 right-3 flex gap-2">
          {!isEmpty && (
            <button
              type="button"
              onClick={clear}
              className="p-3 bg-white/90 backdrop-blur shadow-sm border border-stone-200 rounded-xl text-stone-600 hover:text-red-600 transition-all active:scale-95"
              title="Clear"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {!isEmpty && (
        <div className="flex items-center gap-2 text-green-600 text-xs font-bold uppercase tracking-wider bg-green-50 w-fit px-3 py-1.5 rounded-full border border-green-100">
          <Check className="w-3.5 h-3.5" />
          Signature Captured
        </div>
      )}
    </div>
  );
};