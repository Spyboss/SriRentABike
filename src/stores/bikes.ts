import { create } from 'zustand';
import { bikesAPI } from '@/services/api';

export interface Bike {
  id: string;
  model: string;
  frame_no: string;
  plate_no: string;
  availability_status: 'available' | 'rented' | 'maintenance';
  created_at: string;
}

interface BikesState {
  bikes: Bike[];
  available: Bike[];
  isLoading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  fetchAvailable: () => Promise<void>;
  createBike: (data: Omit<Bike, 'id' | 'created_at'>) => Promise<void>;
  updateBike: (id: string, data: Partial<Bike>) => Promise<void>;
  archiveBike: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useBikesStore = create<BikesState>((set, get) => ({
  bikes: [],
  available: [],
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await bikesAPI.list();
      set({ bikes: res.data.bikes || [], isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to load bikes';
      set({ error: msg, isLoading: false });
    }
  },

  fetchAvailable: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await bikesAPI.available();
      set({ available: res.data.bikes || [], isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to load available bikes';
      set({ error: msg, isLoading: false });
    }
  },

  createBike: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await bikesAPI.create({
        model: data.model,
        frame_no: data.frame_no,
        plate_no: data.plate_no,
        availability_status: data.availability_status
      });
      await get().fetchAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create bike';
      set({ error: msg, isLoading: false });
    }
  },

  updateBike: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await bikesAPI.update(id, data);
      await Promise.all([get().fetchAll(), get().fetchAvailable()]);
      set({ isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to update bike';
      set({ error: msg, isLoading: false });
    }
  },

  archiveBike: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await bikesAPI.archive(id);
      await Promise.all([get().fetchAll(), get().fetchAvailable()]);
      set({ isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to archive bike';
      set({ error: msg, isLoading: false });
    }
  },

  clearError: () => set({ error: null })
}));
