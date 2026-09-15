import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: '#4b5563', color: '#fff', border: 'none' };
      case 'outline':
        return { backgroundColor: 'transparent', color: '#2563eb', border: '1px solid #2563eb' };
      case 'danger':
        return { backgroundColor: '#dc2626', color: '#fff', border: 'none' };
      case 'primary':
      default:
        return { backgroundColor: '#2563eb', color: '#fff', border: 'none' };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '6px 12px', fontSize: '13px' };
      case 'lg':
        return { padding: '12px 24px', fontSize: '16px' };
      case 'md':
      default:
        return { padding: '8px 16px', fontSize: '14px' };
    }
  };

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 500,
        borderRadius: '6px',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'all 0.2s ease',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Đang tải...' : children}
    </button>
  );
};
