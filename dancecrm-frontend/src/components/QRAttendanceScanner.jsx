import React, { useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/apiClient';

export default function QRAttendanceScanner({ classId }) {
  const scannerRef = useRef(null);
  const qrRegionId = `qr-scanner-${classId}`;

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(qrRegionId);
    html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: 250
      },
      async (decodedText) => {
        html5QrCode.stop();
        try {
          await api.post(`/attendance/class/${classId}/scan`, { studentId: decodedText });
          alert('Attendance recorded');
        } catch (err) {
          console.error(err);
          alert('Failed to record attendance');
        }
      }
    );

    return () => {
      html5QrCode.stop().catch(console.error);
    };
  }, [classId]);

  return <div id={qrRegionId} ref={scannerRef} style={{ width: '100%' }} />;
}
