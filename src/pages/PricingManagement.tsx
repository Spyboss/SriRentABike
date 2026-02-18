import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { rateAPI } from '@/services/api';
import { Navbar } from '@/components/Navbar';
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  DollarSign,
  Settings,
  RefreshCw
} from 'lucide-react';
import { BikeModel } from '@/config/bike-rates';

interface PricingRules {
  longTermDiscountDays: number;
  longTermDiscountPercentage: number;
  outsideAreaRateLKR: number;
}

interface PricingConfig {
  models: BikeModel[];
  rules: PricingRules;
}

const PricingField = ({ label, value, onChange, type = "number", step, suffix, helper, icon: Icon }: any) => (
  <div className="space-y-2.5">
    <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1 block">{label}</label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-orange-500 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className={`w-full ${Icon ? 'pl-12' : 'px-5'} ${suffix ? 'pr-14' : 'pr-5'} py-4 rounded-2xl border-stone-200 bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-stone-300 font-medium min-h-[56px] shadow-sm hover:border-stone-300`}
      />
      {suffix && (
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
          {suffix}
        </span>
      )}
    </div>
    {helper && <p className="text-[11px] text-stone-400 ml-1 font-bold italic">{helper}</p>}
  </div>
);

export default function PricingManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [config, setConfig] = useState<PricingConfig>({
    models: [],
    rules: {
      longTermDiscountDays: 3,
      longTermDiscountPercentage: 0.1,
      outsideAreaRateLKR: 500
    }
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await rateAPI.getPricing();
      setConfig(res.data);
    } catch (err) {
      console.error('Failed to load pricing config', err);
      setError('Failed to load pricing configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await rateAPI.updatePricing(config);
      setSuccess('Pricing configuration saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save config', err);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleRuleChange = (key: keyof PricingRules, value: number) => {
    setConfig(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [key]: value
      }
    }));
  };

  const handleModelChange = (index: number, field: keyof BikeModel, value: string | number) => {
    setConfig(prev => {
      const newModels = [...prev.models];
      newModels[index] = {
        ...newModels[index],
        [field]: value
      };
      return { ...prev, models: newModels };
    });
  };

  const addModel = () => {
    setConfig(prev => ({
      ...prev,
      models: [
        ...prev.models,
        {
          id: `model-${Date.now()}`,
          name: 'New Model',
          dailyRateLKR: 3000,
          monthlyRateLKR: 80000
        }
      ]
    }));
  };

  const removeModel = (index: number) => {
    if (!window.confirm('Are you sure you want to remove this model?')) return;
    setConfig(prev => ({
      ...prev,
      models: prev.models.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-white rounded-3xl shadow-xl shadow-stone-200 flex items-center justify-center mb-6">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
        <p className="text-stone-500 font-bold tracking-tight">Loading pricing...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Helmet>
        <title>Pricing Management - SriRentABike</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 md:pt-32 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest mb-3">
              <Settings className="w-3 h-3" />
              Admin Configuration
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight mb-2">Pricing</h1>
            <p className="text-stone-500 font-medium">Manage rental rates and discount rules</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => fetchConfig()} 
              className="inline-flex items-center justify-center w-14 h-14 bg-white border border-stone-200 text-stone-600 rounded-2xl hover:bg-stone-50 transition-all shadow-sm active:scale-95"
              title="Refresh configuration"
            >
              <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-3 px-8 h-14 bg-stone-900 text-white font-black rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 disabled:opacity-50 active:scale-95"
            >
              {saving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Save className="w-6 h-6" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-3xl flex items-center text-red-600 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mr-4 flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="font-bold">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-8 p-5 bg-green-50 border border-green-100 rounded-3xl flex items-center text-green-600 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mr-4 flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="font-bold">{success}</p>
          </div>
        )}

        <div className="space-y-10">
          {/* Global Rules Section */}
          <section className="bg-white rounded-[40px] p-6 md:p-10 shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] -mr-10 -mt-10 opacity-50" />
            
            <div className="flex items-center gap-4 mb-8 relative">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">Global Rules</h2>
                <p className="text-stone-400 text-sm font-medium italic">Apply to all rental calculations</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <PricingField
                label="Long Term Trigger"
                value={config.rules.longTermDiscountDays}
                onChange={(v: number) => handleRuleChange('longTermDiscountDays', v)}
                suffix="Days"
                helper="Days required for discount"
                icon={RefreshCw}
              />
              <PricingField
                label="Discount Rate"
                value={config.rules.longTermDiscountPercentage}
                onChange={(v: number) => handleRuleChange('longTermDiscountPercentage', v)}
                step="0.01"
                suffix="%"
                helper="e.g. 0.10 for 10%"
                icon={DollarSign}
              />
              <PricingField
                label="Area Surcharge"
                value={config.rules.outsideAreaRateLKR}
                onChange={(v: number) => handleRuleChange('outsideAreaRateLKR', v)}
                suffix="LKR"
                helper="Daily extra charge"
                icon={AlertCircle}
              />
            </div>
          </section>

          {/* Bike Models Section */}
          <section className="bg-white rounded-[40px] p-6 md:p-10 shadow-xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -mr-10 -mt-10 opacity-50" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">Model Rates</h2>
                  <p className="text-stone-400 text-sm font-medium italic">Specific rates per bike model</p>
                </div>
              </div>
              <button
                onClick={addModel}
                className="inline-flex items-center justify-center gap-2 px-6 h-12 bg-stone-100 text-stone-900 font-black rounded-2xl hover:bg-stone-200 transition-all text-sm active:scale-95 shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Add New Model
              </button>
            </div>
            
            <div className="space-y-6">
              {config.models.map((model, index) => (
                <div 
                  key={model.id} 
                  className="group relative flex flex-col md:flex-row gap-6 p-6 bg-stone-50 rounded-[32px] border border-stone-100 hover:border-orange-200 hover:bg-white transition-all shadow-sm hover:shadow-xl hover:shadow-orange-100/50"
                >
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1 mb-2 block">Model Name</label>
                    <input
                      type="text"
                      value={model.name}
                      onChange={(e) => handleModelChange(index, 'name', e.target.value)}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-stone-900 font-black placeholder-stone-300 text-xl"
                      placeholder="e.g. Honda Dio"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:flex gap-6 md:w-auto">
                    <div className="md:w-44">
                      <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1 mb-2 block">Daily Rate</label>
                      <div className="relative group/input">
                        <input
                          type="number"
                          value={model.dailyRateLKR}
                          onChange={(e) => handleModelChange(index, 'dailyRateLKR', Number(e.target.value))}
                          className="w-full bg-white px-5 h-14 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-stone-900 font-black text-lg transition-all"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-300 group-focus-within/input:text-orange-400">LKR</span>
                      </div>
                    </div>
                    
                    <div className="md:w-44">
                      <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1 mb-2 block">Monthly Rate</label>
                      <div className="relative group/input">
                        <input
                          type="number"
                          value={model.monthlyRateLKR}
                          onChange={(e) => handleModelChange(index, 'monthlyRateLKR', Number(e.target.value))}
                          className="w-full bg-white px-5 h-14 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-stone-900 font-black text-lg transition-all"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-300 group-focus-within/input:text-orange-400">LKR</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end md:pt-6">
                    <button
                      onClick={() => removeModel(index)}
                      className="w-14 h-14 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                      title="Remove model"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
              
              {config.models.length === 0 && (
                <div className="text-center py-20 bg-stone-50 rounded-[40px] border-4 border-dashed border-stone-100">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-stone-200 shadow-sm">
                    <DollarSign className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-stone-900 mb-2">No bike models configured</h3>
                  <p className="text-stone-400 font-medium max-w-xs mx-auto italic">Add your first model to start setting rental rates for your fleet</p>
                  <button
                    onClick={addModel}
                    className="mt-8 inline-flex items-center gap-2 px-8 h-14 bg-stone-900 text-white font-black rounded-2xl hover:bg-stone-800 transition-all active:scale-95 shadow-xl shadow-stone-200"
                  >
                    <Plus className="w-6 h-6" />
                    Add Your First Model
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
