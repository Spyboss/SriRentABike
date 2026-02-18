import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Helmet>
        <title>Page Not Found - SriRentABike</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 pt-24 md:pt-32 pb-12">
        <div className="max-w-lg w-full bg-white rounded-[2rem] shadow-2xl shadow-stone-200/60 border border-stone-100 p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-stone-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 mb-3 tracking-tight">Page Not Found</h1>
          <p className="text-stone-500 font-medium mb-8 leading-relaxed">
            The page you’re looking for doesn’t exist. Head back to the homepage to start your journey.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 min-h-[56px]"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
