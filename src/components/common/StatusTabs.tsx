type Tab<T extends string> = { value: T | ''; label: string; title?: string };

type Props<T extends string> = {
  label: string;
  tabs: Tab<T>[];
  value: T | '';
  onChange: (value: T | '') => void;
};

/** Hàng tab gạch chân dùng làm bộ lọc trạng thái nhanh ở đầu danh sách. */
export const StatusTabs = <T extends string>({ label, tabs, value, onChange }: Props<T>) => (
  <div className="sep-tabs" role="group" aria-label={label}>
    {tabs.map((tab) => (
      <button
        key={tab.value || 'all'}
        type="button"
        className={`sep-tab${tab.value === value ? ' sep-tab--active' : ''}`}
        aria-pressed={tab.value === value}
        title={tab.title}
        onClick={() => onChange(tab.value)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
