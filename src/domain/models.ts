export type RentalType = 'monthly' | 'daily';

export interface Room {
  id: string;
  number: string;
  type: string;
  floor?: number;
  status?: string;
  rateMonthly: number;
  rateDaily: number;
  rate_monthly?: number;
  rate_daily?: number;
  waterRate: number;
  water_rate?: number;
  electricRate: number;
  electric_rate?: number;
  size?: number;
  description?: string;
}

export interface MeterReading {
  roomId: string;
  date: string;
  water: number;
  electric: number;
}

export interface AdditionalCharge {
  name: string;
  amount: number;
}
