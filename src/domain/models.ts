export type RentalType = 'monthly' | 'daily';

export interface Room {
  id: string;
  number: string;
  type: string;
  rateMonthly: number;
  rateDaily: number;
  waterRate: number;
  electricRate: number;
}

export interface MeterReading {
  roomId: string;
  /** ISO date string representing the reading date */
  date: string;
  water: number;
  electric: number;
}

export interface AdditionalCharge {
  name: string;
  amount: number;
}
