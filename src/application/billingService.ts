import { AdditionalCharge, MeterReading, RentalType, Room } from '@/domain/models';

interface BillInput {
  room: Room;
  previous: MeterReading;
  current: MeterReading;
  rentalType: RentalType;
  payDate: Date;
  rentDueDay?: number; // default 5
  additionalCharges?: AdditionalCharge[];
}

export interface BillSummary {
  waterUsage: number;
  electricUsage: number;
  waterCost: number;
  electricCost: number;
  baseRent: number;
  lateFee: number;
  additionalTotal: number;
  total: number;
}

export function calculateBill(input: BillInput): BillSummary {
  const rentDueDay = input.rentDueDay ?? 5;
  const waterUsage = input.current.water - input.previous.water;
  const electricUsage = input.current.electric - input.previous.electric;
  const waterCost = waterUsage * input.room.waterRate;
  const electricCost = electricUsage * input.room.electricRate;
  const baseRent =
    input.rentalType === 'monthly' ? input.room.rateMonthly : input.room.rateDaily;

  const additionalTotal = (input.additionalCharges ?? []).reduce(
    (sum, c) => sum + c.amount,
    0
  );

  // late fee applies only to monthly rentals
  let lateFee = 0;
  if (input.rentalType === 'monthly') {
    const dueDate = new Date(input.current.date);
    dueDate.setDate(rentDueDay);
    const diff = input.payDate.getTime() - dueDate.getTime();
    if (diff > 0) {
      const daysLate = Math.ceil(diff / (1000 * 60 * 60 * 24));
      lateFee = daysLate * 100;
    }
  }

  const total = baseRent + waterCost + electricCost + lateFee + additionalTotal;
  return {
    waterUsage,
    electricUsage,
    waterCost,
    electricCost,
    baseRent,
    lateFee,
    additionalTotal,
    total,
  };
}
