export function Checkbox({ className, checked, onCheckedChange, ...props }) {
  return (
    <input
      type="checkbox"
      className={`h-5 w-5 rounded border-gray-300 text-[#1e3a8a] focus:ring-[#1e3a8a] ${className || ''}`}
      checked={checked}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      {...props}
    />
  )
}
