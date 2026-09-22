import type { ChangeEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { Children, isValidElement, useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './pcb.css';
import { Icon } from './Icon';

type ShellProps = {
  label?: string;
  error?: string;
  /** Gợi ý không chặn, hiện dưới ô khi không có lỗi. */
  hint?: string;
  leading?: string;
  select?: boolean;
  children: (id: string) => ReactNode;
};

const Shell = ({ label, error, hint, leading, select, children }: ShellProps) => {
  const id = useId();
  return (
    <div className="pcb-field">
      {label && <label className="pcb-label" htmlFor={id}>{label}</label>}
      <div className={`pcb-control${error ? ' pcb-control--error' : ''}`}>
        {leading && <Icon name={leading} size={18} />}
        {children(id)}
        {select && <Icon name="expand_more" size={18} />}
      </div>
      {error ? <span className="pcb-error" role="alert">{error}</span> : hint && <span className="pcb-hint">{hint}</span>}
    </div>
  );
};

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  leading?: string;
};

export const Field = ({ label, error, hint, leading, ...input }: FieldProps) => (
  <Shell label={label} error={error} hint={hint} leading={leading}>
    {(id) => <input id={id} {...input} />}
  </Shell>
);

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

type Option = { value: string; disabled: boolean; label: ReactNode };

const selectOptions = (children: ReactNode): Option[] =>
  Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(child)) return [];
    const value = child.props.value;
    return value === undefined
      ? []
      : [{ value: String(value), disabled: Boolean(child.props.disabled), label: child.props.children }];
  });

export const SelectField = ({
  label,
  error,
  hint,
  children,
  value,
  disabled,
  onChange,
  onBlur,
  onFocus,
  ...select
}: SelectProps) => {
  const options = selectOptions(children);
  const selectedValue = String(value ?? '');
  const selected = options.find((option) => option.value === selectedValue) ?? options[0];
  const [open, setOpen] = useState(false);
  const [activeValue, setActiveValue] = useState(selectedValue);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const menuId = useId();

  const placeMenu = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedHeight = Math.min(280, options.length * 38 + 12);
    const below = rect.bottom + 6;
    const top = below + estimatedHeight > window.innerHeight - 8 && rect.top - estimatedHeight - 6 > 8
      ? rect.top - estimatedHeight - 6
      : below;
    setPosition({ top, left: rect.left, width: Math.max(rect.width, 180) });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    placeMenu();
    const closeOutside = (event: MouseEvent) => {
      if (!triggerRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, true);
    document.addEventListener('mousedown', closeOutside);
    return () => {
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu, true);
      document.removeEventListener('mousedown', closeOutside);
    };
  }, [open, placeMenu]);

  const choose = (nextValue: string) => {
    if (options.find((option) => option.value === nextValue)?.disabled) return;
    onChange?.({ target: { value: nextValue }, currentTarget: { value: nextValue } } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveActive = (direction: 1 | -1) => {
    const enabled = options.filter((option) => !option.disabled);
    if (enabled.length === 0) return;
    const current = enabled.findIndex((option) => option.value === activeValue);
    const next = enabled[(current + direction + enabled.length) % enabled.length];
    setActiveValue(next.value);
  };

  const openMenu = () => {
    if (disabled) return;
    setActiveValue(selectedValue);
    placeMenu();
    setOpen(true);
  };

  return (
    <Shell label={label} error={error} hint={hint} leading="tune" select>
      {(id) => (
        <>
          <button
            ref={triggerRef}
            id={id}
            type="button"
            className="pcb-select-trigger"
            disabled={disabled}
            title={select.title}
            role="combobox"
            aria-autocomplete="none"
            aria-controls={open ? menuId : undefined}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-invalid={Boolean(error) || undefined}
            aria-label={select['aria-label'] ?? label}
            onFocus={onFocus as unknown as React.FocusEventHandler<HTMLButtonElement>}
            onBlur={onBlur as unknown as React.FocusEventHandler<HTMLButtonElement>}
            onClick={() => (open ? setOpen(false) : openMenu())}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                if (!open) openMenu();
                moveActive(event.key === 'ArrowDown' ? 1 : -1);
              } else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (open) choose(activeValue);
                else openMenu();
              } else if (event.key === 'Escape') {
                setOpen(false);
              }
            }}
          >
            {selected?.label}
          </button>

          {open && position && createPortal(
            <div
              ref={menuRef}
              id={menuId}
              className="pcb-select-menu"
              role="listbox"
              aria-label={label ?? select['aria-label']}
              style={position}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`pcb-select-option${option.value === selectedValue && option.value !== '' ? ' pcb-select-option--selected' : ''}`}
                  role="option"
                  tabIndex={-1}
                  disabled={option.disabled}
                  aria-selected={option.value === selectedValue}
                  onMouseEnter={() => !option.disabled && setActiveValue(option.value)}
                  onClick={() => choose(option.value)}
                >
                  {option.label}
                  {option.value === selectedValue && option.value !== '' && <Icon name="check" size={18} />}
                </button>
              ))}
            </div>,
            document.body,
          )}
        </>
      )}
    </Shell>
  );
};
