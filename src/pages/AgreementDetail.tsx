import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { agreementsAPI, pdfAPI, guestLinksAPI, guestLinkUrl } from '../services/api';
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
  X,
  Settings2,
  Loader2,
  Link2,
  Copy,
  KeyRound,
  Undo2,
  Wallet,
  LucideIcon
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useBikesStore } from '@/stores/bikes';

interface Agreement {
  id: string;
  agreement_no: string;
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
  status: 'pending' | 'signed' | 'active' | 'completed';
  payment_status: 'unpaid' | 'partial' | 'paid';
  amount_paid: number;
  bike_id?: string;
  bike?: { model: string; plate_no: string } | null;
  start_date: string;
  end_date: string;
  daily_rate: number;
  total_amount: number;
  deposit: number;
  requested_model?: string | null;
  signature_url?: string | null;
  pdf_url?: string;
  signed_at?: string | null;
  picked_up_at?: string | null;
  returned_at?: string | null;
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
        agreement_no: string;
        status: string;
        payment_status?: string;
        amount_paid?: number;
        bike_id?: string;
        bikes?: { model: string; plate_no: string } | null;
        start_date?: string;
        end_date?: string;
        daily_rate?: number;
        total_amount?: number;
        deposit?: number;
        requested_model?: string | null;
        signature_url?: string | null;
        pdf_url?: string;
        signed_at?: string | null;
        picked_up_at?: string | null;
        returned_at?: string | null;
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
      const validStatuses = ['pending', 'signed', 'active', 'completed'] as const;
      const normalizedStatus = (validStatuses as readonly string[]).includes(a.status)
        ? (a.status as Agreement['status'])
        : 'pending';
      const mapped: Agreement = {
        id: a.id,
        agreement_no: a.agreement_no,
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
        payment_status: a.payment_status === 'partial' || a.payment_status === 'paid' ? a.payment_status : 'unpaid',
        amount_paid: typeof a.amount_paid === 'number' ? a.amount_paid : 0,
        bike_id: a.bike_id,
        bike: a.bikes ?? null,
        start_date: a.start_date || '',
        end_date: a.end_date || '',
        daily_rate: typeof a.daily_rate === 'number' ? a.daily_rate : 0,
        total_amount: typeof a.total_amount === 'number' ? a.total_amount : 0,
        deposit: typeof a.deposit === 'number' ? a.deposit : 0,
        requested_model: a.requested_model ?? null,
        signature_url: a.signature_url,
        pdf_url: a.pdf_url,
        signed_at: a.signed_at ?? null,
        picked_up_at: a.picked_up_at ?? null,
        returned_at: a.returned_at ?? null,
        created_at: a.created_at,
        updated_at: a.updated_at,
      };
      setAgreement(mapped);
      setBikeId(mapped.bike_id || '');
      setDailyRate(mapped.daily_rate);
      setStartDate(mapped.start_date);
      setEndDate(mapped.end_date);
      setDeposit(mapped.deposit);
      setPayAmount(mapped.amount_paid);
      setPayStatus(mapped.payment_status);
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
      const payload: Record<string, unknown> = { 
        bike_id: bikeId,
        start_date: startDate,
        end_date: endDate,
        deposit: typeof deposit === 'number' ? deposit : undefined,
        daily_rate: typeof dailyRate === 'number' ? dailyRate : undefined,
      };

      // Calculate total amount using the same day count as /rent, GuestForm and
      // the PDF: ceil of the date span, minimum 1 day.
      if (typeof dailyRate === 'number' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        payload.total_amount = diffDays * dailyRate;
      }

      await agreementsAPI.update(id, payload);
      setIsEditing(false);
      await fetchAgreement();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to update agreement';
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

  // Lifecycle: the only path that changes status. The endpoint carries the
  // side effects (bike availability, picked_up_at/returned_at), so the button
  // just names the next state.
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payStatus, setPayStatus] = useState<'unpaid' | 'partial' | 'paid'>('unpaid');

  const handleSetStatus = async (next: 'signed' | 'active' | 'completed') => {
    if (!id || !agreement) return;
    const confirmMsg: Record<string, string> = {
      signed: 'Mark this agreement as signed?',
      active: `Hand over the bike and mark this rental active?${agreement.bike_id ? '' : '\n\n(Assign a bike first.)'}`,
      completed: 'Mark this rental as returned and settled? The bike goes back to available.',
    };
    if (!window.confirm(confirmMsg[next])) return;

    setIsAdvancing(true);
    try {
      await agreementsAPI.setStatus(id, next);
      await fetchAgreement();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to update status';
      alert(msg);
    } finally {
      setIsAdvancing(false);
    }
  };

  // Mint a signing link and copy it, ready to paste into WhatsApp. This is the
  // phone-booking workflow: agreement exists, tourist has not signed yet.
  const handleCopySigningLink = async () => {
    if (!id) return;
    setIsCopyingLink(true);
    try {
      const resp = await guestLinksAPI.create(id);
      const token = resp.data?.guest_token as string | undefined;
      if (!token) throw new Error('No token returned');
      await navigator.clipboard.writeText(guestLinkUrl(token));
      alert('Signing link copied. Paste it into WhatsApp.');
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        (error instanceof Error ? error.message : 'Failed to create link');
      alert(msg);
    } finally {
      setIsCopyingLink(false);
    }
  };

  const handleSavePayment = async () => {
    if (!id) return;
    setIsSavingPayment(true);
    try {
      await agreementsAPI.update(id, {
        payment_status: payStatus,
        amount_paid: typeof payAmount === 'number' ? payAmount : 0,
      });
      await fetchAgreement();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to save payment';
      alert(msg);
    } finally {
      setIsSavingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
            <CheckCircle className="w-3 h-3 mr-1.5" />
            Returned
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
            <Bike className="w-3 h-3 mr-1.5" />
            Out now
          </span>
        );
      case 'signed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
            <CheckCircle className="w-3 h-3 mr-1.5" />
            Signed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
            <Clock className="w-3 h-3 mr-1.5" />
            Awaiting signature
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

  const isOverdue =
    agreement?.status === 'active' &&
    !!agreement.end_date &&
    new Date(agreement.end_date) < new Date(new Date().toDateString());

  // The next legal move in the lifecycle. null = nothing to advance to.
  const nextAction: { to: 'signed' | 'active' | 'completed'; label: string; icon: LucideIcon } | null =
    agreement?.status === 'pending'
      ? { to: 'signed', label: 'Mark as signed', icon: CheckCircle }
      : agreement?.status === 'signed'
        ? { to: 'active', label: 'Hand over bike', icon: KeyRound }
        : agreement?.status === 'active'
          ? { to: 'completed', label: 'Mark returned', icon: Undo2 }
          : null;

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
      <Helmet>
        <title>Agreement Details - Sri Rent A Bike</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
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
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-stone-900">
                  {agreement.tourist_data.first_name} {agreement.tourist_data.last_name}
                </h1>
                {getStatusBadge(agreement.status)}
                {isOverdue && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                    <AlertCircle className="w-3 h-3 mr-1.5" />
                    Overdue
                  </span>
                )}
              </div>
              <p className="text-stone-500 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {agreement.agreement_no} · {startDate ? new Date(startDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '?'} – {endDate ? new Date(endDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '?'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {agreement.status === 'pending' && (
              <button
                onClick={handleCopySigningLink}
                disabled={isCopyingLink}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-all shadow-xl shadow-orange-200 min-h-[48px] disabled:opacity-60"
              >
                {isCopyingLink ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
                Copy signing link
              </button>
            )}
            <button
              onClick={() => (agreement?.pdf_url ? handleDownloadPDF() : handleGeneratePDF())}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 min-h-[48px]"
            >
              <Download className="w-5 h-5" />
              {agreement?.pdf_url ? 'Download PDF' : 'Generate PDF'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Lifecycle Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold text-stone-900">Rental Lifecycle</h2>
              </div>
              {nextAction && (
                <button
                  onClick={() => handleSetStatus(nextAction.to)}
                  disabled={isAdvancing}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 min-h-[44px] disabled:opacity-60"
                >
                  {isAdvancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <nextAction.icon className="w-4 h-4" />}
                  {nextAction.label}
                </button>
              )}
            </div>
            <div className="p-6 md:p-8">
              <ol className="flex flex-col md:flex-row md:items-center gap-3 md:gap-0">
                {(['pending', 'signed', 'active', 'completed'] as const).map((step, i) => {
                  const order = ['pending', 'signed', 'active', 'completed'];
                  const currentIdx = order.indexOf(agreement.status);
                  const done = i < currentIdx;
                  const current = i === currentIdx;
                  return (
                    <React.Fragment key={step}>
                      {i > 0 && <div className={`hidden md:block h-0.5 flex-1 mx-2 ${done || current ? 'bg-green-400' : 'bg-stone-200'}`} />}
                      <li className="flex items-center gap-2.5 shrink-0">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                          done ? 'bg-green-500 text-white' : current ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'
                        }`}>
                          {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                        </span>
                        <span className={`text-sm font-bold capitalize ${current ? 'text-stone-900' : done ? 'text-green-700' : 'text-stone-400'}`}>
                          {step === 'pending' ? 'Requested' : step === 'active' ? 'Out' : step}
                        </span>
                      </li>
                    </React.Fragment>
                  );
                })}
              </ol>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <Meta label="Signed at" value={agreement.signed_at ? new Date(agreement.signed_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not signed yet'} icon={Copy} />
                <Meta label="Picked up" value={agreement.picked_up_at ? new Date(agreement.picked_up_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not handed over'} icon={KeyRound} />
                <Meta label="Returned" value={agreement.returned_at ? new Date(agreement.returned_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not returned'} icon={Undo2} />
              </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-stone-900">Payment</h2>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Total amount</p>
                  <p className="text-lg font-black text-stone-900">LKR {agreement.total_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Deposit</p>
                  <p className="text-lg font-black text-stone-900">LKR {agreement.deposit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Received</p>
                  <p className={`text-lg font-black ${agreement.payment_status === 'paid' ? 'text-green-600' : 'text-stone-900'}`}>
                    LKR {agreement.amount_paid.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="h-px bg-stone-100" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Amount received (LKR)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 10000"
                    className="w-full px-4 py-3.5 rounded-xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">Status</label>
                  <select
                    value={payStatus}
                    onChange={(e) => setPayStatus(e.target.value as 'unpaid' | 'partial' | 'paid')}
                    className="w-full px-4 py-3.5 rounded-xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 transition-all text-sm font-medium"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partially paid</option>
                    <option value="paid">Paid in full</option>
                  </select>
                </div>
                <button
                  onClick={handleSavePayment}
                  disabled={isSavingPayment}
                  className="w-full px-6 py-3.5 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-all min-h-[48px] disabled:opacity-60"
                >
                  {isSavingPayment ? 'Saving...' : 'Save payment'}
                </button>
              </div>
            </div>
          </div>
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
                      const payload: Record<string, unknown> = {
                        start_date: startDate,
                        end_date: endDate,
                        daily_rate: typeof dailyRate === 'number' ? dailyRate : undefined,
                        deposit: typeof deposit === 'number' ? deposit : undefined
                      };

                      // Calculate total amount using the same day count as /rent,
                      // GuestForm and the PDF: ceil of the date span, minimum 1 day.
                      if (typeof dailyRate === 'number' && startDate && endDate) {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                        payload.total_amount = diffDays * dailyRate;
                      }

                      await agreementsAPI.update(id, payload);
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
                          <p className="font-bold text-stone-900">
                            {agreement.bike ? `${agreement.bike.model} • ${agreement.bike.plate_no}` : `Bike ID: ${agreement.bike_id}`}
                          </p>
                          <p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Assigned to this rental</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-stone-500 italic">No bike assigned yet</p>
                        {agreement.requested_model && (
                          <p className="text-xs text-stone-400 font-bold mt-1">Requested: {agreement.requested_model}</p>
                        )}
                      </div>
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
              {agreement.signature_url ? (
                <div className="max-w-md w-full p-6 bg-white rounded-2xl border border-stone-100 shadow-inner">
                  <img 
                    src={agreement.signature_url} 
                    alt="Customer Signature" 
                    width={640}
                    height={200}
                    className="max-h-32 w-auto mx-auto grayscale contrast-125"
                  />
                </div>
              ) : (
                <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-dashed border-stone-200 text-center">
                  <Copy className="w-6 h-6 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 font-medium">Not signed yet</p>
                  {agreement.status === 'pending' && (
                    <p className="text-xs text-stone-400 mt-1">Send the signing link to the tourist.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const Meta = ({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
    <div>
      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{label}</p>
      <p className="text-stone-700 font-medium">{value}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) => (
  <div>
    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
      <Icon className="w-3 h-3" />
      {label}
    </label>
    <p className="text-stone-900 font-medium">{value}</p>
  </div>
);

// T is inferred from `value` and from the setter passed to `onChange`
// (both are Dispatch<SetStateAction<T>>), so the narrow state setters
// stay assignable. The cast is what the `type` branch guarantees at runtime.
const ManagementInput = <T extends string | number>({ label, type, value, onChange, placeholder }: {
  label: string;
  type: string;
  value: T;
  onChange: React.Dispatch<React.SetStateAction<T>>;
  placeholder?: string;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-stone-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange((type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value) as T)}
      placeholder={placeholder}
      className="w-full px-4 py-3.5 rounded-xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 transition-all text-sm font-medium"
    />
  </div>
);
