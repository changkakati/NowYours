export default function FormField({
  label,
  type = "text",
  name,
  placeholder,
  autoComplete,
  required = true,
  ...props
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        className="
          w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5
          text-sm text-slate-900 placeholder:text-slate-400
          transition
          focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900
          disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400
        "
        type={type}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        {...props}
      />
    </label>
  );
}