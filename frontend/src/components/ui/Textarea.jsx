import { cn } from '../../lib/utils'

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'flex min-h-[100px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base resize-none transition-colors placeholder:text-gray-500 focus:border-[#1e3a8a] focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}
