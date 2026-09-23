# mamakub — โน้ตสำหรับ Claude / ผู้พัฒนา

โปรเจกต์ระบบสั่งอาหารร้านมาม่าเกาหลี "mamakub" สร้างด้วย Next.js (App Router, JavaScript)
เชื่อมต่อฐานข้อมูลผ่าน Supabase และ deploy บน Vercel

## ⚠️ สำคัญ: Next.js เวอร์ชันล่าสุด — params เป็น Promise

โปรเจกต์นี้ใช้ Next.js เวอร์ชันล่าสุด ซึ่ง `params` (และ `searchParams`) ใน Dynamic Route
**ไม่ใช่ object ธรรมดาอีกต่อไป แต่เป็น Promise** ต้อง unwrap ก่อนใช้งานเสมอ

- ใน **Server Component**: ใช้ `await params`
  ```js
  export default async function Page({ params }) {
    const { sessionId } = await params;
    // ...
  }
  ```
- ใน **Client Component**: ใช้ `use()` จาก `react` เพื่อ unwrap
  ```js
  'use client';
  import { use } from 'react';

  export default function Page({ params }) {
    const { sessionId } = use(params);
    // ...
  }
  ```

ห้ามเข้าถึง `params.xxx` ตรง ๆ โดยไม่ unwrap ก่อน — จะใช้กฎนี้เมื่อสร้างหน้าสั่งอาหาร
(เช่น `/order/[sessionId]`) ในขั้นตอนถัดไป

## โครงสร้างฐานข้อมูล (Supabase, มีอยู่แล้ว — ไม่ต้องสร้างใหม่)

อ้างอิงโครงสร้างนี้เสมอเมื่อเขียนโค้ด query/insert ในโปรเจกต์นี้:

### `sessions`
| column        | type      | note                         |
|---------------|-----------|------------------------------|
| id            | uuid/int  | primary key                  |
| table_number  | -         | หมายเลขโต๊ะ                  |
| adult_count   | int       | จำนวนผู้ใหญ่                 |
| child_count   | int       | จำนวนเด็ก                    |
| status        | text      | สถานะโต๊ะ/เซสชัน             |
| created_at    | timestamp | เวลาสร้าง                    |

### `menu_categories`
| column     | type | note                |
|------------|------|---------------------|
| id         | -    | primary key         |
| name       | text | ชื่อหมวดหมู่        |
| sort_order | int  | ลำดับการแสดงผล      |

### `menu_items`
| column      | type | note                              |
|-------------|------|-----------------------------------|
| id          | -    | primary key                       |
| category_id | -    | FK → menu_categories.id           |
| name        | text | ชื่อเมนู                          |

### `orders`
| column       | type      | note                          |
|--------------|-----------|-------------------------------|
| id           | -         | primary key                   |
| session_id   | -         | FK → sessions.id               |
| table_number | -         | หมายเลขโต๊ะ (denormalized)    |
| items        | jsonb     | รายการอาหารที่สั่ง            |
| status       | text      | สถานะออเดอร์                  |
| created_at   | timestamp | เวลาสร้าง                     |

## Environment Variables

ตั้งค่าใน `.env.local` (ดูตัวอย่างใน `.env.local.example`) และใน Vercel Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## รันโปรเจกต์

```bash
npm install
npm run dev
```

## Deploy บน Vercel

Push โค้ดขึ้น Git repo แล้ว import เข้า Vercel ตั้งค่า environment variables สองตัวด้านบนใน
Project Settings ก่อน deploy
