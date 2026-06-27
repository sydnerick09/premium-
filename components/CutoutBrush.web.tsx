import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface CutoutBrushHandle {
  exportPng: () => string;
  reset: () => void;
}

interface Props {
  uri: string;
  brushSize: number; // brush diameter in displayed px
  mode: 'erase' | 'restore';
}

const MAXD = 1600;

interface St {
  imgC: HTMLCanvasElement;
  maskC: HTMLCanvasElement;
  tmpC: HTMLCanvasElement;
  imgW: number; imgH: number;
  dispW: number; dispH: number;
  drawing: boolean; lastX: number; lastY: number;
}

/**
 * Interactive manual cut-out. The user paints on the photo: "erase" removes
 * pixels (makes them transparent), "restore" brings them back. A full-resolution
 * alpha mask is kept off-screen so the exported PNG keeps real transparency.
 */
const CutoutBrushWeb = forwardRef<CutoutBrushHandle, Props>(({ uri, brushSize, mode }, ref) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const st = useRef<St | null>(null);
  const brushRef = useRef(brushSize);
  const modeRef = useRef(mode);
  useEffect(() => { brushRef.current = brushSize; }, [brushSize]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const redraw = () => {
    const s = st.current;
    const v = canvasRef.current;
    if (!s || !v) return;
    const vctx = v.getContext('2d')!;
    const { dispW, dispH, imgW, imgH } = s;
    vctx.clearRect(0, 0, dispW, dispH);
    // Checkerboard so transparency is visible.
    const t = 12;
    for (let y = 0; y < dispH; y += t) {
      for (let x = 0; x < dispW; x += t) {
        vctx.fillStyle = (((x / t) | 0) + ((y / t) | 0)) % 2 === 0 ? '#cfcfcf' : '#f4f4f4';
        vctx.fillRect(x, y, t, t);
      }
    }
    // image masked by alpha
    const tctx = s.tmpC.getContext('2d')!;
    tctx.globalCompositeOperation = 'source-over';
    tctx.clearRect(0, 0, imgW, imgH);
    tctx.drawImage(s.imgC, 0, 0);
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(s.maskC, 0, 0);
    tctx.globalCompositeOperation = 'source-over';
    vctx.drawImage(s.tmpC, 0, 0, imgW, imgH, 0, 0, dispW, dispH);
  };

  const paintAt = (cssX: number, cssY: number) => {
    const s = st.current;
    if (!s) return;
    const ix = (cssX / s.dispW) * s.imgW;
    const iy = (cssY / s.dispH) * s.imgH;
    const r = Math.max(1, (brushRef.current / 2) * (s.imgW / s.dispW));
    const mctx = s.maskC.getContext('2d')!;
    mctx.lineCap = 'round';
    mctx.lineJoin = 'round';
    if (modeRef.current === 'erase') {
      mctx.globalCompositeOperation = 'destination-out';
      mctx.strokeStyle = 'rgba(0,0,0,1)';
      mctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      mctx.globalCompositeOperation = 'source-over';
      mctx.strokeStyle = '#ffffff';
      mctx.fillStyle = '#ffffff';
    }
    // connect from the previous point for a smooth stroke
    if (s.drawing && s.lastX >= 0) {
      mctx.lineWidth = r * 2;
      mctx.beginPath();
      mctx.moveTo(s.lastX, s.lastY);
      mctx.lineTo(ix, iy);
      mctx.stroke();
    }
    mctx.beginPath();
    mctx.arc(ix, iy, r, 0, Math.PI * 2);
    mctx.fill();
    mctx.globalCompositeOperation = 'source-over';
    s.lastX = ix;
    s.lastY = iy;
    redraw();
  };

  // Build canvases when the source image changes.
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    if (!uri.startsWith('blob:') && !uri.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const scale = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight));
      const imgW = Math.max(1, Math.round(img.naturalWidth * scale));
      const imgH = Math.max(1, Math.round(img.naturalHeight * scale));
      const mk = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
      const imgC = mk(imgW, imgH);
      imgC.getContext('2d')!.drawImage(img, 0, 0, imgW, imgH);
      const maskC = mk(imgW, imgH);
      const mc = maskC.getContext('2d')!;
      mc.fillStyle = '#ffffff';
      mc.fillRect(0, 0, imgW, imgH); // start fully opaque (keep all)
      const tmpC = mk(imgW, imgH);

      const wrap = wrapRef.current;
      const availW = (wrap?.clientWidth || 360) - 8;
      const availH = (wrap?.clientHeight || 480) - 8;
      const dscale = Math.min(availW / imgW, availH / imgH);
      const dispW = Math.max(1, Math.round(imgW * dscale));
      const dispH = Math.max(1, Math.round(imgH * dscale));
      const v = canvasRef.current!;
      v.width = dispW;
      v.height = dispH;
      st.current = { imgC, maskC, tmpC, imgW, imgH, dispW, dispH, drawing: false, lastX: -1, lastY: -1 };
      redraw();
    };
    img.src = uri;
    return () => { cancelled = true; };
  }, [uri]);

  // Pointer painting (mouse + touch unified).
  useEffect(() => {
    const v = canvasRef.current;
    if (!v) return;
    const pos = (e: PointerEvent) => {
      const r = v.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      const s = st.current;
      if (!s) return;
      s.drawing = true;
      s.lastX = -1;
      const p = pos(e);
      paintAt(p.x, p.y);
      try { v.setPointerCapture(e.pointerId); } catch {}
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      const s = st.current;
      if (!s || !s.drawing) return;
      const p = pos(e);
      paintAt(p.x, p.y);
      e.preventDefault();
    };
    const up = () => {
      const s = st.current;
      if (s) { s.drawing = false; s.lastX = -1; }
    };
    v.addEventListener('pointerdown', down);
    v.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      v.removeEventListener('pointerdown', down);
      v.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    exportPng: () => {
      const s = st.current;
      if (!s) return uri;
      const out = document.createElement('canvas');
      out.width = s.imgW;
      out.height = s.imgH;
      const o = out.getContext('2d')!;
      o.drawImage(s.imgC, 0, 0);
      o.globalCompositeOperation = 'destination-in';
      o.drawImage(s.maskC, 0, 0);
      o.globalCompositeOperation = 'source-over';
      return out.toDataURL('image/png');
    },
    reset: () => {
      const s = st.current;
      if (!s) return;
      const mc = s.maskC.getContext('2d')!;
      mc.globalCompositeOperation = 'source-over';
      mc.fillStyle = '#ffffff';
      mc.fillRect(0, 0, s.imgW, s.imgH);
      redraw();
    },
  }));

  return React.createElement(
    'div',
    {
      ref: wrapRef,
      style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    },
    React.createElement('canvas', {
      ref: canvasRef,
      style: { touchAction: 'none', maxWidth: '100%', maxHeight: '100%', borderRadius: 8, cursor: 'crosshair' },
    }),
  );
});

CutoutBrushWeb.displayName = 'CutoutBrush';
export default CutoutBrushWeb;
