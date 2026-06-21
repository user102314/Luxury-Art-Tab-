import { useEffect, useRef, useState } from "react";

type ArViewerProps = {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
};

export function ArViewer({ isOpen, onClose, imageSrc }: ArViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen) {
      // Reset state
      setError(null);
      setPosition({ x: 0, y: 0 });
      setScale(1);

      // Request camera access (prefer rear camera)
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: "environment" },
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((e) => {
              console.error("Error playing video:", e);
              setError("Impossible de lire la vidéo. " + e.message);
            });
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
          setError(
            "Accès à la caméra refusé ou impossible. Veuillez vérifier vos permissions."
          );
        });
    }

    return () => {
      // Cleanup stream when closed
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen || !imageSrc) return null;

  // Touch and mouse event handlers for moving the image
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = { x: clientX - position.x, y: clientY - position.y };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPosition({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y,
    });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Error Message */}
      {error && (
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-2xl bg-black/80 p-6 text-center text-white backdrop-blur-md">
          <p className="mb-4 text-sm">{error}</p>
          <button
            onClick={onClose}
            className="rounded-full bg-brand-red px-6 py-2 text-sm font-bold text-white transition-transform active:scale-95"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Overlay controls */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <div className="rounded-xl bg-black/50 p-3 text-xs font-medium text-white backdrop-blur-md">
            Déplacez l'image pour l'ajuster
          </div>
          <button
            onClick={onClose}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-transform active:scale-90"
            aria-label="Close AR view"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Zoom controls */}
        <div className="pointer-events-auto flex justify-center gap-4 pb-8">
          <button
            onClick={() => setScale((s) => Math.max(0.3, s - 0.1))}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-transform active:scale-90"
            aria-label="Zoom out"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
            </svg>
          </button>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.1))}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-transform active:scale-90"
            aria-label="Zoom in"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Draggable Image */}
      {!error && (
        <div
          className="absolute z-20 cursor-move shadow-2xl touch-none"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          {/* Border simulating a frame */}
          <div className="border-8 border-gray-900 bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <img
              src={imageSrc}
              alt="AR Preview"
              className="max-h-[50vh] max-w-[80vw] object-contain shadow-inner pointer-events-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
