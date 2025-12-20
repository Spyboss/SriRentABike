import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { agreementsAPI, pdfAPI } from '../services/api';
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Bike,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useBikesStore } from '@/stores/bikes';
import { Logo } from '../components/Logo';

interface Agreement {
  id: string;
  tourist_data: {
    first_name: string;
    last_name: string;
    nationality: string;
    passport_no: string;
    email: string;
    phone_number: string;
    home_address: string;
    hotel_name?: string;
  };
  status: 'pending' | 'completed' | 'expired';
  bike_id?: string;
  signature_url: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export const AgreementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bikeId, setBikeId] = useState('');
  const { available, fetchAvailable } = useBikesStore();
  const [dailyRate, setDailyRate] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [deposit, setDeposit] = useState<number | ''>('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchAgreement();
    fetchAvailable();
  }, [id, user, navigate, fetchAvailable]);

  const fetchAgreement = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await agreementsAPI.getById(id);
      const a = response.data.agreement as {
        id: string;
        status: string;
        bike_id?: string;
        signature_url: string;
        pdf_url?: string;
        created_at: string;
        updated_at: string;
        tourists?: {
          first_name: string;
          last_name: string;
          nationality: string;
          passport_no: string;
          email: string;
          phone_number: string;
          home_address: string;
          hotel_name?: string;
        };
      };
      const normalizedStatus =
        a.status === 'pending' || a.status === 'completed' || a.status === 'expired'
          ? a.status
          : 'pending';
      const mapped: Agreement = {
        id: a.id,
        tourist_data: a.tourists
          ? {
              first_name: a.tourists.first_name,
              last_name: a.tourists.last_name,
              nationality: a.tourists.nationality,
              passport_no: a.tourists.passport_no,
              email: a.tourists.email,
              phone_number: a.tourists.phone_number,
              home_address: a.tourists.home_address,
              hotel_name: a.tourists.hotel_name,
            }
          : {
              first_name: '',
              last_name: '',
              nationality: '',
              passport_no: '',
              email: '',
              phone_number: '',
              home_address: '',
              hotel_name: '',
            },
        status: normalizedStatus,
        bike_id: a.bike_id,
        signature_url: a.signature_url,
        pdf_url: a.pdf_url,
        created_at: a.created_at,
        updated_at: a.updated_at,
      };
      setAgreement(mapped);
      setBikeId(mapped.bike_id || '');
      const dr = (response.data.agreement?.daily_rate as number | undefined);
      if (typeof dr === 'number') {
        setDailyRate(dr);
      }
      const sd = (response.data.agreement?.start_date as string | undefined);
      const ed = (response.data.agreement?.end_date as string | undefined);
      const dp = (response.data.agreement?.deposit as number | undefined);
      if (sd) setStartDate(sd);
      if (ed) setEndDate(ed);
      if (typeof dp === 'number') setDeposit(dp);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to fetch agreement';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBike = async () => {
    if (!id || !agreement) return;
    
    try {
      const payload: Record<string, unknown> = { bike_id: bikeId };
      if (typeof dailyRate === 'number') {
        payload.daily_rate = dailyRate;
      }
      await agreementsAPI.update(id, payload);
      setAgreement({ ...agreement, bike_id: bikeId, status: 'completed' });
      setIsEditing(false);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to update bike assignment';
      alert(msg);
    }
  };

  const handleDownloadPDF = async () => {
    if (!id) return;
    
    try {
      const response = await pdfAPI.download(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agreement-${agreement?.tourist_data?.first_name}-${agreement?.tourist_data?.last_name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF');
    }
  };
  
  const handleGeneratePDF = async () => {
    if (!id) return;
    try {
      const resp = await pdfAPI.generate(id);
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agreement-${agreement?.tourist_data?.first_name}-${agreement?.tourist_data?.last_name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      await fetchAgreement();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-4 h-4 mr-1" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agreement...</p>
        </div>
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error || 'Agreement not found'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Logo width={120} className="mr-4" />
              <h1 className="text-2xl font-bold text-gray-900">Agreement Details</h1>
            </div>
            <div className="flex items-center space-x-4"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Status Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {agreement.tourist_data.first_name} {agreement.tourist_data.last_name}
                </h2>
                {getStatusBadge(agreement.status)}
              </div>
              <div className="text-sm text-gray-500">
                <Calendar className="w-4 h-4 inline mr-1" />
                {new Date(agreement.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Tourist Information */}
          <div className="px-6 py-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-gray-400" />
              Tourist Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {agreement.tourist_data.first_name} {agreement.tourist_data.last_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nationality</label>
                  <p className="mt-1 text-sm text-gray-900">{agreement.tourist_data.nationality}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Passport Number</label>
                  <p className="mt-1 text-sm text-gray-900">{agreement.tourist_data.passport_no}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{agreement.tourist_data.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Phone Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{agreement.tourist_data.phone_number}</p>
                </div>
                {agreement.tourist_data.hotel_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Hotel Name</label>
                    <p className="mt-1 text-sm text-gray-900">{agreement.tourist_data.hotel_name}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-500 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Home Address
              </label>
              <p className="mt-1 text-sm text-gray-900">{agreement.tourist_data.home_address}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-6 border-t border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => (agreement?.pdf_url ? handleDownloadPDF() : handleGeneratePDF())}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                {agreement?.pdf_url ? 'Download PDF' : 'Generate & Download PDF'}
              </button>
            </div>
          </div>
          
          {/* Finalize Details (Admin) */}
          <div className="px-6 py-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Finalize Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!user || user.role !== 'admin'}
                  className={`w-full px-3 py-2 border rounded-md ${(!user || user.role !== 'admin') ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!user || user.role !== 'admin'}
                  className={`w-full px-3 py-2 border rounded-md ${(!user || user.role !== 'admin') ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (LKR)</label>
                <input
                  type="number"
                  value={dailyRate === '' ? '' : dailyRate}
                  onChange={(e) => {
                    const v = e.target.value
                    setDailyRate(v === '' ? '' : Number(v))
                  }}
                  placeholder="5000"
                  disabled={!user || user.role !== 'admin'}
                  className={`w-full px-3 py-2 border rounded-md ${(!user || user.role !== 'admin') ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit (LKR)</label>
                <input
                  type="number"
                  value={deposit === '' ? '' : deposit}
                  onChange={(e) => {
                    const v = e.target.value
                    setDeposit(v === '' ? '' : Number(v))
                  }}
                  disabled={!user || user.role !== 'admin'}
                  className={`w-full px-3 py-2 border rounded-md ${(!user || user.role !== 'admin') ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={async () => {
                  if (!id) return;
                  try {
                    await agreementsAPI.update(id, {
                      start_date: startDate,
                      end_date: endDate,
                      daily_rate: typeof dailyRate === 'number' ? dailyRate : undefined,
                      deposit: typeof deposit === 'number' ? deposit : undefined
                    });
                    await fetchAgreement();
                    alert('Agreement finalized');
                  } catch {
                    alert('Failed to finalize agreement');
                  }
                }}
                disabled={!user || user.role !== 'admin'}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save Final Details
              </button>
            </div>
          </div>
          {/* Bike Assignment */}
          <div className="px-6 py-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Bike className="w-5 h-5 mr-2 text-gray-400" />
                Bike Assignment
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Bikes</label>
                  <select
                    value={bikeId}
                    onChange={(e) => setBikeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a bike</option>
                    {available.map((b) => (
                      <option key={b.id} value={b.id}>{b.model} • {b.plate_no} • {b.frame_no}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Only bikes with status “available” are shown.</p>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (LKR)</label>
                  <input
                    type="number"
                    value={dailyRate === '' ? '' : dailyRate}
                    onChange={(e) => {
                      const v = e.target.value
                      setDailyRate(v === '' ? '' : Number(v))
                    }}
                    placeholder="5000"
                    disabled={!user || user.role !== 'admin'}
                    className={`w-full px-3 py-2 border rounded-md ${(!user || user.role !== 'admin') ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300' : 'border-gray-300'}`}
                    title="Only administrators can modify this rate"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateBike}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setBikeId(agreement.bike_id || '');
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-900">
                {agreement.bike_id ? `Bike #${agreement.bike_id}` : 'No bike assigned yet'}
              </p>
            )}
          </div>

          {/* Signature */}
          {agreement.signature_url && (
            <div className="px-6 py-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Electronic Signature</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <img
                  src={agreement.signature_url}
                  alt="Electronic Signature"
                  className="max-w-xs h-auto border border-gray-200 rounded"
                />
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="px-6 py-6 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <label className="block font-medium">Created</label>
                <p>{new Date(agreement.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="block font-medium">Last Updated</label>
                <p>{new Date(agreement.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
