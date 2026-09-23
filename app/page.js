import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>mamakub</h1>
      <p>ระบบสั่งอาหารร้านมาม่าเกาหลี</p>
      <ul>
        <li>
          <Link href="/generate-qr">ไปหน้าสร้าง QR (/generate-qr)</Link>
        </li>
        <li>
          <Link href="/kitchen">ไปหน้าครัว (/kitchen)</Link>
        </li>
      </ul>
    </main>
  );
}
