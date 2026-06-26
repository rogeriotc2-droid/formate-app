import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2 } from "lucide-react";

interface SignaturePadProps {
  value?: string | null;
  onChange: (base64: string | null) => void;
}

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [hasStrokes, setHasStrokes] = useState(false);

  // Load stored signature on mount
  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
          setHasStrokes(true);
        }
      };
      img.src = value;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getPos(e: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0] ?? e.changedTouches[0];
      if (!touch) return null;
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    drawing.current = true;
    const pos = getPos(e);
    if (!pos) return;
    lastPos.current = pos;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = "#1F2937";
      ctx.fill();
    }
    setHasStrokes(true);
  }

  function moveDraw(e: React.TouchEvent | React.MouseEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const pos = getPos(e);
    if (!pos || !lastPos.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#1F2937";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    lastPos.current = pos;
  }

  function endDraw(e: React.TouchEvent | React.MouseEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    drawing.current = false;
    lastPos.current = null;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sign with your finger
        </span>
        {hasStrokes && (
          <Button variant="ghost" size="sm" onClick={clear} className="h-6 px-2 text-xs text-muted-foreground gap-1">
            <Trash2 className="w-3 h-3" /> Clear
          </Button>
        )}
      </div>

      <div
        className={`relative border-2 rounded-md overflow-hidden ${
          hasStrokes ? "border-primary/40 bg-white" : "border-dashed border-border bg-muted/10"
        }`}
        style={{ touchAction: "none", cursor: "crosshair" }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full block"
          style={{ touchAction: "none" }}
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
        />
        {!hasStrokes && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground/50 font-medium select-none">Sign here</p>
          </div>
        )}
      </div>

      {hasStrokes && (
        <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Signature captured — tap Save Changes to store it
        </div>
      )}
    </div>
  );
}
