import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agreementsAPI } from '@/services/api';
import { SignaturePad } from '@/components/SignaturePad';
import { CheckCircle, AlertCircle, Loader2, Lock } from 'lucide-react';
import { rateAPI } from '@/services/api';
import { Logo } from '@/components/Logo';

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
  const [dailyRate, setDailyRate] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);

  React.useEffect(() => {
    rateAPI.get().then(r => {
      const dr = Number(r.data?.daily_rate ?? 5000);
      setDailyRate(dr);
    }).catch(() => {
      setDailyRate(5000);
      setRateError('Failed to load daily rate');
    });
  }, []);

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
        daily_rate: dailyRate,
        deposit
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
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-white p-6 border-b border-gray-100 flex justify-center">
            <Logo width={150} />
          </div>
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold">SriRentABike Rental Agreement</h1>
            <p className="text-blue-100 mt-1">Fill out all required fields</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Rental Period & Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-3 py-3 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full px-3 py-3 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (LKR)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={`${dailyRate} LKR`}
                      readOnly
                      className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
                      title="Only administrators can modify this rate"
                    />
                    <Lock className="w-4 h-4 text-gray-500 absolute right-3 top-3.5" />
                  </div>
                  {rateError && <p className="text-xs text-red-600 mt-1">{rateError}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit *</label>
                  <input type="number" min={0} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} required className="w-full px-3 py-3 border border-gray-300 rounded-md" />
                </div>
                <div className="md:col-span-2">
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-sm text-gray-700">
                      Total Amount: <span className="font-semibold">
                        {startDate && endDate && dailyRate
                          ? `$${(Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000*60*60*24))) * dailyRate).toFixed(2)}`
                          : '$0.00'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
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
            </div>
            <div>
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
            </div>
            <div>
              <SignaturePad onSave={setSignature} onClear={() => setSignature(null)} signature={signature} />
            </div>
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
