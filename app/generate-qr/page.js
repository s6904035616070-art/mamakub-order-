'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const inputStyle = {
  width: '100%',
  fontSize: '1.5rem',
  padding: '0.75rem',
  border: '2px solid #ccc',
  borderRadius: '8px',
  marginBottom: '1rem',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  marginBottom: '0.25rem',
};

const buttonStyle = {
  fontSize: '1.3rem',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
};

export default function GenerateQrPage() {
  const [tableNumber, setTableNumber] = useState('');
  const [adultCount, setAdultCount] = useState('');
  const [childCount, setChildCount] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [existingSession, setExistingSession] = useState(null); // ข้อมูล session เก่าที่เปิดค้าง
  const [showConfirm, setShowConfirm] = useState(false);
  const [closing, setClosing] = useState(false);

  const [result, setResult] = useState(null); // { tableNumber, adultCount, childCount, url }
  const [copied, setCopied] = useState(false);

  function resetForm() {
    setTableNumber('');
    setAdultCount('');
    setChildCount('');
    setExistingSession(null);
    setShowConfirm(false);
    setResult(null);
    setErrorMsg('');
    setCopied(false);
  }

  async function handleOpenTable(e) {
    e.preventDefault();
    setErrorMsg('');

    const tNum = Number(tableNumber);
    const aCount = Number(adultCount);
    const cCount = Number(childCount);

    if (!tNum || tNum <= 0) {
      setErrorMsg('กรุณากรอกเลขโต๊ะให้ถูกต้อง');
      return;
    }
    if (adultCount === '' || aCount < 0) {
      setErrorMsg('กรุณากรอกจำนวนผู้ใหญ่ให้ถูกต้อง');
      return;
    }
    if (childCount === '' || cCount < 0) {
      setErrorMsg('กรุณากรอกจำนวนเด็กให้ถูกต้อง');
      return;
    }

    setLoading(true);
    try {
      // 1) เช็คก่อนว่ามี session เปิดค้างอยู่ที่โต๊ะนี้ไหม
      const { data: existingRows, error: findError } = await supabase
        .from('sessions')
        .select('id, table_number, adult_count, child_count, created_at')
        .eq('table_number', tNum)
        .eq('status', 'open')
        .limit(1);

      if (findError) {
        setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบโต๊ะ: ' + findError.message);
        return;
      }

      if (existingRows && existingRows.length > 0) {
        setExistingSession(existingRows[0]);
        return;
      }

      // 2) ไม่มี session เปิดค้าง -> สร้างใหม่
      const { data: inserted, error: insertError } = await supabase
        .from('sessions')
        .insert({
          table_number: tNum,
          adult_count: aCount,
          child_count: cCount,
          status: 'open',
        })
        .select()
        .single();

      if (insertError) {
        setErrorMsg('เกิดข้อผิดพลาดในการเปิดโต๊ะ: ' + insertError.message);
        return;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/order/${tNum}`;

      setResult({
        tableNumber: tNum,
        adultCount: aCount,
        childCount: cCount,
        url,
      });
    } finally {
      setLoading(false);
    }
  }

  function elapsedMinutes(createdAt) {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - created) / 60000));
  }

  async function handleConfirmCloseOldSession() {
    if (!existingSession) return;
    setClosing(true);
    setErrorMsg('');

    try {
      // เช็คซ้ำว่า status ยังเป็น 'open' อยู่ตอน update เพื่อกันการกดซ้ำซ้อน
      const { data, error } = await supabase
        .from('sessions')
        .update({ status: 'closed' })
        .eq('id', existingSession.id)
        .eq('status', 'open')
        .select();

      if (error) {
        setErrorMsg('เกิดข้อผิดพลาดในการปิดโต๊ะเดิม: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        // ถูกปิดไปแล้วโดยคนอื่นก่อนหน้า
        setErrorMsg('โต๊ะนี้อาจถูกปิดไปแล้วโดยผู้อื่น กรุณาลองใหม่');
        setShowConfirm(false);
        setExistingSession(null);
        return;
      }

      // ปิดสำเร็จ -> ปิดกล่องยืนยัน, เอากล่องเตือนออก, กลับไปฟอร์มเดิม (ค่าที่กรอกยังอยู่ครบ)
      setShowConfirm(false);
      setExistingSession(null);
    } finally {
      setClosing(false);
    }
  }

  function handleCopyLink() {
    if (!result) return;
    navigator.clipboard.writeText(result.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const qrImageUrl = result
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(result.url)}`
    : '';

  return (
    <main
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        padding: '1.5rem',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>เปิดโต๊ะ — mamakub</h1>

      {errorMsg && (
        <div
          style={{
            backgroundColor: '#ffe0e0',
            border: '2px solid #d33',
            color: '#a00',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '1.1rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* ผลลัพธ์ QR หลังเปิดโต๊ะสำเร็จ */}
      {result && (
        <div
          style={{
            border: '2px solid #2a2',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <img
            src={qrImageUrl}
            alt={`QR โต๊ะ ${result.tableNumber}`}
            width={300}
            height={300}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <p style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '1rem' }}>
            โต๊ะ {result.tableNumber} · ผู้ใหญ่ {result.adultCount} · เด็ก {result.childCount}
          </p>
          <p
            style={{
              fontSize: '1rem',
              wordBreak: 'break-all',
              color: '#333',
              marginTop: '0.5rem',
            }}
          >
            {result.url}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                ...buttonStyle,
                fontSize: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#eee',
              }}
            >
              {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกลิงก์'}
            </button>
          </div>
          <button
            type="button"
            onClick={resetForm}
            style={{
              ...buttonStyle,
              backgroundColor: '#0a7',
              color: '#fff',
              marginTop: '1.5rem',
              width: '100%',
            }}
          >
            เปิดโต๊ะใหม่
          </button>
        </div>
      )}

      {/* กล่องเตือน: โต๊ะนี้มี session เปิดค้างอยู่แล้ว */}
      {!result && existingSession && (
        <div
          style={{
            backgroundColor: '#fff3e0',
            border: '3px solid #f80',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#c50', marginTop: 0 }}>
            ⚠️ โต๊ะนี้มีลูกค้าอยู่ระหว่างทานอาหาร กรุณาปิดออเดอร์เดิมก่อน
          </p>
          <p style={{ fontSize: '1.1rem' }}>
            โต๊ะ {existingSession.table_number} · ผู้ใหญ่ {existingSession.adult_count} · เด็ก{' '}
            {existingSession.child_count}
          </p>
          <p style={{ fontSize: '1rem', color: '#555' }}>
            เปิดมาแล้ว {elapsedMinutes(existingSession.created_at)} นาที
          </p>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            style={{
              ...buttonStyle,
              backgroundColor: '#f60',
              color: '#fff',
              width: '100%',
              marginTop: '0.5rem',
            }}
          >
            ปิดออเดอร์เดิม
          </button>
        </div>
      )}

      {/* ฟอร์มกรอกข้อมูลเปิดโต๊ะ */}
      {!result && (
        <form onSubmit={handleOpenTable}>
          <label style={labelStyle} htmlFor="tableNumber">
            เลขโต๊ะ
          </label>
          <input
            id="tableNumber"
            type="number"
            inputMode="numeric"
            min="1"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            style={inputStyle}
            disabled={loading}
          />

          <label style={labelStyle} htmlFor="adultCount">
            จำนวนผู้ใหญ่
          </label>
          <input
            id="adultCount"
            type="number"
            inputMode="numeric"
            min="0"
            value={adultCount}
            onChange={(e) => setAdultCount(e.target.value)}
            style={inputStyle}
            disabled={loading}
          />

          <label style={labelStyle} htmlFor="childCount">
            จำนวนเด็ก
          </label>
          <input
            id="childCount"
            type="number"
            inputMode="numeric"
            min="0"
            value={childCount}
            onChange={(e) => setChildCount(e.target.value)}
            style={inputStyle}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: '#0a7',
              color: '#fff',
              width: '100%',
            }}
          >
            {loading ? 'กำลังเปิดโต๊ะ...' : 'เปิดโต๊ะ'}
          </button>
        </form>
      )}

      {/* กล่องยืนยันปิดโต๊ะเดิม (modal) */}
      {showConfirm && existingSession && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              border: '3px solid #d33',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '400px',
              width: '100%',
            }}
          >
            <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#c00', marginTop: 0 }}>
              ยืนยันปิดโต๊ะเดิม?
            </p>
            <p style={{ fontSize: '1.1rem' }}>
              โต๊ะ {existingSession.table_number} · ผู้ใหญ่ {existingSession.adult_count} · เด็ก{' '}
              {existingSession.child_count}
            </p>
            <p style={{ fontSize: '1rem', color: '#555' }}>
              เปิดมาแล้ว {elapsedMinutes(existingSession.created_at)} นาที
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={closing}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  backgroundColor: '#eee',
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseOldSession}
                disabled={closing}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  backgroundColor: '#d33',
                  color: '#fff',
                }}
              >
                {closing ? 'กำลังปิด...' : 'ยืนยันปิดโต๊ะเดิม'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
