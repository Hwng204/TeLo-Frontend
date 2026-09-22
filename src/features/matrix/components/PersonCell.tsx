import type { MatrixPerson } from '../../../types';

/** Tên người dùng, dòng phụ là vai trò (theo Figma M01); "—" khi ma trận cũ chưa ghi người lập. */
export const PersonCell = ({ person }: { person: MatrixPerson | null }) =>
  person ? (
    <>
      {person.fullName}
      {person.roleLabel && <div className="sep-muted">{person.roleLabel}</div>}
    </>
  ) : (
    <span className="sep-muted">—</span>
  );
