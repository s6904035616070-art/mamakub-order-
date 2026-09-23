export const metadata = {
  title: 'mamakub',
  description: 'ระบบสั่งอาหารร้านมาม่าเกาหลี mamakub',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
