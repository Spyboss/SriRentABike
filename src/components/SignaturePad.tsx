import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear: () => void;
  signature: string | null;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ 
  onSave, 
  onClear, 
  signature 
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const clearSignature = () => {
    sigCanvas.current?.clear();
    onClear();
  };

  const saveSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const signatureData = sigCanvas.current.toDataURL('image/png');
      onSave(signatureData);
    }
  };

  const handleBegin = () => {
    setIsDrawing(true);
  };

  const handleEnd = () => {
    setIsDrawing(false);
    saveSignature();
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Electronic Signature *
        </label>
        <p className="text-sm text-gray-600 mb-3">
          Please sign in the box below using your finger or mouse
        </p>
      </div>

      {!signature ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
          <div className="relative">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'sigCanvas w-full h-32 border border-gray-300 rounded bg-white cursor-crosshair',
                width: 600,
                height: 128,
              }}
              onBegin={handleBegin}
              onEnd={handleEnd}
              penColor="#000000"
              backgroundColor="#ffffff"
            />
            
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={clearSignature}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                title="Clear signature"
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div className="mt-3 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {isDrawing ? 'Drawing...' : 'Click and drag to sign'}
            </p>
            <button
              type="button"
              onClick={saveSignature}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Signature
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Your Signature</span>
            <button
              type="button"
              onClick={clearSignature}
              className="p-1 text-red-600 hover:text-red-800 transition-colors"
              title="Clear signature"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="border border-gray-200 rounded p-2 bg-gray-50">
            <img 
              src={signature} 
              alt="Signature" 
              className="max-h-20 w-auto mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};