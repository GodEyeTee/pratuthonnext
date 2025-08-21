'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';

type Ticket = {
  id: string;
  room: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
};

export default function MaintenancePage() {
  const [draft, setDraft] = useState<Partial<Ticket>>({});
  const [items, setItems] = useState<Ticket[]>([]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>เปิดใบงานซ่อม (ตัวอย่าง)</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <Input
            label="ห้อง"
            value={draft.room || ''}
            onChange={e => setDraft({ ...draft, room: e.target.value })}
          />
          <Input
            label="หัวข้อ"
            value={draft.title || ''}
            onChange={e => setDraft({ ...draft, title: e.target.value })}
          />
          <Input
            label="ความเร่งด่วน (Low/Medium/High)"
            value={draft.priority || ('' as any)}
            onChange={e =>
              setDraft({ ...draft, priority: e.target.value as any })
            }
          />
          <div className="flex items-end">
            <Button
              onClick={() => {
                if (!draft.room || !draft.title) return;
                setItems(v => [
                  {
                    id: crypto.randomUUID(),
                    room: draft.room!,
                    title: draft.title!,
                    priority: (draft.priority as any) || 'Low',
                  },
                  ...v,
                ]);
                setDraft({});
              }}
            >
              บันทึก
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการงาน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <p className="text-muted-foreground">ยังไม่มีงาน</p>
          ) : (
            items.map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    ห้อง {t.room} • {t.priority}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setItems(v => v.filter(x => x.id !== t.id))}
                >
                  ปิดงาน
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
