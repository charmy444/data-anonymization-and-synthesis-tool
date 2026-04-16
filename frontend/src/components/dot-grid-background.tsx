"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

const GRID_STEP = 16;
const DOT_RADIUS = 1;
const POINTER_RADIUS = 725;
const POINTER_PULL = 28;
const LERP_FACTOR = 0.035;
const NOISE_AMPLITUDE = 6;
const NOISE_SCALE = 0.04;
const TIME_SCALE = 0.0008;
const BASE_COLOR: readonly [number, number, number] = [68, 68, 68];
const POINTER_COLOR_A: readonly [number, number, number] = [96, 86, 240];
const POINTER_COLOR_B: readonly [number, number, number] = [64, 217, 198];

type GridPoint = {
  gx: number;
  gy: number;
  x: number;
  y: number;
};

const permutation = new Uint8Array(512);

{
  const source = new Uint8Array(256);

  for (let index = 0; index < 256; index += 1) {
    source[index] = index;
  }

  for (let index = 255; index > 0; index -= 1) {
    const swapIndex = (((index * 2654435761) >>> 0) % (index + 1)) as number;
    const current = source[index];
    source[index] = source[swapIndex];
    source[swapIndex] = current;
  }

  for (let index = 0; index < 512; index += 1) {
    permutation[index] = source[index & 255];
  }
}

const gradients: readonly (readonly [number, number])[] = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function smoothstep(value: number) {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function lerp(from: number, to: number, amount: number) {
  return from + amount * (to - from);
}

function gradient(hash: number, x: number, y: number) {
  const [gx, gy] = gradients[hash & 7] ?? [1, 1];
  return gx * x + gy * y;
}

function perlinNoise(x: number, y: number) {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = smoothstep(xf);
  const v = smoothstep(yf);
  const aa = permutation[permutation[xi] + yi];
  const ab = permutation[permutation[xi] + yi + 1];
  const ba = permutation[permutation[xi + 1] + yi];
  const bb = permutation[permutation[xi + 1] + yi + 1];

  return lerp(
    lerp(gradient(aa, xf, yf), gradient(ba, xf - 1, yf), u),
    lerp(gradient(ab, xf, yf - 1), gradient(bb, xf - 1, yf - 1), u),
    v,
  );
}

export const DotGridBackground = memo(function DotGridBackground({
  className,
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<GridPoint[]>([]);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const [visible, setVisible] = useState(false);

  const rebuildPoints = useCallback((width: number, height: number) => {
    const nextPoints: GridPoint[] = [];
    const columns = Math.ceil(width / GRID_STEP) + 1;
    const rows = Math.ceil(height / GRID_STEP) + 1;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const gx = column * GRID_STEP;
        const gy = row * GRID_STEP;
        nextPoints.push({ gx, gy, x: gx, y: gy });
      }
    }

    pointsRef.current = nextPoints;
    sizeRef.current = { width, height };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const { width, height } = sizeRef.current;
    context.clearRect(0, 0, width, height);

    const pointer = pointerRef.current;
    const points = pointsRef.current;
    const nextPoints: GridPoint[] = [];
    const pointerRadiusSquared = POINTER_RADIUS * POINTER_RADIUS;
    const time = performance.now() * TIME_SCALE;

    for (const point of points) {
      let targetX = point.gx;
      let targetY = point.gy;
      let influence = 0;

      if (pointer) {
        const deltaX = point.gx - pointer.x;
        const deltaY = point.gy - pointer.y;
        const distanceSquared = deltaX * deltaX + deltaY * deltaY;

        if (distanceSquared < pointerRadiusSquared && distanceSquared > 0) {
          const distance = Math.sqrt(distanceSquared);
          influence = 1 - distance / POINTER_RADIUS;
          const pull = influence * influence * influence * POINTER_PULL;
          targetX = point.gx + (deltaX / distance) * pull;
          targetY = point.gy + (deltaY / distance) * pull;

          const noiseX = perlinNoise(point.gx * NOISE_SCALE, point.gy * NOISE_SCALE + time);
          const noiseY = perlinNoise(
            point.gx * NOISE_SCALE + 100,
            point.gy * NOISE_SCALE + time,
          );
          const noiseStrength = influence * influence * NOISE_AMPLITUDE;

          targetX += noiseX * noiseStrength;
          targetY += noiseY * noiseStrength;
        }
      }

      const nextX = point.x + (targetX - point.x) * LERP_FACTOR;
      const nextY = point.y + (targetY - point.y) * LERP_FACTOR;

      let [red, green, blue] = BASE_COLOR;
      let alpha = 1;
      const fadeStart = height * 0.75;

      if (point.gy > fadeStart) {
        alpha *= 1 - (point.gy - fadeStart) / (height - fadeStart);
      }

      if (pointer && influence > 0) {
        alpha *= 1 - influence * influence * 0.85;
        const angle = Math.atan2(point.gy - pointer.y, point.gx - pointer.x);
        const mix = (Math.sin(angle * 2 + time * 3) + 1) * 0.5;
        const mixedRed = lerp(POINTER_COLOR_A[0], POINTER_COLOR_B[0], mix);
        const mixedGreen = lerp(POINTER_COLOR_A[1], POINTER_COLOR_B[1], mix);
        const mixedBlue = lerp(POINTER_COLOR_A[2], POINTER_COLOR_B[2], mix);
        const colorInfluence = influence * influence;

        red = Math.round(lerp(BASE_COLOR[0], mixedRed, colorInfluence));
        green = Math.round(lerp(BASE_COLOR[1], mixedGreen, colorInfluence));
        blue = Math.round(lerp(BASE_COLOR[2], mixedBlue, colorInfluence));
      }

      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
      context.beginPath();
      context.arc(nextX, nextY, DOT_RADIUS, 0, Math.PI * 2);
      context.fill();
      nextPoints.push({
        gx: point.gx,
        gy: point.gy,
        x: nextX,
        y: nextY,
      });
    }

    pointsRef.current = nextPoints;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const parent = canvas.parentElement;

    if (!parent) {
      return;
    }

    const resize = () => {
      const bounds = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(bounds.width);
      const height = Math.round(bounds.height);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const context = canvas.getContext("2d");

      if (context) {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(dpr, dpr);
      }

      rebuildPoints(width, height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();

    return () => {
      observer.disconnect();
    };
  }, [rebuildPoints]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const parent = canvas.parentElement;

    if (!parent) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = parent.getBoundingClientRect();

      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        pointerRef.current = null;
        return;
      }

      pointerRef.current = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
    };

    const clearPointer = () => {
      pointerRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", clearPointer);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", clearPointer);
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      draw();
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [draw]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(id);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        transition: "opacity 1.2s ease-in",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="dot-grid-canvas"
        style={{ position: "absolute", inset: 0 }}
      />
    </div>
  );
});
