import { create } from 'zustand';
import { guestLinksAPI } from '../services/api';

interface TouristData {
  first_name: string;
  last_name: string;
  passport_no: string;
  nationality: string;
  home_address: string;
  phone_number: string;
  email: string;
  hotel_name?: string;
}

interface GuestFormState {
  // Token validation
  isValidating: boolean;
  isTokenValid: boolean;
  tokenError: string | null;
  
  // Form data
  touristData: TouristData;
  signature: string | null;
  
  // Agreement data
  agreement: unknown | null;
  
  // Submission
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  guestToken: string | null;
  
  // Actions
  validateToken: (token: string) => Promise<void>;
  updateTouristData: (data: Partial<TouristData>) => void;
  setSignature: (signature: string | null) => void;
  submitForm: (payload: Record<string, unknown>) => Promise<void>;
  clearErrors: () => void;
  resetForm: () => void;
}

const initialTouristData: TouristData = {
  first_name: '',
  last_name: '',
  passport_no: '',
  nationality: '',
  home_address: '',
  phone_number: '',
  email: '',
  hotel_name: '',
};

export const useGuestFormStore = create<GuestFormState>((set, get) => ({
  // Token validation
  isValidating: false,
  isTokenValid: false,
  tokenError: null,
  
  // Form data
  touristData: { ...initialTouristData },
  signature: null,
  
  // Agreement data
  agreement: null,
  
  // Submission
  isSubmitting: false,
  submitError: null,
  submitSuccess: false,
  guestToken: null,
  
  validateToken: async (token: string) => {
    set({ isValidating: true, tokenError: null });
    
    try {
      // Validate token
      const validationResponse = await guestLinksAPI.validate(token);
      const { valid } = validationResponse.data;
      
      if (!valid) {
        throw new Error('Invalid or expired token');
      }
      
      // Get agreement details
      const agreementResponse = await guestLinksAPI.getAgreement(token);
      const { agreement } = agreementResponse.data;
      
      set({ 
        isTokenValid: true,
        agreement,
        guestToken: token,
        isValidating: false 
      });
    } catch (error: unknown) {
      const respErr = error as { response?: { data?: { error?: string } } };
      const message = respErr.response?.data?.error || (error instanceof Error ? error.message : null) || 'Invalid guest link';
      const errorMessage = message;
      set({ 
        isTokenValid: false,
        tokenError: errorMessage,
        isValidating: false 
      });
    }
  },
  
  updateTouristData: (data: Partial<TouristData>) => {
    set((state) => ({
      touristData: { ...state.touristData, ...data }
    }));
  },
  
  setSignature: (signature: string | null) => {
    set({ signature });
  },
  
  submitForm: async (payload: Record<string, unknown>) => {
    const { guestToken } = get();

    if (!guestToken) {
      set({ submitError: 'Invalid guest link' });
      return;
    }

    set({ isSubmitting: true, submitError: null });

    try {
      // Signs the agreement the link points at. The old path called
      // agreementsAPI.create here, which minted a duplicate booking instead of
      // updating the original — that is why every link sat unused.
      await guestLinksAPI.submit(guestToken, payload);

      set({
        submitSuccess: true,
        isSubmitting: false
      });
    } catch (error: unknown) {
      const respErr = error as { response?: { data?: { error?: string } } };
      const message = respErr.response?.data?.error || (error instanceof Error ? error.message : null) || 'Failed to submit form';
      const errorMessage = message;
      set({
        submitError: errorMessage,
        isSubmitting: false
      });
    }
  },
  
  clearErrors: () => {
    set({ 
      tokenError: null,
      submitError: null 
    });
  },
  
  resetForm: () => {
    set({
      touristData: { ...initialTouristData },
      signature: null,
      submitSuccess: false,
      submitError: null,
    });
  },
}));
