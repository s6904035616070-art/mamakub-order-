# mamakub

ระบบสั่งอาหารร้านมาม่าเกาหลี "mamakub" — Next.js (App Router, JavaScript) + Supabase, deploy บน Vercel

## เริ่มต้นใช้งาน

```bash
npm install
cp .env.local.example .env.local   # แล้วใส่ค่า Supabase จริง
npm run dev
```

เปิด http://localhost:3000

## หน้าเพจ (ทดสอบ deploy)

- `/` — หน้าแรก แสดงชื่อร้าน
- `/generate-qr` — หน้าสร้าง QR โต๊ะ (placeholder)
- `/kitchen` — หน้าครัว (placeholder)

## โน้ตสำคัญสำหรับนักพัฒนา / Claude

ดูรายละเอียดโครงสร้างฐานข้อมูล Supabase ที่มีอยู่แล้ว และกฎเรื่อง `params` เป็น Promise
ใน Dynamic Route ของ Next.js เวอร์ชันล่าสุด ได้ที่ [`CLAUDE.md`](./CLAUDE.md)

## Deploy

Deploy บน Vercel โดยตั้งค่า environment variables ต่อไปนี้ใน Project Settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
