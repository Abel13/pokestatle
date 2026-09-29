"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { MoveDiagonal, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_MQ = "(max-width: 639px)";

function touchDistance(
  a: { clientX: number; clientY: number },
  b: { clientX: number; clientY: number },
) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

type SilhouetteSprite = {
  src: string;
  heightDm: number;
  color: string;
  /** 0–1; actual/result silhouettes use low opacity like the reference. */
  opacity?: number;
};

type SilhouetteCanvasProps = {
  reference: SilhouetteSprite;
  guess: SilhouetteSprite;
  reveal?: SilhouetteSprite | null;
  /** Controlled guess height in decimeters */
  guessHeightDm: number;
  onGuessHeightChange?: (heightDm: number) => void;
  heightMin: number;
  heightMax: number;
  interactive?: boolean;
  className?: string;
};

type LayoutHit = {
  cssWidth: number;
  cssHeight: number;
  baselineY: number;
  pxPerDm: number;
  guessCenterX: number;
  guessTop: number;
  guessDrawH: number;
  guessDrawW: number;
};

const imageCache = new Map<string, HTMLImageElement>();
const contentBoundsCache = new Map<
  string,
  { x: number; y: number; w: number; h: number }
>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached?.complete) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

/** Opaque pixel bounds so transparent sprite padding doesn't shift the baseline. */
function getContentBounds(img: HTMLImageElement) {
  const cached = contentBoundsCache.get(img.src);
  if (cached) return cached;

  const probe = document.createElement("canvas");
  probe.width = img.naturalWidth || img.width;
  probe.height = img.naturalHeight || img.height;
  const pctx = probe.getContext("2d", { willReadFrequently: true });
  if (!pctx || probe.width === 0 || probe.height === 0) {
    const fallback = { x: 0, y: 0, w: img.width, h: img.height };
    contentBoundsCache.set(img.src, fallback);
    return fallback;
  }

  pctx.drawImage(img, 0, 0);
  const { data } = pctx.getImageData(0, 0, probe.width, probe.height);
  const alphaThreshold = 16;
  let minX = probe.width;
  let minY = probe.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < probe.height; y++) {
    for (let x = 0; x < probe.width; x++) {
      const a = data[(y * probe.width + x) * 4 + 3]!;
      if (a > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const bounds =
    maxX < 0
      ? { x: 0, y: 0, w: probe.width, h: probe.height }
      : {
          x: minX,
          y: minY,
          w: Math.max(1, maxX - minX + 1),
          h: Math.max(1, maxY - minY + 1),
        };
  contentBoundsCache.set(img.src, bounds);
  return bounds;
}

function contentAspect(img: HTMLImageElement) {
  const bounds = getContentBounds(img);
  return bounds.w / Math.max(1, bounds.h);
}

/** Width in px at a given px/dm scale (heightDm × aspect × scale). */
function silhouetteWidthPx(
  heightDm: number,
  aspect: number,
  pxPerDm: number,
) {
  return Math.max(1, heightDm * pxPerDm * aspect);
}

function drawSilhouette(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  baselineY: number,
  drawHeight: number,
  color: string,
  opacity = 1,
) {
  const bounds = getContentBounds(img);
  const aspect = bounds.w / Math.max(1, bounds.h);
  const drawWidth = Math.max(1, drawHeight * aspect);
  const left = x - drawWidth / 2;
  const top = baselineY - drawHeight;

  const off = document.createElement("canvas");
  off.width = Math.ceil(drawWidth);
  off.height = Math.ceil(drawHeight);
  const octx = off.getContext("2d");
  if (!octx) return { drawWidth, top, left };

  octx.clearRect(0, 0, off.width, off.height);
  // Draw only the opaque content box so feet sit on the ground line.
  octx.drawImage(
    img,
    bounds.x,
    bounds.y,
    bounds.w,
    bounds.h,
    0,
    0,
    off.width,
    off.height,
  );
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = color;
  octx.fillRect(0, 0, off.width, off.height);

  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0, opacity));
  ctx.drawImage(off, left, top, drawWidth, drawHeight);
  ctx.restore();

  return { drawWidth, top, left };
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baselineY: number,
) {
  const step = 28;
  ctx.save();
  ctx.strokeStyle = "rgba(45, 212, 191, 0.12)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(13, 148, 136, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, baselineY + 0.5);
  ctx.lineTo(width - 16, baselineY + 0.5);
  ctx.stroke();
}

export function SilhouetteCanvas({
  reference,
  guess,
  reveal = null,
  guessHeightDm,
  onGuessHeightChange,
  heightMin,
  heightMax,
  interactive = true,
  className,
}: SilhouetteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<LayoutHit | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [handlePos, setHandlePos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const dragRef = useRef<{
    startY: number;
    startHeight: number;
  } | null>(null);
  const pinchRef = useRef<{
    startDist: number;
    startHeight: number;
  } | null>(null);
  const guessHeightRef = useRef(guessHeightDm);
  guessHeightRef.current = guessHeightDm;
  const isMobileRef = useRef(false);

  const paint = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const [refImg, guessImg, revealImg] = await Promise.all([
        loadImage(reference.src),
        loadImage(guess.src),
        reveal ? loadImage(reveal.src) : Promise.resolve(null),
      ]);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssWidth = canvas.clientWidth || 640;
      const cssHeight = canvas.clientHeight || 360;
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      const padX = 14;
      const padTop = 40;
      const padBottom = 40;
      const pairGap = 20;
      const baselineY = cssHeight - padBottom;
      const usableH = Math.max(40, baselineY - padTop);
      const usableW = Math.max(40, cssWidth - padX * 2);

      const refAspect = contentAspect(refImg);
      const guessAspect = contentAspect(guessImg);
      const revealAspect = revealImg ? contentAspect(revealImg) : guessAspect;

      // Width contribution per dm of scale (width = heightDm * aspect * pxPerDm).
      const leftWidthPerScale = reference.heightDm * refAspect;
      const rightWidthPerScale = Math.max(
        guessHeightDm * guessAspect,
        (reveal?.heightDm ?? 0) * revealAspect,
      );

      let basePxPerDm: number;
      if (reveal || !interactive) {
        // Fit height + width so reference, guess, and actual all stay in frame.
        const tallestDm = Math.max(
          reference.heightDm,
          guessHeightDm,
          reveal?.heightDm ?? 0,
        );
        const fromHeight = (usableH * 0.88) / Math.max(1, tallestDm);
        const widthBudget = Math.max(40, usableW - pairGap);
        const fromWidth =
          widthBudget /
          Math.max(1, leftWidthPerScale + rightWidthPerScale);
        basePxPerDm = Math.min(fromHeight, fromWidth);
      } else {
        // Play: scale locked to reference so resizing the target keeps ref stable.
        basePxPerDm =
          (usableH * 0.55) / Math.max(1, reference.heightDm);
      }

      const pxPerDm = basePxPerDm * zoom;

      const refDrawH = Math.max(8, reference.heightDm * pxPerDm);
      const guessDrawH = Math.max(8, guessHeightDm * pxPerDm);
      const revealDrawH = reveal
        ? Math.max(8, reveal.heightDm * pxPerDm)
        : 0;
      const refDrawW = silhouetteWidthPx(
        reference.heightDm,
        refAspect,
        pxPerDm,
      );
      const rightDrawW = Math.max(
        silhouetteWidthPx(guessHeightDm, guessAspect, pxPerDm),
        reveal
          ? silhouetteWidthPx(reveal.heightDm, revealAspect, pxPerDm)
          : 0,
      );

      const pairWidth = refDrawW + pairGap + rightDrawW;
      const pairLeft = Math.max(padX, (cssWidth - pairWidth) / 2);
      const leftX = pairLeft + refDrawW / 2;
      const rightX = pairLeft + refDrawW + pairGap + rightDrawW / 2;

      drawGrid(ctx, cssWidth, cssHeight, baselineY);

      drawSilhouette(
        ctx,
        refImg,
        leftX,
        baselineY,
        refDrawH,
        reference.color,
        reference.opacity ?? 1,
      );

      const guessGeom = drawSilhouette(
        ctx,
        guessImg,
        rightX,
        baselineY,
        guessDrawH,
        guess.color,
        guess.opacity ?? 1,
      );

      // Actual shadow on top of the guess (play lock-in + final result).
      if (reveal && revealImg) {
        drawSilhouette(
          ctx,
          revealImg,
          rightX,
          baselineY,
          revealDrawH,
          reveal.color,
          reveal.opacity ?? 0.45,
        );
      }

      layoutRef.current = {
        cssWidth,
        cssHeight,
        baselineY,
        pxPerDm,
        guessCenterX: rightX,
        guessTop: guessGeom.top,
        guessDrawH,
        guessDrawW: guessGeom.drawWidth,
      };

      if (interactive && !isMobile) {
        setHandlePos({
          x: Math.min(
            cssWidth - 20,
            rightX + guessGeom.drawWidth / 2 + 4,
          ),
          y: Math.max(20, guessGeom.top - 4),
        });
      } else {
        setHandlePos(null);
      }
    } catch {
      // Image load failures leave the board interactive via bounds only
    }
  }, [
    reference,
    guess,
    reveal,
    guessHeightDm,
    zoom,
    interactive,
    isMobile,
  ]);

  // Reset zoom when entering/leaving result reveal so auto-fit starts clean.
  const revealKey = reveal
    ? `${reveal.src}:${reveal.heightDm}`
    : "play";
  useEffect(() => {
    setZoom(1);
  }, [revealKey]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => {
      const matches = mq.matches;
      isMobileRef.current = matches;
      setIsMobile(matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    void paint();
    const onResize = () => void paint();
    window.addEventListener("resize", onResize);
    const node = containerRef.current;
    let ro: ResizeObserver | null = null;
    if (node && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => void paint());
      ro.observe(node);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, [paint]);

  const clampHeight = useCallback(
    // 0.1 dm = 1 cm step (PokéAPI height unit is decimeters).
    (value: number) => {
      const stepped = Math.round(value * 10) / 10;
      return Math.min(heightMax, Math.max(heightMin, stepped));
    },
    [heightMin, heightMax],
  );

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!interactive || !onGuessHeightChange || isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startY: e.clientY,
      startHeight: guessHeightDm,
    };
  };

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current || !onGuessHeightChange) return;
    e.preventDefault();
    const layout = layoutRef.current;
    if (!layout || layout.pxPerDm <= 0) return;
    const dy = dragRef.current.startY - e.clientY;
    const deltaDm = dy / layout.pxPerDm;
    onGuessHeightChange(clampHeight(dragRef.current.startHeight + deltaDm));
  };

  const onHandlePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  const onPinchTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!interactive || !onGuessHeightChange || !isMobileRef.current) return;
    if (e.touches.length < 2) {
      pinchRef.current = null;
      return;
    }
    const a = e.touches.item(0);
    const b = e.touches.item(1);
    if (!a || !b) return;
    const dist = touchDistance(a, b);
    if (dist <= 0) return;
    pinchRef.current = {
      startDist: dist,
      startHeight: guessHeightRef.current,
    };
  };

  const onPinchTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!pinchRef.current || !onGuessHeightChange) return;
    if (e.touches.length < 2) return;
    const a = e.touches.item(0);
    const b = e.touches.item(1);
    if (!a || !b) return;
    const dist = touchDistance(a, b);
    if (pinchRef.current.startDist <= 0) return;
    const ratio = dist / pinchRef.current.startDist;
    onGuessHeightChange(clampHeight(pinchRef.current.startHeight * ratio));
  };

  const onPinchTouchEnd = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      pinchRef.current = null;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full touch-none overflow-hidden overscroll-none rounded-[inherit] bg-muted/30",
        className,
      )}
      onTouchStart={onPinchTouchStart}
      onTouchMove={onPinchTouchMove}
      onTouchEnd={onPinchTouchEnd}
      onTouchCancel={onPinchTouchEnd}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        aria-label="Pokémon size comparison canvas"
      />

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-background"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(3, Number((z + 0.2).toFixed(2))))}
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-background"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.2).toFixed(2))))}
        >
          <ZoomOut className="size-4" />
        </button>
      </div>

      {interactive && !isMobile && handlePos ? (
        <button
          type="button"
          aria-label="Drag to resize Pokémon"
          className="absolute z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 touch-none cursor-ns-resize items-center justify-center rounded-md border border-border bg-background text-teal-700 shadow-md dark:text-teal-300"
          style={{ left: handlePos.x, top: handlePos.y, touchAction: "none" }}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <MoveDiagonal className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
