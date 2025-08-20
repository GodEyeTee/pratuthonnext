// src/domain/models.ts
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
  status: 'available' | 'occupied' | 'maintenance';
  rate_daily: number;
  rate_monthly: number;
  water_rate: number;
  electric_rate: number;
  common_fee?: number;
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
  profile_image?: string;
  documents?: TenantDocument[];
  created_at?: string;
  updated_at?: string;
}

export interface TenantDocument {
  id: string;
  name: string;
  url: string;
  type: 'contract' | 'id_card' | 'other';
  uploaded_at: string;
}

export interface Booking {
  id: string;
  room_id: string;
  tenant_id: string;
  booking_type: 'daily' | 'monthly';
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  check_in_date: string;
  check_out_date?: string;
  deposit_amount?: number;
  deposit_returned?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  room?: Room;
  tenant?: Tenant;
}

export interface Payment {
  id: string;
  booking_id?: string;
  payment_type: 'rent' | 'deposit' | 'utilities' | 'shop' | 'other';
  amount: number;
  payment_date: string;
  payment_method?: 'cash' | 'transfer' | 'credit';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  receipt_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
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
  water_cost?: number;
  electric_cost?: number;
  common_fee?: number;
  total_cost?: number;
  recorded_by?: string;
  created_at?: string;
  room?: Room;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  unit?: string;
  image?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  room_id?: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee?: number;
  total: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled';
  payment_status: 'pending' | 'paid' | 'credit';
  delivery_type: 'pickup' | 'delivery';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ShopCredit {
  id: string;
  user_id: string;
  room_id: string;
  credit_limit: number;
  credit_used: number;
  credit_available: number;
  enabled: boolean;
  last_reset?: string;
  updated_at?: string;
}

export interface MaintenanceRequest {
  id: string;
  room_id: string;
  tenant_id?: string;
  issue_type?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  completed_at?: string;
  cost?: number;
  notes?: string;
  images?: string[];
  created_at?: string;
  updated_at?: string;
  room?: Room;
  tenant?: Tenant;
}
