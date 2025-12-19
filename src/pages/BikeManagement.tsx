import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useBikesStore } from '@/stores/bikes';
import { bikeMetaAPI } from '@/services/api';
import { Plus, Edit3, Archive, RefreshCw, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';

export default function BikeManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { bikes, isLoading, error, fetchAll, createBike, updateBike, archiveBike, clearError } = useBikesStore();
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
      setColor(meta.color || '');
      setSpecs(meta.specs || '');
    }).catch(() => {});
    bikeMetaAPI.listDocs(id).then(r => setDocUrls(r.data?.urls || [])).catch(() => setDocUrls([]));
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  const doArchive = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this bike? This will archive or delete based on references.');
    if (!confirmed) return;
    // Try delete; if fails, fallback to archive
    try {
      await bikeMetaAPI.deleteBike(id);
      await fetchAll();
    } catch {
      await archiveBike(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Bike Management</h1>
            <div className="flex items-center space-x-2">
              <button onClick={startCreate} className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Bike
              </button>
              <button onClick={() => fetchAll()} className="inline-flex items-center px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-4 rounded-md shadow mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center border rounded px-2 py-1">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search model/frame/plate"
                className="outline-none text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'available' | 'rented' | 'maintenance')}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-md shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frame No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td className="px-6 py-4 text-sm text-gray-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-6 py-4 text-sm text-gray-500">No bikes found</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{b.model}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{b.frame_no}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{b.plate_no}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        b.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                        b.availability_status === 'rented' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {b.availability_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                        <button onClick={() => startEdit(b.id)} className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100">
                          <Edit3 className="w-4 h-4 mr-1" /> Edit
                        </button>
                        <button onClick={() => doArchive(b.id)} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100">
                          <Archive className="w-4 h-4 mr-1" /> Archive
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

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Bike' : 'Add New Bike'}</h2>
            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frame No *</label>
                <input value={form.frame_no} onChange={(e) => setForm({ ...form, frame_no: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plate No *</label>
                <input value={form.plate_no} onChange={(e) => setForm({ ...form, plate_no: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value as 'available' | 'rented' | 'maintenance' })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="available">available</option>
                  <option value="rented">rented</option>
                  <option value="maintenance">maintenance</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input type="color" value={color || '#ffffff'} onChange={(e) => setColor(e.target.value)} className="w-16 h-10 p-0 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
                  <input value={specs} onChange={(e) => setSpecs(e.target.value)} placeholder="e.g., helmet size, tank capacity" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documentation Uploads</label>
                <input type="file" multiple onChange={(e) => setDocs(e.target.files)} className="w-full text-sm" />
                {docUrls.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-600">
                    {docUrls.map((u) => <li key={u}><a href={u} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{u}</a></li>)}
                  </ul>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">{editingId ? 'Save' : 'Create'}</button>
              </div>
            </form>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
                <div className="flex">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  <div className="ml-2">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            {!error && !isLoading && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-4">
                <div className="flex">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div className="ml-2">
                    <p className="text-sm text-green-800">Ready</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
