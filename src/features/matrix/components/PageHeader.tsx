import type { ReactNode } from 'react';
import { PcbIconButton } from '../../../components/pcb';
import { getUsername, roleLabel } from '../../../utils/jwt';

type Props = {
  title: string;
  /** Có thì hiện nút quay lại bên trái tiêu đề. */
  onBack?: () => void;
  /** Hiện ngay sau tiêu đề, ví dụ nhãn trạng thái của ma trận. */
  badge?: ReactNode;
};

/** Thanh trên cùng của mọi màn ma trận: tên màn bên trái, người đang đăng nhập bên phải. */
export const PageHeader = ({ title, onBack, badge }: Props) => {
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
