import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agreementsAPI } from '@/services/api';
import { AlertCircle, CheckCircle, FileDown, Loader2, Home, ExternalLink } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function PublicAgreementStatus() {
  const { reference } = useParams<{ reference: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    agreement_no: string;
    status: string;
    pdf_url?: string | null;
    tourist?: { first_name: string; last_name: string } | null;
  } | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!reference) {
        setError('Missing reference');
        setIsLoading(false);
        return;
      }
      setError(null);
      setIsLoading(true);
      try {
        const res = await agreementsAPI.getPublicStatus(reference);
        setData(res.data);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          (err instanceof Error ? err.message : null) ||
          'Failed to load agreement';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [reference]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-white rounded-3xl shadow-xl shadow-stone-200 flex items-center justify-center mb-6">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
        <p className="text-stone-500 font-bold tracking-tight">Checking agreement status...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl shadow-stone-200 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-stone-900 mb-3 tracking-tight">Not Found</h1>
          <p className="text-stone-500 font-medium mb-8 leading-relaxed">
            {error || "We couldn't find the agreement you're looking for. Please check your reference number."}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 min-h-[56px]"
          >
            <Home className="w-5 h-5" />
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = data.status.toLowerCase() === 'completed' || data.status.toLowerCase() === 'active';

  return (
    <div className="min-h-screen bg-stone-50 py-12 md:py-24 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <Logo width={160} />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-stone-100 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />
            <span className="text-xs font-black uppercase tracking-widest text-stone-500">{data.status}</span>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-stone-200 p-8 md:p-12 overflow-hidden relative">
          {/* Background Decorative Element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 rounded-bl-[4rem] -mr-16 -mt-16 transition-all" />

          <div className="relative">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-white">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">Agreement Status</h1>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1">Reference Number</span>
                <div className="text-xl font-bold text-stone-900 bg-stone-50 px-5 py-4 rounded-2xl border border-stone-100">
                  {data.agreement_no}
                </div>
              </div>

              {data.tourist && (
                <div className="grid grid-cols-1 gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1">Renter Name</span>
                  <div className="text-xl font-bold text-stone-900 bg-stone-50 px-5 py-4 rounded-2xl border border-stone-100">
                    {data.tourist.first_name} {data.tourist.last_name}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1">Current Status</span>
                <div className="flex items-center gap-3 bg-stone-50 px-5 py-4 rounded-2xl border border-stone-100">
                  <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <span className="text-xl font-bold text-stone-900 capitalize">{data.status}</span>
                </div>
              </div>

              {data.pdf_url && (
                <div className="pt-4">
                  <a
                    href={data.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 min-h-[56px]"
                  >
                    <FileDown className="w-6 h-6" />
                    Download Signed PDF
                  </a>
                  <p className="text-center text-stone-400 text-xs font-medium mt-4">
                    Secure document generated by Sri Rent A Bike
                  </p>
                </div>
              )}
              
              {!data.pdf_url && (
                <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-orange-900">Document Processing</p>
                      <p className="text-xs font-medium text-orange-700 mt-1">
                        Your signed agreement is being processed. Please refresh this page in a few moments to download your copy.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-900 font-bold transition-all text-sm group"
          >
            <Home className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
