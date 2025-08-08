import { NextRequest, NextResponse } from 'next/server';
import { calculateBill } from '@/application/billingService';
import { AdditionalCharge, MeterReading, Room, RentalType } from '@/domain/models';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const room: Room = body.room;
  const previous: MeterReading = body.previous;
  const current: MeterReading = body.current;
  const rentalType: RentalType = body.rentalType;
  const payDate = new Date(body.payDate);
  const rentDueDay = body.rentDueDay as number | undefined;
  const additionalCharges: AdditionalCharge[] = body.additionalCharges ?? [];

  const summary = calculateBill({
    room,
    previous,
    current,
    rentalType,
    payDate,
    rentDueDay,
    additionalCharges,
  });

  return NextResponse.json(summary);
}
