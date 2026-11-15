import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useGuestFormStore } from '../stores/guest-form';
import { SignaturePad } from '../components/SignaturePad';
import { CheckCircle, AlertCircle, Loader2, Calendar, CreditCard, User, Mail, MapPin, Building2, Home } from 'lucide-react';
import { rateAPI } from '@/services/api';
import { BIKE_MODELS, PRICING_RULES, BikeModel } from '@/config/bike-rates';
import { Logo } from '../components/Logo';
import { FormField } from '@/components/FormField';

// The agreement row the guest link points at. Used to prefill the form so the
// guest sees exactly what they were quoted on /rent.
interface TokenAgreement {
  start_date?: string | null;
  end_date?: string | null;
  requested_model?: string | null;
  outside_area?: boolean | null;
  deposit?: number | null;
}

export const GuestForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const {
    isValidating,
    isTokenValid,
    tokenError,
    touristData,
    signature,
    submitError,
    submitSuccess,
    agreement,
    validateToken,
    updateTouristData,
    setSignature,
    submitForm,
    clearErrors,
  } = useGuestFormStore();

  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [deposit, setDeposit] = useState<number>(0);

  // Pricing Configuration State — same model list and rules as /rent
  const [bikeModels, setBikeModels] = useState<BikeModel[]>(BIKE_MODELS);
  const [pricingRules, setPricingRules] = useState(PRICING_RULES);
  const [selectedModelId, setSelectedModelId] = useState<string>(BIKE_MODELS[0].id);
  const [outsideArea, setOutsideArea] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      validateToken(token);
    }
  }, [token, validateToken]);

  // Load the live pricing config; falls back to the code defaults in state.
  useEffect(() => {
    rateAPI.getPricing().then((r) => {
      if (r.data?.models?.length) setBikeModels(r.data.models);
      if (r.data?.rules) setPricingRules(r.data.rules);
    }).catch(() => {
      // Keep the code defaults — /settings/pricing is unreachable.
    });
  }, []);

  // Prefill from the agreement the guest link points at, so the guest sees the
  // same dates, model and area they were quoted on /rent.
  const prefilledRef = useRef(false);
  useEffect(() => {
    const agr = agreement as TokenAgreement | null;
    if (!agr || prefilledRef.current) return;
    prefilledRef.current = true;
    if (agr.start_date) setStartDate(String(agr.start_date).slice(0, 10));
    if (agr.end_date) setEndDate(String(agr.end_date).slice(0, 10));
    if (agr.outside_area) setOutsideArea(true);
    // Deposit is a term the owner agreed offline — show it, don't let the
    // guest edit it (the submit endpoint ignores deposit anyway).
    if (typeof agr.deposit === 'number') setDeposit(agr.deposit);
    if (agr.requested_model) {
      const match = bikeModels.find((m) => m.name === agr.requested_model);
      if (match) setSelectedModelId(match.id);
    }
  }, [agreement, bikeModels]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateTouristData({ [name]: value });
  };

  const selectedModel = useMemo(
    () => bikeModels.find((m) => m.id === selectedModelId) || bikeModels[0],
    [selectedModelId, bikeModels],
  );

  // Same formula as /rent (src/pages/PublicRentForm.tsx): monthly package only
  // when configured, 10% off past the long-term threshold, outside-area
  // surcharge on top. Both paths must quote identical prices.
  const pricing = useMemo(() => {
    if (!startDate || !endDate) {
      return {
        totalLKR: 0,
        days: 0,
        dailyRateLKR: 0,
        baseDailyRateLKR: selectedModel.dailyRateLKR,
        discountApplied: false,
      };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const effectiveDays = Math.max(1, days);

    let totalLKR = 0;
    let appliedRate = selectedModel.dailyRateLKR;
    let discountApplied = false;

    // Monthly Rate Logic — 0 means "no package": bill daily instead of quoting 0
    if (effectiveDays >= 30 && selectedModel.monthlyRateLKR > 0) {
      appliedRate = selectedModel.monthlyRateLKR / 30;
      totalLKR = appliedRate * effectiveDays;
    } else {
      totalLKR = effectiveDays * selectedModel.dailyRateLKR;

      // Long term discount (> 3 days)
      if (effectiveDays > pricingRules.longTermDiscountDays) {
        totalLKR -= totalLKR * pricingRules.longTermDiscountPercentage;
        discountApplied = true;
      }
    }

    // Outside Area Surcharge
    if (outsideArea) {
      totalLKR += effectiveDays * pricingRules.outsideAreaRateLKR;
    }

    return {
      totalLKR,
      days: effectiveDays,
      dailyRateLKR: appliedRate,
      baseDailyRateLKR: selectedModel.dailyRateLKR,
      discountApplied,
    };
  }, [startDate, endDate, selectedModel, outsideArea, pricingRules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!signature) {
      alert('Please provide your signature');
      return;
    }

    // Required-field checks the store used to run. Kept here so a bad form
    // never reaches the API.
    const required: (keyof typeof touristData)[] = [
      'first_name', 'last_name', 'passport_no', 'nationality',
      'home_address', 'phone_number', 'email',
    ];
    for (const f of required) {
      if (!String(touristData[f] || '').trim()) {
        alert(`${String(f).replace('_', ' ').toUpperCase()} is required`);
        return;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(touristData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    setIsSubmittingForm(true);

    try {
      // Signs the agreement this link points at — no new booking is created.
      await submitForm({
        tourist_data: touristData,
        signature,
        start_date: startDate,
        end_date: endDate,
        daily_rate: pricing.baseDailyRateLKR,
        total_amount: Math.round(pricing.totalLKR),
        requested_model: selectedModel.name,
        outside_area: outsideArea,
      });

    } catch (error: unknown) {
      const respErr = error as { response?: { data?: { error?: string } } };
      const message = respErr.response?.data?.error || (error instanceof Error ? error.message : null) || 'Failed to submit form. Please try again.';
      console.error('Form submission error:', error);
      alert(message);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-white rounded-3xl shadow-xl shadow-stone-200 flex items-center justify-center mb-6">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
        <p className="text-stone-500 font-bold tracking-tight">Validating your access...</p>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl shadow-stone-200 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-stone-900 mb-3 tracking-tight">Invalid Link</h1>
          <p className="text-stone-500 font-medium mb-8 leading-relaxed">
            {tokenError || 'This link is invalid or has expired. Please contact the administrator for a new link.'}
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

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl shadow-stone-200 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-green-500">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-stone-900 mb-3 tracking-tight">Success!</h1>
          <p className="text-stone-500 font-medium mb-8 leading-relaxed">
            Your rental agreement has been submitted successfully. Our team will contact you shortly.
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

  return (
    <div className="min-h-screen bg-stone-50 py-12 md:py-24 px-4">
      <Helmet>
        <title>Complete Your Rental Agreement - Sri Rent A Bike</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <Logo width={180} />
          </div>
          <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">Rental Agreement</h1>
          <p className="text-stone-500 font-medium">Please review and complete the form below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Rental Details Section */}
          <section className="bg-white rounded-[2.5rem] shadow-xl shadow-stone-200 p-8 md:p-10 border border-stone-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">Rental Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                icon={Calendar}
              />
              <FormField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                icon={Calendar}
              />
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1 block">Bike Model *</label>
                <div className="relative">
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none text-stone-900 font-medium min-h-[56px] shadow-sm hover:border-stone-300"
                  >
                    {bikeModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} -{" "}
                        {model.dailyRateMaxLKR
                          ? `LKR ${model.dailyRateLKR.toLocaleString()} - LKR ${model.dailyRateMaxLKR.toLocaleString()}/day`
                          : `LKR ${model.dailyRateLKR.toLocaleString()}/day`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <FormField
                label="Security Deposit"
                type="number"
                value={deposit}
                icon={CreditCard}
                suffix="LKR"
                readOnly
                required={false}
              />
            </div>

            <div className="mt-6 space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1 block">Area of Use *</label>
              <div className="flex p-1 bg-stone-100 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setOutsideArea(false)}
                  className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all min-h-[48px] ${!outsideArea ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
                >
                  Tangalle Only
                </button>
                <button
                  type="button"
                  onClick={() => setOutsideArea(true)}
                  className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all min-h-[48px] ${outsideArea ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
                >
                  Outside Tangalle (+LKR {pricingRules.outsideAreaRateLKR}/day)
                </button>
              </div>
            </div>

            {(startDate && endDate) && (
              <div className="mt-8 p-6 bg-stone-900 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-1">Estimated Total Amount</p>
                  <p className="text-3xl font-black tracking-tight">{Math.round(pricing.totalLKR).toLocaleString()} LKR</p>
                  <p className="text-stone-400 text-xs font-bold mt-1">
                    {pricing.days} day{pricing.days !== 1 ? 's' : ''} @ LKR {Math.round(pricing.dailyRateLKR).toLocaleString()}/day
                    {pricing.discountApplied ? " · incl. 10% long-stay discount" : ""}
                    {outsideArea ? ` · incl. LKR ${pricingRules.outsideAreaRateLKR}/day outside-area fee` : ""}
                  </p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-stone-400 text-xs font-bold">Inclusive of all taxes</p>
                </div>
              </div>
            )}
          </section>

          {/* Personal Information Section */}
          <section className="bg-white rounded-[2.5rem] shadow-xl shadow-stone-200 p-8 md:p-10 border border-stone-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">Personal Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="First Name"
                name="first_name"
                type="text"
                value={touristData.first_name}
                onChange={handleInputChange}
                icon={User}
                placeholder="John"
              />
              <FormField
                label="Last Name"
                name="last_name"
                type="text"
                value={touristData.last_name}
                onChange={handleInputChange}
                icon={User}
                placeholder="Doe"
              />
              <FormField
                label="Nationality"
                name="nationality"
                type="text"
                value={touristData.nationality}
                onChange={handleInputChange}
                icon={MapPin}
                placeholder="United Kingdom"
              />
              <FormField
                label="Passport Number"
                name="passport_no"
                type="text"
                value={touristData.passport_no}
                onChange={handleInputChange}
                icon={CreditCard}
                placeholder="E1234567"
              />
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-white rounded-[2.5rem] shadow-xl shadow-stone-200 p-8 md:p-10 border border-stone-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">Contact Info</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={touristData.email}
                onChange={handleInputChange}
                icon={Mail}
                placeholder="john@example.com"
                colSpan
              />
              <FormField
                label="Phone Number"
                name="phone_number"
                type="tel"
                value={touristData.phone_number}
                onChange={handleInputChange}
                icon={Mail}
                placeholder="+1 234 567 890"
              />
              <FormField
                label="Hotel Name"
                name="hotel_name"
                type="text"
                value={touristData.hotel_name}
                onChange={handleInputChange}
                icon={Building2}
                placeholder="Sunset Bay Resort"
                required={false}
              />
              <div className="md:col-span-2 space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1 block">Home Address *</label>
                <div className="relative group">
                  <div className="absolute left-5 top-5 text-stone-400 group-focus-within:text-orange-500 transition-colors">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <textarea
                    name="home_address"
                    value={touristData.home_address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder="Enter your full home address"
                    className="w-full pl-12 pr-5 py-4 rounded-2xl border-stone-200 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-stone-300 font-medium shadow-sm hover:border-stone-300"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Signature Section */}
          <section className="bg-white rounded-[2.5rem] shadow-xl shadow-stone-200 p-8 md:p-10 border border-stone-100">
            <SignaturePad
              onSave={setSignature}
            />
          </section>

          {/* Error Display */}
          {submitError && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-black text-red-900">Submission Error</p>
                <p className="text-sm font-medium text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmittingForm || !signature}
              className="w-full inline-flex items-center justify-center gap-3 px-8 py-5 bg-stone-900 text-white font-black text-lg rounded-3xl hover:bg-stone-800 transition-all shadow-2xl shadow-stone-300 min-h-[64px] disabled:bg-stone-200 disabled:shadow-none disabled:cursor-not-allowed group"
            >
              {isSubmittingForm ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Submit Agreement
                  <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
            <p className="text-center text-stone-400 text-xs font-medium mt-6">
              By submitting, you agree to our rental terms and conditions
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
