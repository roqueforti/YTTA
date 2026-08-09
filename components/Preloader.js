"use client";

import { useState, useEffect, useRef } from "react";
import { photos } from "@/data/photos";

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loadedPhotos, setLoadedPhotos] = useState([]);
  const containerRef = useRef(null);

  const totalPhotos = photos.length;
  const minLoadedPhotos = Math.ceil(totalPhotos * 0.75); // 75% minimal

  useEffect(() => {
    let mounted = true;
    let loaded = 0;
    const loadedImages = [];

    const preloadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ src, img });
        img.onerror = () => resolve({ src, img: null });
        img.src = src;
      });
    };

    const loadPhotos = async () => {
      // Load foto satu per satu untuk efek bertahap
      for (const photo of photos) {
        if (!mounted) break;
        
        const result = await preloadImage(photo.image);
        
        if (mounted) {
          loaded++;
          loadedImages.push({ ...photo, loaded: true });
          setLoadedPhotos([...loadedImages]);
          setLoadedCount(loaded);
          const currentProgress = Math.floor((loaded / totalPhotos) * 100);
          setProgress(currentProgress);
          
          // Otomatis masuk setelah 75%
          if (loaded >= minLoadedPhotos && onComplete) {
            setTimeout(() => {
              if (mounted) onComplete();
            }, 800);
            break; // Stop loading setelah 75%
          }
        }
      }
    };

    loadPhotos();

    return () => {
      mounted = false;
    };
  }, [totalPhotos, minLoadedPhotos, onComplete]);

  // Parallax mouse effect - lebih smooth
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 30;
      const y = (clientY / innerHeight - 0.5) * 30;
      
      const photos = containerRef.current.querySelectorAll('.floating-photo');
      photos.forEach((photo, index) => {
        const depth = ((index % 4) + 1) * 0.5;
        const baseRotation = parseFloat(photo.dataset.rotation) || 0;
        photo.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0) rotate(${baseRotation + (x * 0.05)}deg)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="preloader-shell" ref={containerRef}>
      <div className="selector-grain" />
      
      {/* Floating photos background */}
      <div className="photo-galaxy">
        {loadedPhotos.slice(-18).map((photo, index) => {
          const angle = (index / 18) * 360 + (index * 7);
          const radius = 32 + (index % 4) * 10;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          const rotation = (index * 19) % 50 - 25;
          const delay = index * 0.08;
          
          return (
            <div
              key={photo.image}
              className="floating-photo"
              data-rotation={rotation}
              style={{
                left: `calc(50% + ${x}vw)`,
                top: `calc(50% + ${y}vh)`,
                animationDelay: `${delay}s`,
                '--rotation': `${rotation}deg`,
              }}
            >
              <img src={photo.image} alt="" loading="eager" />
            </div>
          );
        })}
      </div>

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
            : "Masuk ke arsip kenangan..."}
        </p>
      </div>

      <footer className="preloader-footer">PREPARING YOUR JOURNEY · 2022—2026</footer>

      <style jsx>{`
        .preloader-shell {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 28px clamp(22px, 5vw, 74px) 24px;
          background: radial-gradient(circle at 50% 50%, #1b1b25, #090a10 60%, #030408);
          isolation: isolate;
          z-index: 10000;
          overflow: hidden;
        }

        .selector-grain {
          position: fixed;
          inset: 0;
          z-index: 1;
          opacity: 0.12;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E");
        }

        .photo-galaxy {
          position: fixed;
          inset: 0;
          z-index: 2;
          pointer-events: none;
        }

        .floating-photo {
          position: absolute;
          width: clamp(80px, 8vw, 140px);
          aspect-ratio: 4/3;
          opacity: 0;
          transition: transform 0.6s cubic-bezier(0.16, 0.8, 0.3, 1);
          animation: photoFloatIn 2s cubic-bezier(0.16, 0.8, 0.3, 1) forwards;
          will-change: transform, opacity;
        }

        @keyframes photoFloatIn {
          0% {
            opacity: 0;
            transform: translate3d(0, 30vh, -200px) scale(0.4) rotate(0deg);
          }
          60% {
            opacity: 0.08;
          }
          100% {
            opacity: 0.12;
            transform: translate3d(0, 0, 0) scale(1) rotate(var(--rotation, 0deg));
          }
        }

        .floating-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
          filter: saturate(0.65) brightness(0.85) blur(0.3px);
          animation: photoFloat 8s ease-in-out infinite;
          animation-delay: inherit;
        }

        @keyframes photoFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(2deg);
          }
        }

        .preloader-header {
          position: absolute;
          top: 28px;
          left: clamp(22px, 5vw, 74px);
          display: flex;
          align-items: center;
          gap: 14px;
          z-index: 10;
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
          position: relative;
          z-index: 10;
          max-width: 680px;
          width: 90%;
          text-align: center;
        }

        .eyebrow {
          display: block;
          color: #aaa6a0;
          font-size: 9px;
          letter-spacing: 0.42em;
        }

        .preloader-content h1 {
          margin: 16px 0 clamp(48px, 8vh, 72px);
          font: 500 clamp(48px, 7vw, 82px) / 0.97 var(--font-serif);
          letter-spacing: -0.04em;
          color: #f3efe7;
        }

        .preloader-content h1 em {
          color: #aaa4ae;
          font-weight: 500;
        }

        .preloader-progress {
          margin: 0 auto;
          max-width: 520px;
        }

        .progress-track {
          width: 100%;
          height: 2px;
          background: rgba(255, 255, 255, 0.12);
          margin-bottom: 14px;
        }

        .progress-fill {
          height: 100%;
          background: #eae5dc;
          transition: width 0.3s ease;
          box-shadow: 0 0 12px rgba(234, 229, 220, 0.4);
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
          font-size: 13px;
          font-weight: 500;
          color: #eae5dc;
        }

        .progress-count {
          color: #777;
        }

        .preloader-note {
          margin-top: clamp(28px, 5vh, 42px);
          color: #888;
          font-size: 10px;
          letter-spacing: 0.16em;
          min-height: 1.5rem;
        }

        .preloader-footer {
          position: absolute;
          bottom: 24px;
          left: 0;
          right: 0;
          z-index: 10;
          color: #575960;
          text-align: center;
          font-size: 8px;
          letter-spacing: 0.25em;
        }

        @media (max-width: 640px) {
          .preloader-shell {
            padding: 20px 18px 30px;
          }

          .preloader-header {
            top: 20px;
            left: 18px;
          }

          .preloader-content h1 {
            font-size: 46px;
            margin-bottom: 52px;
          }

          .floating-photo {
            width: clamp(60px, 15vw, 100px);
          }

          .preloader-footer {
            font-size: 7px;
            bottom: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-photo,
          .floating-photo img {
            animation: none !important;
          }
          
          .floating-photo {
            opacity: 0.12 !important;
          }
        }
      `}</style>
    </div>
  );
}
