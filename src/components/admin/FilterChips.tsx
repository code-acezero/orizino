interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterChipsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

const FilterChips = ({ options, value, onChange }: FilterChipsProps) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const isActive = value === opt.value;
      return (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
            isActive
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/50 text-muted-foreground hover:bg-secondary/50 hover:border-primary/30"
          }`}
        >
          {opt.label}
          <span
            className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
              isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {opt.count}
          </span>
        </button>
      );
    })}
  </div>
);

export default FilterChips;
export type { FilterOption, FilterChipsProps };
