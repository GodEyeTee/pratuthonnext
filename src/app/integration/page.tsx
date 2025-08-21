// Server Component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default async function IntegrationPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>การเชื่อมต่อ (ตัวอย่าง)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded border p-3">
            <div className="font-medium">Webhook</div>
            <div className="text-muted-foreground">
              ตั้งค่า URL สำหรับออเดอร์/การชำระเงิน
            </div>
          </div>
          <div className="rounded border p-3">
            <div className="font-medium">API Key</div>
            <div className="text-muted-foreground">
              พื้นที่จัดการคีย์สำหรับ service ภายนอก
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
