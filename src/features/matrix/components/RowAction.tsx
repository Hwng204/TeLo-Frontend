import { Link } from 'react-router-dom';
import { Icon } from '../../../components/pcb';

/** Icon trong cột "Hành động". Chỉ điều hướng, nên là link chứ không phải nút. */
export const RowAction = ({ to, icon, label }: { to: string; icon: string; label: string }) => (
  <Link to={to} className="pcb-iconbtn pcb-iconbtn--sm" aria-label={label} title={label}>
    <Icon name={icon} size={20} />
  </Link>
);

/** Icon thao tác ngay tại dòng (không điều hướng), cùng cỡ với RowAction. */
export const RowActionButton = ({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    className="pcb-iconbtn pcb-iconbtn--sm"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
  >
    <Icon name={icon} size={20} />
  </button>
);
