import { create } from 'zustand';
import { agreementsAPI } from '../services/api';

interface TouristData {
  first_name: string;
  last_name: string;
  nationality: string;
  passport_no: string;
  email: string;
  phone_number: string;
  home_address: string;
  hotel_name?: string;
}

interface ServerTourist {
  first_name: string;
  last_name: string;
  nationality: string;
  passport_no: string;
  email: string;
  phone_number: string;
  home_address: string;
  hotel_name?: string;
}

interface ServerAgreement {
  id: string;
  status: string;
  bike_id?: string;
  signature_url: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  tourists?: ServerTourist;
}

interface Agreement {
  id: string;
  tourist_data: TouristData;
  status: 'pending' | 'completed' | 'expired';
  bike_id?: string;
  signature_url: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}
type AgreementStatus = 'pending' | 'completed' | 'expired';
const isAgreementStatus = (s: string): s is AgreementStatus =>
  s === 'pending' || s === 'completed' || s === 'expired';

interface AgreementsState {
  agreements: Agreement[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAgreements: (filters?: { search?: string; status?: string }) => Promise<void>;
  fetchAgreement: (id: string) => Promise<Agreement | null>;
  updateAgreement: (id: string, data: Partial<Agreement>) => Promise<void>;
  clearError: () => void;
}

export const useAgreementsStore = create<AgreementsState>((set, get) => ({
  agreements: [],
  isLoading: false,
  error: null,

  fetchAgreements: async (filters) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await agreementsAPI.getAll(filters);
      const serverAgreements: ServerAgreement[] = response.data.agreements ?? [];
      const mapped = serverAgreements.map((a) => ({
        id: a.id,
        tourist_data: a.tourists
          ? {
              first_name: a.tourists.first_name,
              last_name: a.tourists.last_name,
              nationality: a.tourists.nationality,
              passport_no: a.tourists.passport_no,
              email: a.tourists.email,
              phone_number: a.tourists.phone_number,
              home_address: a.tourists.home_address,
              hotel_name: a.tourists.hotel_name,
            }
          : {
              first_name: '',
              last_name: '',
              nationality: '',
              passport_no: '',
              email: '',
              phone_number: '',
              home_address: '',
              hotel_name: '',
            },
        status: isAgreementStatus(a.status) ? a.status : 'pending',
        bike_id: a.bike_id,
        signature_url: a.signature_url,
        pdf_url: a.pdf_url,
        created_at: a.created_at,
        updated_at: a.updated_at,
      }));
      set({ agreements: mapped, isLoading: false });
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to fetch agreements';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchAgreement: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await agreementsAPI.getById(id);
      const a: ServerAgreement = response.data.agreement;
      const mapped =
        a &&
        ({
          id: a.id,
          tourist_data: a.tourists
            ? {
                first_name: a.tourists.first_name,
                last_name: a.tourists.last_name,
                nationality: a.tourists.nationality,
                passport_no: a.tourists.passport_no,
                email: a.tourists.email,
                phone_number: a.tourists.phone_number,
                home_address: a.tourists.home_address,
                hotel_name: a.tourists.hotel_name,
              }
            : {
                first_name: '',
                last_name: '',
                nationality: '',
                passport_no: '',
                email: '',
                phone_number: '',
                home_address: '',
                hotel_name: '',
              },
          status: isAgreementStatus(a.status) ? a.status : 'pending',
          bike_id: a.bike_id,
          signature_url: a.signature_url,
          pdf_url: a.pdf_url,
          created_at: a.created_at,
          updated_at: a.updated_at,
        } as Agreement);
      set({ isLoading: false });
      return mapped || null;
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to fetch agreement';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateAgreement: async (id: string, data: Partial<Agreement>) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await agreementsAPI.update(id, data);
      
      // Update the agreement in the local state
      const { agreements } = get();
      const a: ServerAgreement = response.data.agreement;
      const mapped =
        a &&
        ({
          id: a.id,
          tourist_data: a.tourists
            ? {
                first_name: a.tourists.first_name,
                last_name: a.tourists.last_name,
                nationality: a.tourists.nationality,
                passport_no: a.tourists.passport_no,
                email: a.tourists.email,
                phone_number: a.tourists.phone_number,
                home_address: a.tourists.home_address,
                hotel_name: a.tourists.hotel_name,
              }
            : {
                first_name: '',
                last_name: '',
                nationality: '',
                passport_no: '',
                email: '',
                phone_number: '',
                home_address: '',
                hotel_name: '',
              },
          status: isAgreementStatus(a.status) ? a.status : 'pending',
          bike_id: a.bike_id,
          signature_url: a.signature_url,
          pdf_url: a.pdf_url,
          created_at: a.created_at,
          updated_at: a.updated_at,
        } as Agreement);
      const updatedAgreements = agreements.map(agreement =>
        agreement.id === id && mapped ? mapped : agreement
      );
      
      set({ agreements: updatedAgreements, isLoading: false });
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to update agreement';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
