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

interface ServerBike {
  model: string;
  plate_no: string;
}

interface ServerAgreement {
  id: string;
  agreement_no?: string;
  status: string;
  bike_id?: string;
  bikes?: ServerBike | null;
  start_date?: string;
  end_date?: string;
  payment_status?: string;
  amount_paid?: number;
  signature_url: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  tourists?: ServerTourist;
}

// Rental lifecycle. Overdue is derived (active AND end_date < today), never
// stored, so it is not part of this union.
export type AgreementStatus = 'pending' | 'signed' | 'active' | 'completed';

export interface Agreement {
  id: string;
  agreement_no: string;
  tourist_data: TouristData;
  status: AgreementStatus;
  bike_id?: string;
  bike?: ServerBike | null;
  start_date: string;
  end_date: string;
  payment_status: 'unpaid' | 'partial' | 'paid';
  amount_paid: number;
  signature_url: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}
const isAgreementStatus = (s: string): s is AgreementStatus =>
  s === 'pending' || s === 'signed' || s === 'active' || s === 'completed';

interface AgreementsState {
  agreements: Agreement[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAgreements: (filters?: { search?: string; status?: string; limit?: number }) => Promise<void>;
  fetchAgreement: (id: string) => Promise<Agreement | null>;
  updateAgreement: (id: string, data: Partial<Agreement>) => Promise<void>;
  clearError: () => void;
}

const emptyTourist: TouristData = {
  first_name: '',
  last_name: '',
  nationality: '',
  passport_no: '',
  email: '',
  phone_number: '',
  home_address: '',
  hotel_name: '',
};

const mapServerAgreement = (a: ServerAgreement): Agreement => ({
  id: a.id,
  agreement_no: a.agreement_no || '',
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
    : { ...emptyTourist },
  status: isAgreementStatus(a.status) ? a.status : 'pending',
  bike_id: a.bike_id,
  bike: a.bikes ?? null,
  start_date: a.start_date || '',
  end_date: a.end_date || '',
  payment_status:
    a.payment_status === 'partial' || a.payment_status === 'paid' ? a.payment_status : 'unpaid',
  amount_paid: typeof a.amount_paid === 'number' ? a.amount_paid : 0,
  signature_url: a.signature_url,
  pdf_url: a.pdf_url,
  created_at: a.created_at,
  updated_at: a.updated_at,
});

export const useAgreementsStore = create<AgreementsState>((set, get) => ({
  agreements: [],
  isLoading: false,
  error: null,

  fetchAgreements: async (filters) => {
    set({ isLoading: true, error: null });
    
    try {
      // The endpoint defaults to 20 rows; the dashboard's stat cards count
      // over whatever comes back, so ask for the whole set explicitly.
      const response = await agreementsAPI.getAll({ limit: 500, ...filters });
      const serverAgreements: ServerAgreement[] = response.data.agreements ?? [];
      const mapped = serverAgreements.map(mapServerAgreement);
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
      const mapped = a ? mapServerAgreement(a) : null;
      set({ isLoading: false });
      return mapped;
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
      
      // The PUT response is the bare agreement row (no tourists join), so
      // merge it over the local record rather than replacing it — otherwise
      // the tourist details would blank out in the list.
      const { agreements } = get();
      const a: ServerAgreement = response.data.agreement;
      const updatedAgreements = agreements.map(agreement =>
        agreement.id === id && a
          ? { ...agreement, ...mapServerAgreement(a), tourist_data: agreement.tourist_data }
          : agreement
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
