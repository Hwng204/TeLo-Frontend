import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { displayToast } from '../../../utils/toast';
import { api } from '../../../services/api';


interface ForgotPasswordOtpFormProps {
  email: string;
  onSuccess: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
}

export const ForgotPasswordOtpForm: React.FC<ForgotPasswordOtpFormProps> = ({ email, onSuccess, onResend, onBack }) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));

  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(59);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Allow pasting
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split('');
      for (let i = 0; i < pastedData.length; i++) {
        if (index + i < 6) {
          newOtp[index + i] = pastedData[i];
        }
      }
      setOtp(newOtp);
      // Focus next empty input or last
      const nextEmptyIndex = newOtp.findIndex(val => val === '');
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join('');
    if (otpString.length < 6) {
      displayToast('error', 'Lỗi', 'Vui lòng nhập đủ 6 số OTP.');
      return;
    }

    try {
      setIsLoading(true);
      await api.auth.verifyOtp({ email, otp: otpString });
      onSuccess(otpString);
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Mã OTP không hợp lệ. Vui lòng thử lại.';
      displayToast('error', 'Lỗi', errMsg);
      
      // Clear OTP inputs on wrong attempt
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (timeLeft > 0) return;
    setTimeLeft(59);
    onResend();
  };

  return (
    <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'white', padding: '48px 40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box', colorScheme: 'light' }}>
      <h2 style={{ color: '#2563eb', fontSize: '20px', fontWeight: 600, marginBottom: '8px', marginTop: 0 }}>
        Xác thực OTP
      </h2>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '32px' }}>
        Nhập mã 6 chữ số đã được gửi đến email của bạn
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '8px',
                border: '1px solid #3b82f6',
                backgroundColor: '#ffffff',
                fontSize: '18px',
                fontWeight: 600,
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                color: '#000000',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#3b82f6'}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
          <Button type="submit" isLoading={isLoading} style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '8px', backgroundColor: '#3b82f6' }}>
            Xác nhận
          </Button>

          <Button
            type="button"
            onClick={handleResend}
            disabled={timeLeft > 0}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '14px',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              color: '#3b82f6',
              opacity: timeLeft > 0 ? 0.7 : 1,
              cursor: timeLeft > 0 ? 'not-allowed' : 'pointer',
              border: 'none',
              fontWeight: 500
            }}
          >
            Gửi lại mã {timeLeft > 0 ? `(${timeLeft}s)` : ''}
          </Button>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onBack();
            }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#3b82f6', fontSize: '14px', textDecoration: 'none', fontWeight: 500, marginTop: '8px' }}
          >
            <ArrowLeft size={16} /> Quay lại đăng nhập
          </a>
        </div>
      </form>
    </div>
  );
};
