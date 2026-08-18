// Composants de champs de formulaire réutilisés par les pages produit
// (création et modification). Ils respectent le design system existant.

export type FormOption = {
  value: string;
  label: string;
};

export function inputClass(hasError: boolean) {
  const base =
    "min-h-11 w-full rounded-md border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition focus:ring-4 focus:ring-primary-100";
  const border = hasError
    ? "border-red-300 focus:border-red-400"
    : "border-app-border focus:border-primary-300";
  return base + " " + border;
}

export function TextField({
  label,
  value,
  placeholder,
  onChange,
  error,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-app-text">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(Boolean(error))}
      />
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-app-text">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(false) + " resize-y"}
      />
    </label>
  );
}

export function NumberField({
  label,
  value,
  placeholder,
  onChange,
  error,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-app-text">{label}</span>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(Boolean(error))}
      />
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

export function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-app-text">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(Boolean(error))}
      />
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FormOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-app-text">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(false)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
