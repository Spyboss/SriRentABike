import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGuestFormStore } from '../stores/guest-form';
import { SignaturePad } from '../components/SignaturePad';
import { agreementsAPI } from '../services/api';
import { CheckCircle, AlertCircle, Loader2, Lock } from 'lucide-react';
import { rateAPI } from '@/services/api';

export const GuestForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const {
    // Token validation
    isValidating,
    isTokenValid,
    tokenError,
    
    // Form data
    touristData,
    signature,
    
    // Submission
    submitError,
    submitSuccess,
    
    // Actions
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    if (!signature) {
      alert('Please provide your signature');
      return;
    }

    setIsSubmittingForm(true);
    
    try {
      // Create the agreement with tourist data and signature
      const formData = {
        tourist_data: touristData,
        signature: signature,
        start_date: startDate,
        end_date: endDate,
        daily_rate: dailyRate,
        deposit
      };
      
      await agreementsAPI.create(formData);
      
      // Mark guest link as used
      await submitForm();
      
    } catch (error: unknown) {
      const respErr = error as { response?: { data?: { error?: string } } };
      const message = respErr.response?.data?.error || (error instanceof Error ? error.message : null) || 'Failed to submit form. Please try again.';
      console.error('Form submission error:', error);
      const errorMessage = message;
      alert(errorMessage);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Validating your access...</p>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
            <p className="text-gray-600 mb-6">
              {tokenError || 'This link is invalid or has expired.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Success!</h1>
            <p className="text-gray-600 mb-6">
              Your rental agreement has been submitted successfully. Our team will contact you shortly.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold">SriRentABike Rental Agreement</h1>
            <p className="text-blue-100 mt-1">Please fill out all required fields</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Rental Period & Pricing */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Rental Period & Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (LKR)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={`${dailyRate} LKR`}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
                      title="Only administrators can modify this rate"
                    />
                    <Lock className="w-4 h-4 text-gray-500 absolute right-3 top-2.5" />
                  </div>
                  {rateError && <p className="text-xs text-red-600 mt-1">{rateError}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit *</label>
                  <input type="number" min={0} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
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
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={touristData.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={touristData.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
                    Nationality *
                  </label>
                  <input
                    type="text"
                    id="nationality"
                    name="nationality"
                    value={touristData.nationality}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="passport_no" className="block text-sm font-medium text-gray-700 mb-1">
                    Passport Number *
                  </label>
                  <input
                    type="text"
                    id="passport_no"
                    name="passport_no"
                    value={touristData.passport_no}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={touristData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={touristData.phone_number}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="home_address" className="block text-sm font-medium text-gray-700 mb-1">
                    Home Address *
                  </label>
                  <textarea
                    id="home_address"
                    name="home_address"
                    value={touristData.home_address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="hotel_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Hotel Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="hotel_name"
                    name="hotel_name"
                    value={touristData.hotel_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Electronic Signature */}
            <div>
              <SignaturePad
                onSave={setSignature}
                onClear={() => setSignature(null)}
                signature={signature}
              />
            </div>

            {/* Error Display */}
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

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingForm || !signature}
                className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmittingForm ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Agreement'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
