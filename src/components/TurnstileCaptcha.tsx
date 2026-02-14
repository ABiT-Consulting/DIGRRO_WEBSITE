import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface TurnstileCaptchaProps {
  onTokenChange: (token: string) => void;
  className?: string;
}

const getRandomNumber = () => Math.floor(Math.random() * 8) + 2;

export default function TurnstileCaptcha({ onTokenChange, className = '' }: TurnstileCaptchaProps) {
  const [leftNumber, setLeftNumber] = useState(0);
  const [rightNumber, setRightNumber] = useState(0);
  const [answer, setAnswer] = useState('');

  const resetCaptcha = useCallback(() => {
    setLeftNumber(getRandomNumber());
    setRightNumber(getRandomNumber());
    setAnswer('');
    onTokenChange('');
  }, [onTokenChange]);

  useEffect(() => {
    resetCaptcha();
  }, [resetCaptcha]);

  useEffect(() => {
    const parsedAnswer = Number.parseInt(answer, 10);

    if (!Number.isNaN(parsedAnswer) && parsedAnswer === leftNumber + rightNumber) {
      onTokenChange(`${leftNumber}:${rightNumber}:${parsedAnswer}`);
      return;
    }

    onTokenChange('');
  }, [answer, leftNumber, rightNumber, onTokenChange]);

  return (
    <div className={`rounded-xl border border-gray-700 bg-gray-900/60 p-4 ${className}`} aria-label="Captcha verification">
      <div className="mb-3 flex items-center justify-end">
        <button
          type="button"
          onClick={resetCaptcha}
          className="inline-flex items-center gap-1 rounded-md border border-gray-600 px-2 py-1 text-xs text-gray-300 transition-colors hover:border-blue-400 hover:text-blue-300"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>
      <label className="block text-sm text-gray-200" htmlFor="basic-captcha-answer">
        What is <span className="font-bold text-blue-300">{leftNumber} + {rightNumber}</span>?
      </label>
      <input
        id="basic-captcha-answer"
        type="number"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
        placeholder="Enter the result"
        inputMode="numeric"
      />
    </div>
  );
}
