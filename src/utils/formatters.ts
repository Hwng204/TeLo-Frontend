export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/** yyyy-MM-dd theo giờ máy người dùng; toISOString() lệch một ngày ở múi giờ +7 gần nửa đêm. */
export function localDateString(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "Trần Thị Mai · Phó Hiệu trưởng"; "—" khi không có dữ liệu (ma trận cũ chưa ghi người lập). */
export function personLabel(person: { fullName: string; roleLabel: string | null } | null | undefined): string {
  if (!person) return '—';
  return person.roleLabel ? `${person.fullName} · ${person.roleLabel}` : person.fullName;
}
