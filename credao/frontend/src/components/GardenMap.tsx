import { useEffect, useRef } from 'react';
import type { Garden } from '../backend';

interface GardenMapProps {
  garden: Garden;
}

export default function GardenMap({ garden }: GardenMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate bounds
    const lats = garden.boundary.map((coord) => coord.lat);
    const lngs = garden.boundary.map((coord) => coord.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;

    // Add padding
    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    // Convert coordinates to canvas positions
    const toCanvasX = (lng: number) => padding + ((lng - minLng) / lngRange) * width;
    const toCanvasY = (lat: number) => padding + ((maxLat - lat) / latRange) * height;

    // Draw background
    ctx.fillStyle = 'oklch(0.95 0.02 145)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'oklch(0.9 0.02 145)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * width;
      const y = padding + (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + width, y);
      ctx.stroke();
    }

    // Draw polygon
    if (garden.boundary.length > 0) {
      ctx.beginPath();
      const firstPoint = garden.boundary[0];
      ctx.moveTo(toCanvasX(firstPoint.lng), toCanvasY(firstPoint.lat));

      for (let i = 1; i < garden.boundary.length; i++) {
        const point = garden.boundary[i];
        ctx.lineTo(toCanvasX(point.lng), toCanvasY(point.lat));
      }

      ctx.closePath();

      // Fill
      ctx.fillStyle = 'oklch(0.7 0.12 145 / 0.3)';
      ctx.fill();

      // Stroke
      ctx.strokeStyle = 'oklch(0.6 0.15 145)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw points
      garden.boundary.forEach((point) => {
        ctx.beginPath();
        ctx.arc(toCanvasX(point.lng), toCanvasY(point.lat), 5, 0, Math.PI * 2);
        ctx.fillStyle = 'oklch(0.55 0.18 145)';
        ctx.fill();
      });
    }

    // Draw labels
    ctx.fillStyle = 'oklch(0.5 0.02 145)';
    ctx.font = '12px sans-serif';
    ctx.fillText(garden.name, padding, padding - 10);
    ctx.fillText(`${garden.boundary.length} boundary points`, padding, canvas.height - padding + 20);
  }, [garden]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="h-[400px] w-full rounded-lg border bg-muted"
      />
      <div className="mt-2 text-xs text-muted-foreground">
        Garden boundary visualization • {garden.boundary.length} points
      </div>
    </div>
  );
}
