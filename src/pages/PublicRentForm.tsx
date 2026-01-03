import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { agreementsAPI } from '@/services/api';
import { SignaturePad } from '@/components/SignaturePad';
import { CheckCircle, AlertCircle, Loader2, Lock, DollarSign, RefreshCw } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { BIKE_MODELS, PRICING_RULES, BikeModel } from '@/config/bike-rates';

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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>(BIKE_MODELS[0].id);
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
  }, []);

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
    BIKE_MODELS.find(m => m.id === selectedModelId) || BIKE_MODELS[0], 
    [selectedModelId]
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
      if (effectiveDays > PRICING_RULES.longTermDiscountDays) {
        const discountAmount = totalLKR * PRICING_RULES.longTermDiscountPercentage;
        totalLKR -= discountAmount;
      }
    }

    // Outside Area Surcharge
    if (outsideArea) {
      totalLKR += effectiveDays * PRICING_RULES.outsideAreaRateLKR;
    }

    return {
      totalLKR,
      days: effectiveDays,
      dailyRateLKR: appliedRate,
      baseDailyRateLKR: selectedModel.dailyRateLKR
    };
  }, [startDate, endDate, selectedModel, outsideArea]);

  const displayAmount = (amountLKR: number | undefined) => {
    if (amountLKR === undefined || amountLKR === null) return currency === 'USD' ? '$0.00' : 'LKR 0.00';
    if (currency === 'USD') {
      return `$${(amountLKR / exchangeRate).toFixed(2)}`;
    }
    return `LKR ${amountLKR.toFixed(2)}`;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Submitted</h1>
            <p className="text-gray-600 mb-6">
              Your agreement was submitted. Reference: <span className="font-semibold">{successRef}</span>
            </p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => navigate(`/agreement/${successRef}`)}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                View Status
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-white p-6 border-b border-gray-100 flex justify-center relative">
            <Logo width={150} />
            <div className="absolute right-6 top-6 flex items-center gap-2">
               <button 
                 type="button"
                 onClick={() => setCurrency(c => c === 'LKR' ? 'USD' : 'LKR')}
                 className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
               >
                 <RefreshCw className={`w-3 h-3 ${loadingRate ? 'animate-spin' : ''}`} />
                 {currency}
               </button>
            </div>
          </div>
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold">SriRentABike Rental Agreement</h1>
            <p className="text-blue-100 mt-1">Fill out all required fields</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Bike Selection & Pricing */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Vehicle Selection & Pricing
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Bike Model</label>
                  <select 
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {BIKE_MODELS.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.dailyRateLKR} LKR/day
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Monthly rate: {selectedModel.monthlyRateLKR} LKR
                  </p>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={outsideArea} 
                      onChange={(e) => setOutsideArea(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700 font-medium">Outside Area Travel (+{PRICING_RULES.outsideAreaRateLKR} LKR/day)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit</label>
                  <input type="number" min={0} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{pricing.days} days</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Rate per day:</span>
                  <span className="font-medium">{displayAmount(pricing.dailyRateLKR)}</span>
                </div>
                 {pricing.days > PRICING_RULES.longTermDiscountDays && (
                  <div className="flex justify-between items-center mb-2 text-green-600 text-sm">
                    <span>Long-term discount applied</span>
                    <span>-{Math.round(PRICING_RULES.longTermDiscountPercentage * 100)}%</span>
                  </div>
                )}
                {outsideArea && (
                  <div className="flex justify-between items-center mb-2 text-orange-600 text-sm">
                    <span>Outside Area Surcharge</span>
                    <span>+{displayAmount(pricing.days * PRICING_RULES.outsideAreaRateLKR)}</span>
                  </div>
                )}
                <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-900">Total Estimate:</span>
                  <span className="text-2xl font-bold text-blue-700">{displayAmount(pricing.totalLKR)}</span>
                </div>
                {currency === 'USD' && (
                  <p className="text-xs text-right text-gray-500 mt-1">
                    * Exchange rate: 1 USD = {exchangeRate.toFixed(2)} LKR
                  </p>
                )}
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* Personal Information */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input id="first_name" name="first_name" value={touristData.first_name} onChange={handleInputChange} required className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input id="last_name" name="last_name" value={touristData.last_name} onChange={handleInputChange} required className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
                  <input id="nationality" name="nationality" value={touristData.nationality} onChange={handleInputChange} required className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="passport_no" className="block text-sm font-medium text-gray-700 mb-1">Passport Number *</label>
                  <input id="passport_no" name="passport_no" value={touristData.passport_no} onChange={handleInputChange} required className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input type="email" id="email" name="email" value={touristData.email} onChange={handleInputChange} required className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input type="tel" id="phone_number" name="phone_number" value={touristData.phone_number} onChange={handleInputChange} required className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="home_address" className="block text-sm font-medium text-gray-700 mb-1">Home Address *</label>
                  <textarea id="home_address" name="home_address" value={touristData.home_address} onChange={handleInputChange} required rows={3} className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="hotel_name" className="block text-sm font-medium text-gray-700 mb-1">Hotel Name (Optional)</label>
                  <input id="hotel_name" name="hotel_name" value={touristData.hotel_name} onChange={handleInputChange} className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </section>

            <section>
              <label className="block text-sm font-medium text-gray-700 mb-2">Signature *</label>
              <SignaturePad onSave={setSignature} onClear={() => setSignature(null)} signature={signature} />
            </section>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{submitError}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !signature}
                className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" />Submitting...</>) : 'Submit Agreement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
