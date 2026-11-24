import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { agreementsAPI, rateAPI, guestLinkUrl } from '@/services/api';
import { BIKE_MODELS, PRICING_RULES, BikeModel } from '@/config/bike-rates';
import { FormField } from '@/components/FormField';
import { Navbar } from '@/components/Navbar';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Copy,
  CreditCard,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  Building2,
} from 'lucide-react';

// Booking taken over the phone or WhatsApp. Creates the agreement unsigned and
// hands back the signing link to send on WhatsApp — the tourist fills and
// signs at /rent/:token, writing back onto this same agreement.
export default function NewAgreement() {
  const navigate = useNavigate();
  const { user, logout, isHydrated } = useAuthStore();

  const [bikeModels, setBikeModels] = useState<BikeModel[]>(BIKE_MODELS);
  const [pricingRules, setPricingRules] = useState(PRICING_RULES);
  const [selectedModelId, setSelectedModelId] = useState<string>(BIKE_MODELS[0].id);
  const [outsideArea, setOutsideArea] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deposit, setDeposit] = useState<number | ''>('');

  const [tourist, setTourist] = useState({
    first_name: '',
    last_name: '',
    passport_no: '',
    nationality: '',
    home_address: '',
    phone_number: '',
    email: '',
    hotel_name: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result of a successful create: the signing link to send on WhatsApp.
  const [created, setCreated] = useState<{ agreement_no: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Wait for the session restore before deciding there is no user.
    if (!isHydrated) return;
    if (!user) {
      navigate('/login');
      return;
    }
    rateAPI.getPricing().then((r) => {
      if (r.data?.models?.length) setBikeModels(r.data.models);
      if (r.data?.rules) setPricingRules(r.data.rules);
    }).catch(() => {
      // Keep the code defaults — /settings/pricing is unreachable.
    });
  }, [isHydrated, user, navigate]);

  const selectedModel = useMemo(
    () => bikeModels.find((m) => m.id === selectedModelId) || bikeModels[0],
    [selectedModelId, bikeModels],
  );

  // Same formula as /rent and GuestForm so every path quotes identical prices.
  const pricing = useMemo(() => {
    if (!startDate || !endDate) {
      return { totalLKR: 0, days: 0, dailyRateLKR: 0, discountApplied: false };
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    let totalLKR: number;
    let appliedRate = selectedModel.dailyRateLKR;
    let discountApplied = false;

    if (days >= 30 && selectedModel.monthlyRateLKR > 0) {
      appliedRate = selectedModel.monthlyRateLKR / 30;
      totalLKR = appliedRate * days;
    } else {
      totalLKR = days * selectedModel.dailyRateLKR;
      if (days > pricingRules.longTermDiscountDays) {
        totalLKR -= totalLKR * pricingRules.longTermDiscountPercentage;
        discountApplied = true;
      }
    }
    if (outsideArea) totalLKR += days * pricingRules.outsideAreaRateLKR;

    return { totalLKR, days, dailyRateLKR: appliedRate, discountApplied };
  }, [startDate, endDate, selectedModel, outsideArea, pricingRules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const required: (keyof typeof tourist)[] = [
      'first_name', 'last_name', 'passport_no', 'nationality',
      'home_address', 'phone_number', 'email',
    ];
    for (const f of required) {
      if (!String(tourist[f] || '').trim()) {
        setError(`${String(f).replace('_', ' ').toUpperCase()} is required`);
        return;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tourist.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start and end dates are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await agreementsAPI.createAdmin({
        tourist_data: tourist,
        start_date: startDate,
        end_date: endDate,
        daily_rate: selectedModel.dailyRateLKR,
        total_amount: Math.round(pricing.totalLKR),
        deposit: typeof deposit === 'number' ? deposit : 0,
        requested_model: selectedModel.name,
        outside_area: outsideArea,
      });

      const token = resp.data?.guest_token as string | undefined;
      const agreementNo = resp.data?.agreement_no as string | undefined;
      setCreated({
        agreement_no: agreementNo || '',
        link: token ? guestLinkUrl(token) : '',
      });
    } catch (err: unknown) {
      const respErr = err as { response?: { data?: { error?: string } } };
      setError(respErr.response?.data?.error || (err instanceof Error ? err.message : 'Failed to create agreement'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!created?.link) return;
    try {
      await navigator.clipboard.writeText(created.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Could not copy — select the link and copy it manually');
    }
  };

  const whatsappText = created?.link
    ? encodeURIComponent(`Hi! Here is your Sri Rent A Bike rental agreement to review and sign: ${created.link}`)
    : '';

  if (!user) return null;

  // Success screen: the link is the whole point of this page.
  if (created) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <Helmet>
          <title>Agreement Created - Sri Rent A Bike</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Navbar isAdmin userEmail={user.email} onLogout={logout} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-[2.5rem] shadow-2xl shadow-stone-200 p-8 md:p-10 border border-stone-100">
            <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center mb-6 text-green-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight mb-2">Agreement created</h1>
            <p className="text-stone-500 font-medium mb-1">
              Reference <span className="font-black text-stone-900">{created.agreement_no}</span>
            </p>
            <p className="text-stone-500 font-medium mb-8 leading-relaxed">
              Send the signing link below on WhatsApp. The tourist reviews, signs, and the agreement
              updates here — no paper form.
            </p>

            {created.link ? (
              <>
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5">Signing link</p>
                  <p className="text-sm font-mono font-bold text-stone-700 break-all">{created.link}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button
                    onClick={copyLink}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 min-h-[56px]"
                  >
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                  <a
                    href={`https://wa.me/?text=${whatsappText}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-200 min-h-[56px]"
                  >
                    <Link2 className="w-5 h-5" />
                    Open WhatsApp
                  </a>
                </div>
              </>
            ) : (
              <p className="text-stone-500 font-medium mb-6">
                The signing link could not be generated. Open the agreement and use
                &quot;Copy signing link&quot;.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-4 bg-stone-100 text-stone-700 font-bold rounded-2xl hover:bg-stone-200 transition-all min-h-[56px]"
              >
                Dashboard
              </button>
              <button
                onClick={() => setCreated(null)}
                className="flex-1 py-4 bg-white border border-stone-200 text-stone-700 font-bold rounded-2xl hover:bg-stone-50 transition-all min-h-[56px]"
              >
                Book another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Helmet>
        <title>New Agreement - Sri Rent A Bike</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar isAdmin userEmail={user.email} onLogout={logout} />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 pt-24 md:pt-32 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 bg-white border border-stone-200 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">New Agreement</h1>
            <p className="text-stone-500 font-medium">Booking taken by phone or WhatsApp — send the tourist a signing link</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rental details */}
          <section className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-8 space-y-6">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Rental Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} icon={Calendar} />
              <FormField label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} icon={Calendar} />
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1 block">Bike Model *</label>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none text-stone-900 font-medium min-h-[56px] shadow-sm"
                >
                  {bikeModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — LKR {m.dailyRateLKR.toLocaleString()}/day
                    </option>
                  ))}
                </select>
              </div>
              <FormField
                label="Deposit (LKR)"
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value === '' ? '' : Number(e.target.value))}
                icon={CreditCard}
                required={false}
                placeholder="Agreed deposit"
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1 block">Area of Use *</label>
              <div className="flex p-1 bg-stone-100 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setOutsideArea(false)}
                  className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all min-h-[48px] ${!outsideArea ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Tangalle Only
                </button>
                <button
                  type="button"
                  onClick={() => setOutsideArea(true)}
                  className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all min-h-[48px] ${outsideArea ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Outside Tangalle (+LKR {pricingRules.outsideAreaRateLKR}/day)
                </button>
              </div>
            </div>

            {startDate && endDate && (
              <div className="p-6 bg-stone-900 rounded-3xl text-white">
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Amount</p>
                <p className="text-3xl font-black tracking-tight">{Math.round(pricing.totalLKR).toLocaleString()} LKR</p>
                <p className="text-stone-400 text-xs font-bold mt-1">
                  {pricing.days} day{pricing.days !== 1 ? 's' : ''} @ LKR {Math.round(pricing.dailyRateLKR).toLocaleString()}/day
                  {pricing.discountApplied ? ' · incl. 10% long-stay discount' : ''}
                  {outsideArea ? ` · incl. LKR ${pricingRules.outsideAreaRateLKR}/day outside-area fee` : ''}
                </p>
              </div>
            )}
          </section>

          {/* Tourist details */}
          <section className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-8 space-y-6">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" />
              Tourist Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="First Name" name="first_name" type="text" value={tourist.first_name} onChange={(e) => setTourist({ ...tourist, first_name: e.target.value })} icon={User} placeholder="John" />
              <FormField label="Last Name" name="last_name" type="text" value={tourist.last_name} onChange={(e) => setTourist({ ...tourist, last_name: e.target.value })} icon={User} placeholder="Doe" />
              <FormField label="Passport Number" name="passport_no" type="text" value={tourist.passport_no} onChange={(e) => setTourist({ ...tourist, passport_no: e.target.value })} icon={CreditCard} placeholder="E1234567" />
              <FormField label="Nationality" name="nationality" type="text" value={tourist.nationality} onChange={(e) => setTourist({ ...tourist, nationality: e.target.value })} icon={MapPin} placeholder="United Kingdom" />
              <FormField label="Email Address" name="email" type="email" value={tourist.email} onChange={(e) => setTourist({ ...tourist, email: e.target.value })} icon={Mail} placeholder="john@example.com" />
              <FormField label="Phone Number" name="phone_number" type="tel" value={tourist.phone_number} onChange={(e) => setTourist({ ...tourist, phone_number: e.target.value })} icon={Phone} placeholder="+44 7700 900000" />
              <FormField label="Hotel Name" name="hotel_name" type="text" value={tourist.hotel_name} onChange={(e) => setTourist({ ...tourist, hotel_name: e.target.value })} icon={Building2} placeholder="Sunset Bay Resort" required={false} />
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1 block">Home Address *</label>
                <textarea
                  value={tourist.home_address}
                  onChange={(e) => setTourist({ ...tourist, home_address: e.target.value })}
                  required
                  rows={3}
                  placeholder="Full home address"
                  className="w-full px-5 py-4 rounded-2xl border-stone-200 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-stone-300 font-medium shadow-sm"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-3 px-8 py-5 bg-stone-900 text-white font-black text-lg rounded-3xl hover:bg-stone-800 transition-all shadow-2xl shadow-stone-300 min-h-[64px] disabled:bg-stone-200 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create agreement & get signing link
                <Link2 className="w-6 h-6" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
