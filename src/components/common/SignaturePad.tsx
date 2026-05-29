"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  disabled?: boolean;
  onChange: (file: File | null) => void;
}

type Point = {
  x: number;
  y: number;
};

export default function SignaturePad({
  disabled = false,
  onChange,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const hasStrokeRef = useRef(false);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 1);
    const height = Math.max(Math.floor(rect.height), 1);
    const context = canvas.getContext("2d");

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    if (!context) return;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2.5;
    context.strokeStyle = "#111827";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const exportSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!hasStrokeRef.current) {
      onChange(null);
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      onChange(null);
      return;
    }

    const { width, height } = canvas;
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const alpha = pixels[index + 3];

        const isStroke = alpha > 0 && (red < 245 || green < 245 || blue < 245);

        if (!isStroke) continue;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) {
      onChange(null);
      return;
    }

    const padding = Math.max(Math.round(Math.min(width, height) * 0.04), 12);
    const cropX = Math.max(minX - padding, 0);
    const cropY = Math.max(minY - padding, 0);
    const cropWidth = Math.min(maxX - minX + padding * 2, width - cropX);
    const cropHeight = Math.min(maxY - minY + padding * 2, height - cropY);

    const trimmedCanvas = document.createElement("canvas");
    trimmedCanvas.width = cropWidth;
    trimmedCanvas.height = cropHeight;

    const trimmedContext = trimmedCanvas.getContext("2d");
    if (!trimmedContext) {
      onChange(null);
      return;
    }

    trimmedContext.drawImage(
      canvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

    trimmedCanvas.toBlob((blob) => {
      if (!blob) {
        onChange(null);
        return;
      }

      onChange(new File([blob], "firma-director.png", { type: "image/png" }));
    }, "image/png");
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const point = getPoint(event);
    drawingRef.current = true;
    lastPointRef.current = point;
    hasStrokeRef.current = true;

    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const lastPoint = lastPointRef.current;
    if (!canvas || !context || !lastPoint) return;

    const point = getPoint(event);
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPointRef.current = point;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    drawingRef.current = false;
    lastPointRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    exportSignature();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(1, 0, 0, 1, 0, 0);
    resizeCanvas();
    drawingRef.current = false;
    lastPointRef.current = null;
    hasStrokeRef.current = false;
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        className="h-44 w-full touch-none rounded-md border border-gray-300 bg-white"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Dibuja la firma directamente con mouse, touch o stylus.
        </p>
        <Button type="button" variant="outline" onClick={handleClear}>
          Limpiar
        </Button>
      </div>
    </div>
  );
}
