import { cn } from '../../lib/utils'

export function Button({ className, variant = 'default', ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
        variant === 'default' && 'bg-[#1e3a8a] text-white hover:bg-[#1e40af]',
        variant === 'outline' && 'border border-gray-300 bg-white hover:bg-gray-50 hover:border-[#1e3a8a]',
        className
      )}
      {...props}
    />
  )
}
