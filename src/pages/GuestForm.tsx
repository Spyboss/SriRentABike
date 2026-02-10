import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useGuestFormStore } from '../stores/guest-form';
import { SignaturePad } from '../components/SignaturePad';
import { agreementsAPI } from '../services/api';
import { CheckCircle, AlertCircle, Loader2, Lock, Calendar, CreditCard, User, Mail, MapPin, Building2, Home } from 'lucide-react';
import { rateAPI } from '@/services/api';
import { Logo } from '../components/Logo';
import { FormField } from '@/components/FormField';

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
    validateToken,
    updateTouristData,
    setSignature,
    submitForm,
    clearErrors,
  } = useGuestFormStore();

  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dailyRate, setDailyRate] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [rateError, setRateError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      validateToken(token);
    }
  }, [token, validateToken]);

  useEffect(() => {
    rateAPI.get().then(r => {
      const dr = Number(r.data?.daily_rate ?? 5000);
      setDailyRate(dr);
    }).catch(() => {
      setRateError('Failed to load daily rate');
      setDailyRate(5000);
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateTouristData({ [name]: value });
  };

  const calculateTotal = useCallback(() => {
    if (!startDate || !endDate || !dailyRate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return diffDays * dailyRate;
  }, [startDate, endDate, dailyRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    if (!signature) {
      alert('Please provide your signature');
      return;
    }

    setIsSubmittingForm(true);
    
    try {
      const formData = {
        tourist_data: touristData,
        signature: signature,
        start_date: startDate,
        end_date: endDate,
        daily_rate: dailyRate,
        deposit
      };
      
      await agreementsAPI.create(formData);
      await submitForm();
      
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
        <title>Complete Your Rental Agreement - SriRentABike</title>
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
                onChange={(e: any) => setStartDate(e.target.value)}
                icon={Calendar}
              />
              <FormField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e: any) => setEndDate(e.target.value)}
                icon={Calendar}
              />
              <FormField
                label="Daily Rate"
                type="text"
                value={`${dailyRate}`}
                readOnly
                icon={CreditCard}
                suffix="LKR"
              />
              <FormField
                label="Security Deposit"
                type="number"
                value={deposit}
                onChange={(e: any) => setDeposit(Number(e.target.value))}
                icon={CreditCard}
                suffix="LKR"
              />
            </div>
            
            {(startDate && endDate) && (
              <div className="mt-8 p-6 bg-stone-900 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-1">Estimated Total Amount</p>
                  <p className="text-3xl font-black tracking-tight">{calculateTotal().toLocaleString()} LKR</p>
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
