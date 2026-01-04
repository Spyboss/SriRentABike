import React, { useCallback, useEffect, useState } from 'react';
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
  X,
  Settings2,
  Loader2
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
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
  const { user, logout } = useAuthStore();
  
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

  const fetchAgreement = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchAgreement();
    fetchAvailable();
  }, [fetchAgreement, user, navigate, fetchAvailable]);

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
      await fetchAgreement();
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
            <CheckCircle className="w-3 h-3 mr-1.5" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
            <Clock className="w-3 h-3 mr-1.5" />
            Pending
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3 mr-1.5" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
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
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <Navbar isAdmin userEmail={user.email} onLogout={logout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
            <p className="text-stone-500 font-medium">Loading agreement details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <Navbar isAdmin userEmail={user.email} onLogout={logout} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-8 text-center border border-stone-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-2">Oops!</h2>
            <p className="text-stone-600 mb-8">{error || 'Agreement not found'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-colors shadow-lg shadow-stone-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      <Navbar isAdmin userEmail={user.email} onLogout={logout} />

      <div className="max-w-4xl mx-auto px-4 pt-24 md:pt-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2.5 bg-white border border-stone-200 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-stone-900">
                  {agreement.tourist_data.first_name} {agreement.tourist_data.last_name}
                </h1>
                {getStatusBadge(agreement.status)}
              </div>
              <p className="text-stone-500 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Submitted on {new Date(agreement.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </p>
            </div>
          </div>

          <button
            onClick={() => (agreement?.pdf_url ? handleDownloadPDF() : handleGeneratePDF())}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 min-h-[48px]"
          >
            <Download className="w-5 h-5" />
            {agreement?.pdf_url ? 'Download PDF' : 'Generate PDF'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Tourist Details Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-stone-900">Tourist Information</h2>
            </div>
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <DetailItem label="Full Name" value={`${agreement.tourist_data.first_name} ${agreement.tourist_data.last_name}`} icon={User} />
                <DetailItem label="Nationality" value={agreement.tourist_data.nationality} icon={MapPin} />
                <DetailItem label="Passport Number" value={agreement.tourist_data.passport_no} icon={ArrowLeft} />
                <DetailItem label="Email Address" value={agreement.tourist_data.email} icon={Mail} />
                <DetailItem label="Phone Number" value={agreement.tourist_data.phone_number} icon={Phone} />
                <DetailItem label="Hotel in Tangalle" value={agreement.tourist_data.hotel_name || 'N/A'} icon={MapPin} />
                <div className="md:col-span-2">
                  <DetailItem label="Home Address" value={agreement.tourist_data.home_address} icon={MapPin} />
                </div>
              </div>
            </div>
          </div>

          {/* Management Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-stone-900">Rental Management</h2>
            </div>
            
            <div className="p-6 md:p-8 space-y-8">
              {/* Dates & Rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ManagementInput 
                  label="Start Date" 
                  type="date" 
                  value={startDate} 
                  onChange={setStartDate} 
                />
                <ManagementInput 
                  label="End Date" 
                  type="date" 
                  value={endDate} 
                  onChange={setEndDate} 
                />
                <ManagementInput 
                  label="Daily Rate (LKR)" 
                  type="number" 
                  value={dailyRate} 
                  onChange={setDailyRate} 
                  placeholder="e.g. 5000"
                />
                <ManagementInput 
                  label="Deposit (LKR)" 
                  type="number" 
                  value={deposit} 
                  onChange={setDeposit} 
                  placeholder="e.g. 10000"
                />
              </div>

              <div className="flex justify-end">
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
                      alert('Changes saved successfully!');
                    } catch {
                      alert('Failed to save changes');
                    }
                  }}
                  className="w-full md:w-auto px-8 py-3.5 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 min-h-[48px]"
                >
                  Save Rental Details
                </button>
              </div>

              <div className="h-px bg-stone-100" />

              {/* Bike Assignment */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Bike className="w-5 h-5 text-stone-400" />
                    Bike Assignment
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-orange-600 font-bold text-sm hover:text-orange-700 transition-colors flex items-center gap-1 min-h-[44px] px-4"
                    >
                      <Edit3 className="w-4 h-4" />
                      Change Bike
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <select
                        value={bikeId}
                        onChange={(e) => setBikeId(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 transition-all"
                      >
                        <option value="">Select a bike</option>
                        {available.map((b) => (
                          <option key={b.id} value={b.id}>{b.model} • {b.plate_no}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateBike}
                        className="flex-1 px-6 py-3.5 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-all min-h-[48px]"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="p-3.5 bg-stone-100 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition-all min-h-[48px]"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl border border-stone-100 bg-stone-50 flex items-center justify-between">
                    {agreement.bike_id ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                          <Bike className="w-5 h-5 text-stone-600" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">Bike ID: {agreement.bike_id}</p>
                          <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Assigned to this rental</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-stone-500 italic">No bike assigned yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Signature Preview */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50">
              <h2 className="text-lg font-bold text-stone-900">Customer Signature</h2>
            </div>
            <div className="p-8 flex justify-center bg-stone-50/30">
              <div className="max-w-md w-full p-6 bg-white rounded-2xl border border-stone-100 shadow-inner">
                <img 
                  src={agreement.signature_url} 
                  alt="Customer Signature" 
                  className="max-h-32 w-auto mx-auto grayscale contrast-125"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const DetailItem = ({ label, value, icon: Icon }: { label: string; value: string; icon: any }) => (
  <div>
    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
      <Icon className="w-3 h-3" />
      {label}
    </label>
    <p className="text-stone-900 font-medium">{value}</p>
  </div>
);

const ManagementInput = ({ label, type, value, onChange, placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-stone-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3.5 rounded-xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 transition-all text-sm font-medium"
    />
  </div>
);
