import { useEffect, useRef } from 'react';
import SignaturePadLib from 'signature_pad';

interface Props {
  onChange: (dataUrl: string) => void;
}

export default function SignaturePad({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext('2d');
      ctx?.scale(ratio, ratio);
      padRef.current?.clear(); 
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const pad = new SignaturePadLib(canvas, { backgroundColor: 'rgb(255,255,255)' });
    padRef.current = pad;

    pad.addEventListener('endStroke', () => {
      onChange(pad.toDataURL('image/png'));
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      pad.off();
    };
    
  }, []);

  const handleClear = () => {
    padRef.current?.clear();
    onChange('');
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 180,
          border: '1px solid #ccc',
          borderRadius: 6,
          touchAction: 'none', 
        }}
      />
      <button
        type="button"
        onClick={handleClear}
        style={{ marginTop: 8, fontSize: 13, cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '4px 10px' }}
      >
        Clear Signature
      </button>
    </div>
  );
}