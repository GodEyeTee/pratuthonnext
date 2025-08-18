'use server';

import { revalidateTag } from 'next/cache';

/** Revalidate cache ของการ์ดอากาศตามแท็กที่ผูกไว้กับพิกัด */
export async function refreshWeatherTag(tag: string) {
  // บังคับให้ fetch ครั้งถัดไปดึงข้อมูลล่าสุด
  revalidateTag(tag);
}
