import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { agreementsAPI } from '@/services/api';
import { SignaturePad } from '@/components/SignaturePad';
import { CheckCircle, AlertCircle, Loader2, Lock, DollarSign, RefreshCw } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Navbar } from '@/components/Navbar';
import { FormField } from '@/components/FormField';
import { BIKE_MODELS as DEFAULT_BIKE_MODELS, PRICING_RULES as DEFAULT_PRICING_RULES, BikeModel } from '@/config/bike-rates';
import { rateAPI } from '@/services/api';

export default function PublicRentForm() {
  const navigate = useNavigate();
  const [touristData, setTouristData] = useState({
    first_name: '',
    last_name: '',
    passport_no: '',
    nationality: '',
    home_address: '',
    phone_number: '',
    email: '',
    hotel_name: ''
  });
  
  // Pricing Configuration State
  const [bikeModels, setBikeModels] = useState<BikeModel[]>(DEFAULT_BIKE_MODELS);
  const [pricingRules, setPricingRules] = useState(DEFAULT_PRICING_RULES);
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_BIKE_MODELS[0].id);
  const [outsideArea, setOutsideArea] = useState<boolean>(false);
  const [currency, setCurrency] = useState<'LKR' | 'USD'>('LKR');
  const [exchangeRate, setExchangeRate] = useState<number>(300); // Default fallback
  const [loadingRate, setLoadingRate] = useState<boolean>(false);
  
  const [deposit, setDeposit] = useState<number>(0);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  useEffect(() => {
    fetchExchangeRate();
    fetchPricingConfig();
  }, []);

  const fetchPricingConfig = async () => {
    try {
      const res = await rateAPI.getPricing();
      if (res.data) {
        if (res.data.models) setBikeModels(res.data.models);
        if (res.data.rules) setPricingRules(res.data.rules);
        
        // Ensure selected model is valid
        setSelectedModelId(prev => {
           const exists = res.data.models?.find((m: BikeModel) => m.id === prev);
           return exists ? prev : (res.data.models?.[0]?.id || prev);
        });
      }
    } catch (e) {
      console.error('Failed to fetch pricing config', e);
    }
  };

  const fetchExchangeRate = async () => {
    setLoadingRate(true);
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await res.json();
      if (data && data.rates && data.rates.LKR) {
        setExchangeRate(data.rates.LKR);
      }
    } catch (e) {
      console.error('Failed to fetch exchange rate', e);
    } finally {
      setLoadingRate(false);
    }
  };

  const selectedModel = useMemo(() => 
    bikeModels.find(m => m.id === selectedModelId) || bikeModels[0], 
    [selectedModelId, bikeModels]
  );

  const pricing = useMemo(() => {
    if (!startDate || !endDate) return { 
      totalLKR: 0, 
      days: 0, 
      dailyRateLKR: 0, 
      baseDailyRateLKR: selectedModel.dailyRateLKR 
    };

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const effectiveDays = Math.max(1, days);

    let totalLKR = 0;
    let appliedRate = selectedModel.dailyRateLKR;

    // Monthly Rate Logic
    if (effectiveDays >= 30) {
      // Pro-rate monthly rate
      appliedRate = selectedModel.monthlyRateLKR / 30;
      totalLKR = appliedRate * effectiveDays;
    } else {
      // Daily Rate Logic
      totalLKR = effectiveDays * selectedModel.dailyRateLKR;
      
      // Long term discount (> 3 days)
      if (effectiveDays > pricingRules.longTermDiscountDays) {
        const discountAmount = totalLKR * pricingRules.longTermDiscountPercentage;
        totalLKR -= discountAmount;
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
      baseDailyRateLKR: selectedModel.dailyRateLKR
    };
  }, [startDate, endDate, selectedModel, outsideArea, pricingRules]);

  const displayAmount = (amountLKR: number | undefined) => {
    if (amountLKR === undefined || amountLKR === null) return currency === 'USD' ? '$0.00' : 'LKR 0.00';
    if (currency === 'USD') {
      return `$${(amountLKR / exchangeRate).toFixed(2)}`;
    }
    return `LKR ${amountLKR.toLocaleString()}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouristData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!signature) {
      setSubmitError('Please provide your signature');
      return;
    }

    const required: (keyof typeof touristData)[] = [
      'first_name','last_name','passport_no','nationality','home_address','phone_number','email'
    ];
    for (const f of required) {
      if (!String(touristData[f] || '').trim()) {
        setSubmitError(`${String(f).replace('_',' ').toUpperCase()} is required`);
        return;
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(touristData.email)) {
      setSubmitError('Please enter a valid email address');
      return;
    }
    const phoneRegex = /^[+]?[\d\s\-()]+$/;
    if (!phoneRegex.test(touristData.phone_number)) {
      setSubmitError('Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await agreementsAPI.create({
        tourist_data: touristData,
        signature,
        start_date: startDate,
        end_date: endDate,
        daily_rate: pricing.baseDailyRateLKR, // Storing base rate
        total_amount: pricing.totalLKR,
        deposit,
        requested_model: selectedModel.name,
        outside_area: outsideArea
      });
      const ref = response.data?.agreement_no as string | undefined;
      setSuccessRef(ref || null);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        (error instanceof Error ? error.message : null) ||
        'Failed to submit form. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successRef) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-8 text-center border border-stone-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-2">Request Sent!</h2>
            <p className="text-stone-600 mb-8">
              Your rental agreement has been submitted successfully. We will contact you shortly.
            </p>
            <div className="bg-stone-50 rounded-2xl p-6 mb-8 border border-stone-100">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block mb-1">Agreement Reference</span>
              <span className="text-2xl font-mono font-bold text-orange-600">{successRef}</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-colors shadow-lg shadow-stone-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pt-24 md:pt-32 pb-12">
        <div className="mb-10 md:mb-14 px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Lock className="w-3 h-3" /> Secure Booking
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-stone-900 mb-4 tracking-tight">Rent a Bike</h1>
          <p className="text-stone-600 text-lg md:text-xl max-w-2xl leading-relaxed">Experience Tangalle on your own terms. Fill in the details below to start your adventure.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
          {/* 1. Bike & Duration */}
          <section className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100 p-6 md:p-10">
            <h2 className="text-2xl font-bold text-stone-900 mb-8 flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-orange-500 text-white text-base shadow-lg shadow-orange-200">1</span>
              Bike & Duration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-stone-700 ml-1">Select Bike Model</label>
                <div className="relative">
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none text-stone-900 font-medium min-h-[56px] shadow-sm hover:border-stone-300"
                  >
                    {bikeModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {displayAmount(model.dailyRateLKR)}/day
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-bold text-stone-700 ml-1">Area of Use</label>
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
                    Outside Tangalle
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-bold text-stone-700 ml-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-stone-900 font-medium min-h-[56px] shadow-sm"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-bold text-stone-700 ml-1">End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-stone-900 font-medium min-h-[56px] shadow-sm"
                />
              </div>
            </div>
          </section>

          {/* 2. Personal Information */}
          <section className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100 p-6 md:p-10">
            <h2 className="text-2xl font-bold text-stone-900 mb-8 flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-orange-500 text-white text-base shadow-lg shadow-orange-200">2</span>
              Personal Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField label="First Name" name="first_name" type="text" value={touristData.first_name} onChange={handleInputChange} placeholder="John" />
              <FormField label="Last Name" name="last_name" type="text" value={touristData.last_name} onChange={handleInputChange} placeholder="Doe" />
              <FormField label="Passport Number" name="passport_no" type="text" value={touristData.passport_no} onChange={handleInputChange} placeholder="A1234567" />
              <FormField label="Nationality" name="nationality" type="text" value={touristData.nationality} onChange={handleInputChange} placeholder="British" />
              <FormField label="Email Address" name="email" type="email" value={touristData.email} onChange={handleInputChange} placeholder="john@example.com" />
              <FormField label="Phone / WhatsApp" name="phone_number" type="tel" value={touristData.phone_number} onChange={handleInputChange} placeholder="+44 7700 900000" />
              <FormField label="Home Address" name="home_address" type="text" value={touristData.home_address} onChange={handleInputChange} placeholder="123 Main St, London, UK" colSpan={true} />
              <FormField label="Hotel Name in Tangalle" name="hotel_name" type="text" required={false} value={touristData.hotel_name} onChange={handleInputChange} placeholder="The Palm Beach Resort" colSpan={true} />
            </div>
          </section>

          {/* 3. Pricing Summary & Signature */}
          <section className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100 overflow-hidden">
            <div className="p-6 md:p-10 border-b border-stone-100 bg-stone-50/50">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                  <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-orange-500 text-white text-base shadow-lg shadow-orange-200">3</span>
                    Summary & Sign
                  </h2>
                  <div className="flex items-center bg-stone-200/50 rounded-2xl p-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setCurrency('LKR')}
                      className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all min-h-[44px] ${currency === 'LKR' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                    >
                      LKR
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all min-h-[44px] ${currency === 'USD' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                    >
                      USD
                    </button>
                  </div>
               </div>

               <div className="space-y-5 bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="text-base font-medium">{selectedModel.name} × {pricing.days} days</span>
                    <span className="font-bold text-stone-900 text-lg">{displayAmount(pricing.totalLKR - (outsideArea ? pricing.days * pricingRules.outsideAreaRateLKR : 0))}</span>
                  </div>
                  {outsideArea && (
                    <div className="flex justify-between items-center text-orange-600">
                      <span className="text-base font-medium">Outside Area Fee</span>
                      <span className="font-bold text-lg">+{displayAmount(pricing.days * pricingRules.outsideAreaRateLKR)}</span>
                    </div>
                  )}
                  <div className="pt-6 border-t-2 border-dashed border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-xl font-bold text-stone-900">Total Estimate</span>
                    <div className="text-right w-full sm:w-auto">
                      <div className="text-4xl md:text-5xl font-black text-orange-600 tracking-tight">{displayAmount(pricing.totalLKR)}</div>
                      {currency === 'USD' && (
                        <div className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-2 flex items-center justify-end gap-2">
                          1 USD = {exchangeRate.toFixed(2)} LKR
                          <button type="button" onClick={fetchExchangeRate} className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-orange-500"><RefreshCw className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>

            <div className="p-6 md:p-10 space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-stone-700 block ml-1">Sign Below</label>
                <div className="border-2 border-dashed border-stone-200 rounded-3xl overflow-hidden bg-stone-50/50 hover:border-orange-200 transition-colors">
                  <SignaturePad onSave={setSignature} />
                </div>
                <div className="flex items-start gap-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-stone-500 leading-relaxed font-medium">By signing, you agree to the rental terms and conditions including insurance policies and vehicle return rules.</p>
                </div>
              </div>

              {submitError && (
                <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 bg-stone-900 text-white text-xl font-black rounded-3xl hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 shadow-2xl shadow-stone-300 min-h-[72px]"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-7 h-7 animate-spin" /> Processing...</>
                ) : (
                  <>Complete Booking Request</>
                )}
              </button>
            </div>
          </section>
        </form>

        <footer className="mt-12 text-center">
          <p className="text-stone-400 text-sm">SriRentABike Tangalle • Polommaruwa • +94 77 123 4567</p>
        </footer>
      </div>
    </div>
  );
}
