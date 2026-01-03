export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin';
  created_at: string;
}

export interface Tourist {
  id: string;
  first_name: string;
  last_name: string;
  passport_no: string;
  nationality: string;
  home_address: string;
  phone_number: string;
  email: string;
  hotel_name?: string;
  created_at: string;
}

export interface Bike {
  id: string;
  model: string;
  frame_no: string;
  plate_no: string;
  availability_status: 'available' | 'rented' | 'maintenance';
  created_at: string;
}

export interface Agreement {
  id: string;
  agreement_no: string;
  tourist_id: string;
  bike_id?: string;
  admin_id?: string;
  start_date: string;
  end_date: string;
  daily_rate: number;
  total_amount: number;
  deposit: number;
  status: 'pending' | 'signed' | 'completed';
  pdf_url?: string;
  signature_url?: string;
  signed_at?: string;
  created_at: string;
  requested_model?: string;
  outside_area?: boolean;
}

export interface GuestLink {
  id: string;
  agreement_id: string;
  token: string;
  expires_at: string;
  max_uses: number;
  used_count: number;
  status: 'active' | 'expired' | 'used';
  created_at: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  agreement_id?: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export interface CreateAgreementRequest {
  tourist_data: {
    first_name: string;
    last_name: string;
    passport_no: string;
    nationality: string;
    home_address: string;
    phone_number: string;
    email: string;
    hotel_name?: string;
  };
  signature: string; // Base64 encoded image
  start_date: string;
  end_date: string;
  daily_rate: number;
  total_amount: number;
  deposit: number;
  requested_model?: string;
  outside_area?: boolean;
}

export interface UpdateAgreementRequest {
  bike_id?: string;
  start_date?: string;
  end_date?: string;
  daily_rate?: number;
  total_amount?: number;
  deposit?: number;
  status?: 'pending' | 'signed' | 'completed';
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}