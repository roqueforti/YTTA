"use client";

import { useState, useEffect } from "react";
import { photos } from "@/data/photos";

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);

  const totalPhotos = photos.length;
  const minLoadedPhotos = Math.ceil(totalPhotos * 0.75); // 75% minimal

  useEffect(() => {
    let mounted = true;
    let loaded = 0;

    const preloadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => resolve(src); // Tetap resolve meski gagal
        img.src = src;
      });
    };

    const loadPhotos = async () => {
      // Buat promise untuk semua foto
      const promises = photos.map((photo) => 
        preloadImage(photo.image).then(() => {
          if (mounted) {
            loaded++;
            setLoadedCount(loaded);
            const currentProgress = Math.floor((loaded / totalPhotos) * 100);
            setProgress(currentProgress);
            
            // Otomatis masuk setelah 75%
            if (loaded >= minLoadedPhotos && onComplete) {
              setTimeout(() => {
                if (mounted) onComplete();
              }, 300);
            }
          }
        })
      );

      // Load semua foto
      await Promise.all(promises);
      
      if (mounted) {
        setProgress(100);
      }
    };

    loadPhotos();

    return () => {
      mounted = false;
    };
  }, [totalPhotos, minLoadedPhotos, onComplete]);

  return (
    <div className="preloader-shell">
      <div className="selector-grain" />
      <header className="preloader-header">
        <span>YTTA</span>
        <small>THE MEMORY ARCHIVE</small>
      </header>
      
      <div className="preloader-content">
        <span className="eyebrow">LOADING MEMORIES</span>
        <h1>Memuat kenangan<br /><em>bersama.</em></h1>
        
        <div className="preloader-progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-meta">
            <span className="progress-percentage">{progress}%</span>
            <span className="progress-count">{loadedCount} / {totalPhotos}</span>
          </div>
        </div>
        
        <p className="preloader-note">
          {progress < 75 
            ? "Mengumpulkan foto-foto kenangan..." 
            : progress < 100 
            ? "Hampir selesai, tetap menunggu..." 
            : "Semua kenangan siap!"}
        </p>
      </div>

      <footer className="preloader-footer">PREPARING YOUR JOURNEY · 2022—2026</footer>

      <style jsx>{`
        .preloader-shell {
          position: fixed;
          inset: 0;
          overflow: auto;
          padding: 28px clamp(22px, 5vw, 74px) 24px;
          background: radial-gradient(circle at 50% 0, #1b1b25, #090a10 50%, #030408);
          isolation: isolate;
          z-index: 10000;
        }

        .selector-grain {
          position: fixed;
          inset: 0;
          z-index: -1;
          opacity: 0.12;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E");
        }

        .preloader-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .preloader-header span {
          font: 500 19px var(--font-serif);
          letter-spacing: 0.18em;
          color: #f3efe7;
        }

        .preloader-header small {
          padding-left: 14px;
          border-left: 1px solid rgba(255, 255, 255, 0.16);
          color: #777;
          font-size: 8px;
          letter-spacing: 0.26em;
        }

        .preloader-content {
          margin: clamp(60px, 12vh, 120px) auto;
          max-width: 640px;
          text-align: center;
        }

        .eyebrow {
          display: block;
          color: #aaa6a0;
          font-size: 9px;
          letter-spacing: 0.42em;
        }

        .preloader-content h1 {
          margin: 16px 0 clamp(40px, 6vh, 60px);
          font: 500 clamp(42px, 6vw, 76px) / 0.97 var(--font-serif);
          letter-spacing: -0.04em;
          color: #f3efe7;
        }

        .preloader-content h1 em {
          color: #aaa4ae;
          font-weight: 500;
        }

        .preloader-progress {
          margin: 0 auto;
          max-width: 480px;
        }

        .progress-track {
          width: 100%;
          height: 2px;
          background: rgba(255, 255, 255, 0.12);
          margin-bottom: 12px;
        }

        .progress-fill {
          height: 100%;
          background: #eae5dc;
          transition: width 0.3s ease;
        }

        .progress-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #cbd5e1;
          font-size: 8px;
          letter-spacing: 0.08em;
        }

        .progress-percentage {
          font-size: 12px;
          color: #eae5dc;
        }

        .progress-count {
          color: #777;
        }

        .preloader-note {
          margin-top: clamp(24px, 4vh, 36px);
          color: #888;
          font-size: 10px;
          letter-spacing: 0.12em;
          min-height: 1.5rem;
        }

        .preloader-footer {
          position: absolute;
          bottom: 24px;
          left: 0;
          right: 0;
          color: #575960;
          text-align: center;
          font-size: 8px;
          letter-spacing: 0.25em;
        }

        @media (max-width: 640px) {
          .preloader-shell {
            padding: 20px 18px 30px;
          }

          .preloader-content {
            margin: 48px auto;
          }

          .preloader-content h1 {
            font-size: 42px;
          }

          .preloader-footer {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
