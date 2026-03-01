import { cn } from '../../lib/utils'

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-12 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base transition-colors placeholder:text-gray-500 focus:border-[#1e3a8a] focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}
