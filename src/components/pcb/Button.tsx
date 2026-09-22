import type { ButtonHTMLAttributes } from 'react';
import './pcb.css';
import { Icon } from './Icon';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** `sm` cho ô thao tác trong bảng và thanh phân trang; nút cao 44px làm dòng bảng phình ra. */
  size?: 'md' | 'sm';
};

export const PcbButton = ({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: Props) => (
  <button
    type={type}
    className={`pcb-btn pcb-btn--${variant}${size === 'sm' ? ' pcb-btn--sm' : ''} ${className}`}
    {...rest}
  />
);

/** Icon-only button; `label` is required for accessibility (the design asks for a tooltip). */
export const PcbIconButton = ({
  icon,
  label,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; label: string }) => (
  <button type="button" className="pcb-iconbtn" aria-label={label} title={label} {...rest}>
    <Icon name={icon} size={22} />
  </button>
);
