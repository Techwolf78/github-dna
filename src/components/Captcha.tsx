import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface CaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
}

export function SimpleCaptcha({ onVerify, onError }: CaptchaProps) {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate random CAPTCHA text
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    setIsVerified(false);
    drawCaptcha(result);
  };

  // Draw CAPTCHA on canvas
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }

    // Draw text with distortion
    ctx.font = '24px monospace';
    ctx.fillStyle = '#1e293b';

    for (let i = 0; i < text.length; i++) {
      const x = 20 + i * 25;
      const y = 30 + Math.sin(i) * 5; // Slight wave distortion
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.3); // Slight rotation
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    // Add lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
  };

  // Verify CAPTCHA
  const verifyCaptcha = () => {
    if (userInput.toLowerCase() === captchaText.toLowerCase()) {
      setIsVerified(true);
      onVerify(captchaText);
    } else {
      onError?.('CAPTCHA verification failed. Please try again.');
      generateCaptcha(); // Generate new CAPTCHA
    }
  };

  // Initialize CAPTCHA on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        CAPTCHA Verified
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <canvas
          ref={canvasRef}
          width="160"
          height="50"
          className="border border-gray-300 rounded bg-white"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generateCaptcha}
          className="text-xs w-full sm:w-auto"
        >
          ↻ Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter CAPTCHA text"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          maxLength={6}
        />
        <Button
          type="button"
          onClick={verifyCaptcha}
          size="sm"
          className="w-full sm:w-auto px-4"
        >
          Verify
        </Button>
      </div>

      <p className="text-xs text-gray-500">
        Type the characters you see in the image above
      </p>
    </div>
  );
}