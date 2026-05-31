import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlowButton } from '../ui/GlowButton';
import { GlassCard } from '../ui/GlassCard';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (blob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: 'circle' | 'landscape' | 'portrait';
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 'circle'
}) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const isLandscape = aspectRatio === 'landscape';
  const isPortrait = aspectRatio === 'portrait';
  
  // Set crop dimensions dynamically
  const CROP_BOX_WIDTH = isLandscape ? 300 : isPortrait ? 240 : 260; // Landscape/Portrait widths
  const CROP_BOX_HEIGHT = isLandscape ? 169 : isPortrait ? 300 : 260; // Landscape/Portrait heights
  
  const CANVAS_WIDTH = isLandscape ? 800 : isPortrait ? 480 : 400;
  const CANVAS_HEIGHT = isLandscape ? 450 : isPortrait ? 600 : 400;

  // Reset values when source changes
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [imageSrc]);

  // Handle Drag / Pan Events
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = { x: clientX, y: clientY };
    dragStartOffset.current = { ...offset };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStart.current.x;
    const deltaY = clientY - dragStart.current.y;
    setOffset({
      x: dragStartOffset.current.x + deltaX,
      y: dragStartOffset.current.y + deltaY
    });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Mouse Handlers
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const onMouseUp = () => {
    handleEnd();
  };

  // Touch Handlers (for mobile view)
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchEnd = () => {
    handleEnd();
  };

  // Perform cropping drawing on canvas and generate JPEG Blob
  const handleCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Fill with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Center the canvas context
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    // Scale context based on zoom and size ratio between visible crop box and output canvas
    const scaleMultiplier = CANVAS_WIDTH / CROP_BOX_WIDTH;
    ctx.scale(zoom * scaleMultiplier, zoom * scaleMultiplier);

    // Natural sizes of the image rendered in the container
    const displayedWidth = img.width;
    const displayedHeight = img.height;

    // Map UI offsets to target canvas draw position
    const dx = offset.x * scaleMultiplier / (zoom * scaleMultiplier);
    const dy = offset.y * scaleMultiplier / (zoom * scaleMultiplier);

    // Draw the image, centered on the context origin (translated to canvas center)
    ctx.drawImage(
      img,
      dx - displayedWidth / 2,
      dy - displayedHeight / 2,
      displayedWidth,
      displayedHeight
    );

    // Export as JPEG blob with high quality (0.9)
    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md my-auto"
      >
        <GlassCard className="p-6 space-y-6 border border-[var(--violet-bright)]/45 shadow-glow relative overflow-hidden flex flex-col items-center">
          
          {/* Header */}
          <div className="w-full flex items-center justify-between pb-3.5 border-b border-white/5">
            <h3 className="text-base font-display font-extrabold text-white flex items-center gap-2">
              <Move className="w-4 h-4 text-[var(--violet-bright)]" /> Adjust Image
            </h3>
            <button
              onClick={onCancel}
              className="text-[var(--text-muted)] hover:text-white p-1 transition-colors focus:outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-[10px] text-[var(--text-secondary)] text-center leading-relaxed max-w-[280px]">
            Drag to reposition your picture inside the frame, and use the slider below to zoom in or out.
          </p>

          {/* Interactive Crop Container */}
          <div
            ref={containerRef}
            className={`bg-slate-950/60 rounded-3xl overflow-hidden border border-white/10 relative cursor-grab active:cursor-grabbing select-none flex items-center justify-center shadow-inner ${
              isLandscape 
                ? 'w-72 h-44 xs:w-[340px] xs:h-[210px]' 
                : isPortrait
                ? 'w-72 h-[350px] xs:w-[280px] xs:h-[350px]'
                : 'w-72 h-72 xs:w-80 xs:h-80'
            }`}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* The Image itself with Translate & Scale properties */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Source Crop"
              className="max-w-none select-none pointer-events-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />

            {/* Visual Mask Overlay */}
            <div 
              className={`absolute pointer-events-none ${isLandscape || isPortrait ? 'rounded-2xl' : 'rounded-full'}`}
              style={{
                width: `${CROP_BOX_WIDTH}px`,
                height: `${CROP_BOX_HEIGHT}px`,
                boxShadow: `0 0 0 9999px rgba(15, 23, 42, 0.85)`,
              }}
            />

            {/* Dotted Alignment Border */}
            <div 
              className={`absolute pointer-events-none border-2 border-dashed border-[var(--violet-bright)] shadow-[0_0_20px_rgba(139,92,246,0.3)] animate-pulse ${
                isLandscape || isPortrait ? 'rounded-2xl' : 'rounded-full'
              }`}
              style={{
                width: `${CROP_BOX_WIDTH}px`,
                height: `${CROP_BOX_HEIGHT}px`,
              }}
            />
          </div>

          {/* Adjustments Controls */}
          <div className="w-full space-y-3.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              <span>Zoom Level</span>
              <span className="font-mono text-[var(--violet-bright)]">{Math.round(zoom * 100)}%</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all active:scale-90"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-[var(--violet-bright)] focus:outline-none"
              />

              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all active:scale-90"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-3.5 pt-2 border-t border-white/5">
            <GlowButton
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="flex-1 py-3 text-xs"
            >
              Cancel
            </GlowButton>
            <GlowButton
              type="button"
              onClick={handleCrop}
              className="flex-1 py-3 text-xs flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Crop & Apply
            </GlowButton>
          </div>

        </GlassCard>
      </motion.div>
    </div>
  );
};
