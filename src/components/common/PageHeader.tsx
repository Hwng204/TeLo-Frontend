import type { ReactNode } from 'react';
import { PcbIconButton } from '../pcb';
import { getUsername, roleLabel } from '../../utils/jwt';

type Props = {
  title: string;
  /** Có thì hiện nút quay lại bên trái tiêu đề. */
  onBack?: () => void;
  /** Hiện ngay sau tiêu đề, ví dụ nhãn trạng thái của ma trận. */
  badge?: ReactNode;
  /**
   * Layout đã có sẵn thanh trên (AdminLayout: năm học + người dùng): chỉ vẽ dòng tiêu đề trong trang,
   * không vẽ thêm một thanh trên thứ hai.
   */
  inline?: boolean;
};

/** Thanh trên cùng của mọi màn ma trận: tên màn bên trái, người đang đăng nhập bên phải. */
export const PageHeader = ({ title, onBack, badge, inline }: Props) => {
  if (inline) {
    return (
      <div className="sep-pagehead">
        {onBack && <PcbIconButton icon="arrow_back" label="Quay lại" onClick={onBack} />}
        <h1 className="sep-topbar__title">
          <span>{title}</span>
          {badge}
        </h1>
      </div>
    );
  }
  const username = getUsername();
  const role = roleLabel();
  return (
    <header className="sep-topbar">
      {onBack && <PcbIconButton icon="arrow_back" label="Quay lại" onClick={onBack} />}
      <h1 className="sep-topbar__title">
        <span>{title}</span>
        {badge}
      </h1>
      <div className="sep-user">
        <span className="sep-user__avatar" aria-hidden="true">
          {(username || role || '?').charAt(0)}
        </span>
        <div className="sep-user__text">
          <div className="sep-user__name">{username || role}</div>
          {username && role && <div className="sep-user__role">{role}</div>}
        </div>
      </div>
    </header>
  );
};
