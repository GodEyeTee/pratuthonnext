import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>ระบบจัดการหอพัก</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">เริ่มต้นใช้งานระบบจัดการห้องพักและผู้ใช้</p>
          <Button asChild className="w-full">
            <Link href="/login">เข้าสู่ระบบ</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
