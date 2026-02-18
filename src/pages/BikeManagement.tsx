import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useBikesStore } from '@/stores/bikes';
import { bikeMetaAPI } from '@/services/api';
import { Plus, Edit3, Trash2, RefreshCw, CheckCircle, AlertCircle, Search, Filter, Bike, ChevronRight, X, Upload } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function BikeManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { bikes, isLoading, error, fetchAll, createBike, updateBike, clearError } = useBikesStore();
  const [filter, setFilter] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ model: '', frame_no: '', plate_no: '', availability_status: 'available' as 'available' | 'rented' | 'maintenance' });
  const [color, setColor] = useState<string>('');
  const [specs, setSpecs] = useState<string>('');
  const [docs, setDocs] = useState<FileList | null>(null);
  const [docUrls, setDocUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAll();
  }, [user, navigate, fetchAll]);

  const filtered = bikes.filter((b) => {
    const matchesStatus = filter === 'all' ? true : b.availability_status === filter;
    const matchesSearch = !searchTerm
      ? true
      : [b.model, b.frame_no, b.plate_no].some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const startCreate = () => {
    setEditingId(null);
    setForm({ model: '', frame_no: '', plate_no: '', availability_status: 'available' });
    setColor('#ffffff');
    setSpecs('');
    setDocs(null);
    setDocUrls([]);
    clearError();
    setShowForm(true);
  };

  const startEdit = (id: string) => {
    const b = bikes.find((x) => x.id === id);
    if (!b) return;
    setEditingId(id);
    setForm({ model: b.model, frame_no: b.frame_no, plate_no: b.plate_no, availability_status: b.availability_status });
    clearError();
    setShowForm(true);
    bikeMetaAPI.get(id).then(r => {
      const meta = r.data?.meta || {};
      setColor(meta.color || '#ffffff');
      setSpecs(meta.specs || '');
    }).catch(() => {});
    bikeMetaAPI.listDocs(id).then(r => setDocUrls(r.data?.urls || [])).catch(() => setDocUrls([]));
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateBike(editingId, form);
        await bikeMetaAPI.put(editingId, { color, specs });
        if (docs && docs.length) {
          await bikeMetaAPI.uploadDocs(editingId, Array.from(docs));
        }
      } else {
        await createBike(form);
        const created = bikes.find(b => b.frame_no === form.frame_no && b.plate_no === form.plate_no);
        if (created) {
          await bikeMetaAPI.put(created.id, { color, specs });
          if (docs && docs.length) {
            await bikeMetaAPI.uploadDocs(created.id, Array.from(docs));
          }
        }
      }
      setShowForm(false);
      fetchAll();
    } catch (err) {
      console.error('Failed to save bike:', err);
    }
  };

  const doArchive = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bike?')) return;
    try {
      await bikeMetaAPI.deleteBike(id);
      await fetchAll();
    } catch (err) {
      console.error('Failed to delete bike:', err);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      available: 'bg-green-100 text-green-700 border-green-200',
      rented: 'bg-orange-100 text-orange-700 border-orange-200',
      maintenance: 'bg-stone-100 text-stone-700 border-stone-200'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles] || styles.maintenance}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Helmet>
        <title>Bike Management - SriRentABike</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 pt-24 md:pt-32 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">Bike Fleet</h1>
            <p className="text-stone-500 font-medium">Manage your rental inventory and bike status</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={startCreate} 
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 min-h-[48px]"
            >
              <Plus className="w-5 h-5" />
              Add Bike
            </button>
            <button 
              onClick={() => fetchAll()} 
              className="inline-flex items-center justify-center p-3.5 bg-white border border-stone-200 text-stone-600 rounded-2xl hover:bg-stone-50 transition-all min-h-[48px] min-w-[48px]"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-stone-100 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-orange-500 transition-colors" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by model, frame or plate..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all min-h-[48px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-48">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 transition-all appearance-none text-sm font-bold min-h-[48px]"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-8 flex items-center gap-3 text-red-600 font-medium">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Mobile Card View */}
        <div className="grid grid-cols-1 md:hidden gap-4">
          {isLoading ? (
            <div className="py-12 text-center text-stone-400">Loading fleet...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-stone-400 bg-white rounded-3xl border border-stone-100">No bikes found</div>
          ) : (
            filtered.map((b) => (
              <div key={b.id} className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600">
                      <Bike className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-stone-900">{b.model}</h3>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{b.plate_no}</p>
                    </div>
                  </div>
                  <StatusBadge status={b.availability_status} />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <span className="block text-stone-400 text-[10px] font-black uppercase tracking-wider mb-0.5">Frame Number</span>
                    <span className="font-mono font-bold text-stone-700">{b.frame_no}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => startEdit(b.id)} 
                    className="flex-1 py-3 bg-stone-100 text-stone-900 font-bold rounded-xl hover:bg-stone-200 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => doArchive(b.id)} 
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-8 py-5 text-left text-xs font-black text-stone-400 uppercase tracking-widest">Bike Info</th>
                <th className="px-8 py-5 text-left text-xs font-black text-stone-400 uppercase tracking-widest">Identifiers</th>
                <th className="px-8 py-5 text-left text-xs font-black text-stone-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-right text-xs font-black text-stone-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-stone-400">Loading fleet...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-stone-400">No bikes found</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                          <Bike className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black text-stone-900">{b.model}</p>
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Registered Fleet</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-stone-700">Plate: <span className="text-orange-600">{b.plate_no}</span></p>
                        <p className="text-[10px] font-mono text-stone-400">Frame: {b.frame_no}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <StatusBadge status={b.availability_status} />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => startEdit(b.id)} 
                          className="p-2.5 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-900 hover:text-white transition-all"
                          title="Edit Bike"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => doArchive(b.id)} 
                          className="p-2.5 bg-stone-100 text-stone-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                          title="Delete Bike"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <h2 className="text-xl font-black text-stone-900">{editingId ? 'Edit Bike Details' : 'Add New Bike'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-stone-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>
            
            <form onSubmit={submitForm} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 ml-1">Bike Model *</label>
                  <input 
                    value={form.model} 
                    onChange={(e) => setForm({ ...form, model: e.target.value })} 
                    required 
                    placeholder="e.g., Honda Dio"
                    className="w-full px-5 py-4 rounded-2xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 transition-all min-h-[56px]" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700 ml-1">Plate Number *</label>
                    <input 
                      value={form.plate_no} 
                      onChange={(e) => setForm({ ...form, plate_no: e.target.value })} 
                      required 
                      placeholder="WP BAX-1234"
                      className="w-full px-5 py-4 rounded-2xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 transition-all min-h-[56px]" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700 ml-1">Frame Number *</label>
                    <input 
                      value={form.frame_no} 
                      onChange={(e) => setForm({ ...form, frame_no: e.target.value })} 
                      required 
                      placeholder="FRAME123456"
                      className="w-full px-5 py-4 rounded-2xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 transition-all min-h-[56px]" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 ml-1">Current Status</label>
                  <div className="flex p-1 bg-stone-100 rounded-2xl gap-1">
                    {(['available', 'rented', 'maintenance'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, availability_status: s })}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all min-h-[44px] ${form.availability_status === s ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700 ml-1">Color</label>
                    <div className="flex items-center gap-3 p-2 bg-stone-50 rounded-2xl border border-stone-200">
                      <input type="color" value={color || '#ffffff'} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded-xl border-none p-0 cursor-pointer" />
                      <span className="text-xs font-mono font-bold text-stone-500 uppercase">{color}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700 ml-1">Specifications</label>
                    <input value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder="e.g., 110cc, 2 Helmets" className="w-full px-5 py-4 rounded-2xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 transition-all min-h-[56px]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 ml-1">Documentation</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      multiple 
                      onChange={(e) => setDocs(e.target.files)} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div className="w-full px-5 py-6 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-2 group-hover:border-orange-300 transition-colors">
                      <Upload className="w-6 h-6 text-stone-400" />
                      <span className="text-sm font-bold text-stone-500">{docs ? `${docs.length} files selected` : 'Click or drag documents to upload'}</span>
                    </div>
                  </div>
                  {docUrls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Current Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {docUrls.map((u, i) => (
                          <a key={i} href={u} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold hover:bg-stone-200 transition-colors truncate max-w-[150px]">
                            Doc {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 bg-stone-100 text-stone-600 font-bold rounded-2xl hover:bg-stone-200 transition-all min-h-[56px]">Cancel</button>
                <button type="submit" className="flex-2 py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all min-h-[56px] px-10 shadow-lg shadow-stone-200">
                  {editingId ? 'Save Changes' : 'Create Bike'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
