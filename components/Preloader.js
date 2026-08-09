"use client";

import { useState, useEffect } from "react";
import { photos } from "@/data/photos";

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [status, setStatus] = useState("Memulai...");
  const [canEnter, setCanEnter] = useState(false);

  const totalPhotos = photos.length;
  const minLoadedPhotos = Math.ceil(totalPhotos * 0.75); // 75% minimal

  useEffect(() => {
    let mounted = true;
    let loaded = 0;

    const preloadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => resolve(src); // Tetap resolve meski gagal
        img.src = src;
      });
    };

    const loadPhotos = async () => {
      setStatus("Mengunduh kenangan...");
      
      // Buat promise untuk semua foto
      const promises = photos.map((photo, index) => 
        preloadImage(photo.image).then(() => {
          if (mounted) {
            loaded++;
            setLoadedCount(loaded);
            const currentProgress = Math.floor((loaded / totalPhotos) * 100);
            setProgress(currentProgress);
            
            if (loaded >= minLoadedPhotos && !canEnter) {
              setStatus("Siap masuk!");
              setCanEnter(true);
            }
          }
        })
      );

      // Load semua foto
      await Promise.all(promises);
      
      if (mounted) {
        setProgress(100);
        setStatus("Sempurna! Semua kenangan siap ditampilkan.");
        setCanEnter(true);
      }
    };

    loadPhotos();

    return () => {
      mounted = false;
    };
  }, [totalPhotos, minLoadedPhotos, canEnter]);

  const handleEnter = () => {
    if (canEnter && onComplete) {
      onComplete();
    }
  };

  return (
    <div className="preloader-container">
      <div className="preloader-content">
        <h1 className="preloader-title">Your Time Travel Archive</h1>
        <p className="preloader-subtitle">Mengumpulkan kenangan bersama...</p>
        
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="progress-info">
            <span className="progress-percentage">{progress}%</span>
            <span className="progress-count">
              {loadedCount} / {totalPhotos} foto
            </span>
          </div>
        </div>

        <p className="status-text">{status}</p>

        {canEnter && (
          <button 
            className="enter-button"
            onClick={handleEnter}
          >
            Masuk ke Arsip Kenangan
          </button>
        )}

        {!canEnter && progress > 0 && (
          <p className="waiting-text">
            Minimal {minLoadedPhotos} foto ({Math.floor((minLoadedPhotos / totalPhotos) * 100)}%) harus dimuat sebelum masuk...
          </p>
        )}
      </div>

      <style jsx>{`
        .preloader-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          color: white;
        }

        .preloader-content {
          max-width: 600px;
          width: 90%;
          text-align: center;
          padding: 2rem;
        }

        .preloader-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(90deg, #ffffff, #e0e0e0, #ffffff);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 0%;
          }
        }

        .preloader-subtitle {
          font-size: 1.1rem;
          color: #a8b2d1;
          margin-bottom: 3rem;
          font-weight: 300;
        }

        .progress-section {
          margin-bottom: 2rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 1rem;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4a90e2, #64b5f6, #4fc3f7);
          border-radius: 10px;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
          position: relative;
          overflow: hidden;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: slide 2s ease-in-out infinite;
        }

        @keyframes slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
          color: #cbd5e1;
        }

        .progress-percentage {
          font-size: 1.5rem;
          font-weight: 700;
          color: #4fc3f7;
        }

        .progress-count {
          font-size: 0.9rem;
          color: #94a3b8;
        }

        .status-text {
          font-size: 1rem;
          color: #e2e8f0;
          margin-bottom: 1.5rem;
          min-height: 1.5rem;
          font-style: italic;
        }

        .enter-button {
          background: linear-gradient(135deg, #4a90e2, #357abd);
          color: white;
          border: none;
          padding: 1rem 2.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(74, 144, 226, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          animation: fadeIn 0.5s ease, pulse 2s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .enter-button:hover {
          background: linear-gradient(135deg, #357abd, #2868a8);
          box-shadow: 0 6px 20px rgba(74, 144, 226, 0.6);
          transform: translateY(-2px);
        }

        .enter-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 10px rgba(74, 144, 226, 0.4);
        }

        .waiting-text {
          font-size: 0.85rem;
          color: #94a3b8;
          margin-top: 1rem;
          font-style: italic;
        }

        @media (max-width: 640px) {
          .preloader-content {
            padding: 1rem;
          }

          .preloader-title {
            font-size: 2rem;
          }

          .preloader-subtitle {
            font-size: 0.95rem;
            margin-bottom: 2rem;
          }

          .enter-button {
            padding: 0.875rem 2rem;
            font-size: 0.95rem;
          }
        }
      `}</style>
    </div>
  );
}
