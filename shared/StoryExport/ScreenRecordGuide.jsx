"use client";
export default function ScreenRecordGuide({ onStart, onCancel }) {
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = typeof navigator !== "undefined" && /Android/.test(navigator.userAgent);
  return <div className="record-guide"><small>RECORDING READY · 9:16</small><h3>Siapkan perekam layar</h3><p>{isIOS ? "Buka Control Center, aktifkan Screen Recording, lalu kembali ke halaman ini." : isAndroid ? "Buka Quick Settings dan aktifkan Screen Recorder, lalu kembali ke halaman ini." : "Gunakan screen recorder perangkat atau browser, lalu rekam area preview vertikal."}</p><div><button onClick={onCancel}>Kembali</button><button className="primary" onClick={onStart}>Mulai Countdown</button></div></div>;
}
