export type RentalType = 'monthly' | 'daily';

export interface Profile {
  id: string;
  email?: string;
  display_name?: string;
  role?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  floor: number;
  status: string;
  rate_daily: number;
  rate_monthly: number;
  water_rate: number;
  electric_rate: number;
  size?: number;
  description?: string;
  amenities?: string[];
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Tenant {
  id: string;
  user_id?: string;
  id_card?: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: string;
  room_id: string;
  tenant_id: string;
  booking_type: 'daily' | 'monthly';
  status: string;
  check_in_date: string;
  check_out_date?: string;
  deposit_amount?: number;
  deposit_returned?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  room?: Room;
  tenant?: Tenant;
}

export interface Payment {
  id: string;
  booking_id?: string;
  payment_type: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  status: string;
  receipt_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  booking?: Booking;
}

export interface MeterReading {
  id: string;
  room_id: string;
  reading_date: string;
  water_meter?: number;
  electric_meter?: number;
  previous_water?: number;
  previous_electric?: number;
  water_usage?: number;
  electric_usage?: number;
  recorded_by?: string;
  created_at?: string;
  room?: Room;
}

export interface MaintenanceRequest {
  id: string;
  room_id: string;
  tenant_id?: string;
  issue_type?: string;
  description?: string;
  priority?: string;
  status: string;
  assigned_to?: string;
  completed_at?: string;
  cost?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  room?: Room;
  tenant?: Tenant;
}
