import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { useAgreementsStore } from '../stores/agreements';
import {
  Search, 
  Eye, 
  Download, 
  User,
  FileText,
  LogOut,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { pdfAPI, agreementsAPI } from '../services/api';
import { Logo } from '../components/Logo';

import { Navbar } from '../components/Navbar';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { agreements, isLoading, error, fetchAgreements } = useAgreementsStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'expired'>('all');

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchAgreements({
      search: debouncedSearchTerm || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter
    });
  }, [user, navigate, fetchAgreements, debouncedSearchTerm, statusFilter]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleViewAgreement = (id: string) => {
    navigate(`/agreements/${id}`);
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const response = await pdfAPI.download(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agreement-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const handleDeleteAgreement = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this agreement? This will soft-delete the record.');
    if (!confirmed) return;
    try {
      await agreementsAPI.delete(id);
      await fetchAgreements({
        search: debouncedSearchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
    } catch {
      alert('Failed to delete agreement');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Helmet>
        <title>Dashboard - SriRentABike</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar isAdmin userEmail={user.email} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-900">Admin Dashboard</h1>
            <p className="text-stone-500 mt-1">Manage your rental agreements and bikes</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/pricing')}
              className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2.5 border border-stone-200 shadow-sm text-sm font-medium rounded-xl text-stone-700 bg-white hover:bg-stone-50 transition-colors min-h-[48px]"
            >
              Pricing & Plans
            </button>
            <button
              onClick={() => navigate('/admin/bikes')}
              className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2.5 border border-stone-200 shadow-sm text-sm font-medium rounded-xl text-stone-700 bg-white hover:bg-stone-50 transition-colors min-h-[48px]"
            >
              Bike Management
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-4 md:p-5 shadow-sm rounded-2xl border border-stone-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-stone-50 rounded-lg">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-stone-400" />
              </div>
              <div className="ml-3 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-stone-500 truncate">Total</dt>
                  <dd className="text-lg md:text-xl font-bold text-stone-900">{agreements.length}</dd>
                </dl>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-5 shadow-sm rounded-2xl border border-stone-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
              </div>
              <div className="ml-3 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-stone-500 truncate">Completed</dt>
                  <dd className="text-lg md:text-xl font-bold text-stone-900">
                    {agreements.filter(a => a.status === 'completed').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-5 shadow-sm rounded-2xl border border-stone-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-yellow-50 rounded-lg">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
              </div>
              <div className="ml-3 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-stone-500 truncate">Pending</dt>
                  <dd className="text-lg md:text-xl font-bold text-stone-900">
                    {agreements.filter(a => a.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-5 shadow-sm rounded-2xl border border-stone-100">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg">
                <User className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
              </div>
              <div className="ml-3 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-stone-500 truncate">Today</dt>
                  <dd className="text-lg md:text-xl font-bold text-stone-900">
                    {agreements.filter(a => {
                      const today = new Date().toDateString();
                      const agreementDate = new Date(a.created_at).toDateString();
                      return agreementDate === today;
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow-sm rounded-2xl border border-stone-100 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-bold text-stone-900">Rental Agreements</h2>
            <button
              onClick={() => fetchAgreements()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-stone-600 bg-stone-50 hover:bg-stone-100 transition-colors min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
          
          <div className="px-6 py-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-stone-400" />
              </div>
              <input
                type="text"
                placeholder="Search name, email, passport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-stone-200 rounded-xl leading-5 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-stone-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="block w-full pl-10 pr-10 py-3 text-base border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm rounded-xl appearance-none bg-white transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Agreements List (Mobile Card / Desktop Table) */}
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="hidden md:table min-w-full divide-y divide-stone-100">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Tourist</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Bike</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-stone-400">Loading...</td></tr>
                ) : agreements.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-stone-400">No agreements found</td></tr>
                ) : (
                  agreements.map((agreement) => (
                    <tr key={agreement.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                            {agreement.tourist_data?.first_name?.[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-stone-900">{agreement.tourist_data?.first_name} {agreement.tourist_data?.last_name}</div>
                            <div className="text-xs text-stone-500">{agreement.tourist_data?.nationality}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-900">{agreement.tourist_data?.email}</div>
                        <div className="text-xs text-stone-500">{agreement.tourist_data?.phone_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(agreement.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                        {agreement.bike_id ? `Bike #${agreement.bike_id}` : 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleViewAgreement(agreement.id)} className="p-2 text-stone-400 hover:text-stone-900 transition-colors" title="View"><Eye className="w-5 h-5" /></button>
                          {agreement.pdf_url && <button onClick={() => handleDownloadPDF(agreement.id)} className="p-2 text-stone-400 hover:text-green-600 transition-colors" title="Download"><Download className="w-5 h-5" /></button>}
                          <button onClick={() => handleDeleteAgreement(agreement.id)} className="p-2 text-stone-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-stone-100">
              {isLoading ? (
                <div className="px-6 py-12 text-center text-stone-400">Loading...</div>
              ) : agreements.length === 0 ? (
                <div className="px-6 py-12 text-center text-stone-400">No agreements found</div>
              ) : (
                agreements.map((agreement) => (
                  <div key={agreement.id} className="p-4 bg-white active:bg-stone-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                          {agreement.tourist_data?.first_name?.[0]}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-bold text-stone-900">{agreement.tourist_data?.first_name} {agreement.tourist_data?.last_name}</div>
                          <div className="text-xs text-stone-500">{agreement.tourist_data?.nationality} • {new Date(agreement.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      {getStatusBadge(agreement.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                      <div className="text-stone-500">Bike: <span className="text-stone-900 font-medium">{agreement.bike_id || 'Not assigned'}</span></div>
                      <div className="text-stone-500">Contact: <span className="text-stone-900 font-medium">{agreement.tourist_data?.phone_number}</span></div>
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-50 pt-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleViewAgreement(agreement.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 bg-stone-50 rounded-lg min-h-[40px]"><Eye className="w-4 h-4" /> View</button>
                        {agreement.pdf_url && <button onClick={() => handleDownloadPDF(agreement.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg min-h-[40px]"><Download className="w-4 h-4" /> PDF</button>}
                      </div>
                      <button onClick={() => handleDeleteAgreement(agreement.id)} className="p-2 text-stone-300 hover:text-red-600 transition-colors min-h-[40px] min-w-[40px]"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
