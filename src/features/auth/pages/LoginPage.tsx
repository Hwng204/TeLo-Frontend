import React, { useState } from 'react';
import { LoginForm } from '../components/LoginForm';
import { ForgotPasswordEmailForm } from '../components/ForgotPasswordEmailForm';
import { ForgotPasswordOtpForm } from '../components/ForgotPasswordOtpForm';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { displayToast } from '../../../utils/toast';
import { GraduationCap, Headset } from 'lucide-react';
import bgImage from '../../../assets/LoginBackground.jpg';

type AuthStep = 'login' | 'forgot_password_email' | 'forgot_password_otp' | 'reset_password';

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('login');
  const [resetEmail, setResetEmail] = useState('');

  const renderForm = () => {
    switch (step) {
      case 'login':
        return <LoginForm onForgotPassword={() => setStep('forgot_password_email')} />;
      case 'forgot_password_email':
        return (
          <ForgotPasswordEmailForm
            onSuccess={(email) => {
              setResetEmail(email);
              setStep('forgot_password_otp');
            }}
            onBack={() => setStep('login')}
          />
        );
      case 'forgot_password_otp':
        return (
          <ForgotPasswordOtpForm
            email={resetEmail}
            onSuccess={() => setStep('reset_password')}
            onResend={() => {
              // Handle resend logic here if needed
              console.log('Resending OTP to', resetEmail);
            }}
          />
        );
      case 'reset_password':
        return (
          <ResetPasswordForm
            onSuccess={() => {
              displayToast('success', 'Thành công', 'Cập nhật mật khẩu thành công! Vui lòng đăng nhập lại.', 3);
              setStep('login');
            }}
            onBack={() => setStep('login')}
          />
        );
      default:
        return <LoginForm onForgotPassword={() => setStep('forgot_password_email')} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `url(${bgImage})`,
        backgroundColor: '#475569', // Fallback background
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        zIndex: 9999,
        boxSizing: 'border-box',
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1,
        }}
      />

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', flex: 1, padding: '32px 56px', boxSizing: 'border-box' }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#60a5fa', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap color="white" size={28} />
            </div>
            <div style={{ color: 'white', textAlign: 'left' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>
                CỔNG THÔNG TIN GIÁO DỤC
              </h1>

            </div>
          </div>

          <div style={{ color: 'white', fontSize: '15px', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Headset size={18} color="#fbbf24" /> Hỗ trợ kỹ thuật: 0237 3688 108
            </span>
          </div>
        </header>

        {/* Center Content */}
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '40px' }}>

          {/* Left Text */}
          <div style={{ flex: 1, textAlign: 'left', maxWidth: '650px', marginLeft: '20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: '8px 20px', borderRadius: '9999px', color: 'white', fontSize: '14px', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#34d399', borderRadius: '50%' }}></span>
              Năm học 2026-2027 • Hệ thống trực tuyến
            </div>
            <h2 style={{ fontSize: '56px', fontWeight: 800, color: 'white', lineHeight: '1.25', margin: 0 }}>
              Nền tảng quản trị & <br />
              <span style={{ color: '#fbbf24' }}>kết nối nhà trường</span>
            </h2>
          </div>

          {/* Right Login Form */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: '40px' }}>
            {renderForm()}
          </div>
        </main>

        {/* Footer */}
        <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', paddingBottom: '8px' }}>
          <div>
            © 2026
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Quy chế sử dụng</a>
            <span>•</span>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Chính sách bảo mật</a>
            <span>•</span>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Trợ giúp</a>
          </div>
        </footer>

      </div>
    </div>
  );
};
