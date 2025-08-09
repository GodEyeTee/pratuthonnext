import { Booking, MeterReading, Room, Tenant } from '@/domain/models';

interface BillInput {
  room: Room;
  previousReading: MeterReading;
  currentReading: MeterReading;
  booking: Booking;
  tenant: Tenant;
  billingDate: Date;
  rentDueDay?: number;
}

export interface BillSummary {
  waterUsage: number;
  electricUsage: number;
  waterCost: number;
  electricCost: number;
  baseRent: number;
  lateFee: number;
  total: number;
}

export function calculateBill(input: BillInput): BillSummary {
  // Use water_meter and electric_meter instead of water_reading/electric_reading
  const waterUsage =
    (input.currentReading.water_meter || 0) -
    (input.previousReading.water_meter || 0);
  const electricUsage =
    (input.currentReading.electric_meter || 0) -
    (input.previousReading.electric_meter || 0);

  const waterCost = waterUsage * input.room.water_rate;
  const electricCost = electricUsage * input.room.electric_rate;

  // Use booking_type from booking instead of rental_type from tenant
  const baseRent =
    input.booking.booking_type === 'monthly'
      ? input.room.rate_monthly
      : input.room.rate_daily;

  let lateFee = 0;
  if (input.booking.booking_type === 'monthly' && input.rentDueDay) {
    const dueDate = new Date(input.billingDate);
    dueDate.setDate(input.rentDueDay);
    if (input.billingDate > dueDate) {
      const daysLate = Math.ceil(
        (input.billingDate.getTime() - dueDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      lateFee = daysLate * 100;
    }
  }

  return {
    waterUsage,
    electricUsage,
    waterCost,
    electricCost,
    baseRent,
    lateFee,
    total: baseRent + waterCost + electricCost + lateFee,
  };
}
