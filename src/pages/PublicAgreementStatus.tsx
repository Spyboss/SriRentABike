import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agreementsAPI } from '@/services/api';
import { AlertCircle, CheckCircle, FileDown, Loader2 } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading status...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'Agreement not found'}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-center mb-6">
             <Logo width={120} />
          </div>
          <div className="flex items-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-900">Agreement Status</h1>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Reference</span>
              <span className="font-semibold">{data.agreement_no}</span>
            </div>
            {data.tourist && (
              <div className="flex justify-between">
                <span className="text-gray-600">Name</span>
                <span className="font-semibold">{data.tourist.first_name} {data.tourist.last_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-semibold">{data.status}</span>
            </div>
            {data.pdf_url && (
              <div className="pt-4">
                <a
                  href={data.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Download PDF
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
