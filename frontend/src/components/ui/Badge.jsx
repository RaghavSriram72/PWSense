import { cn } from '../../lib/utils'

export function Badge({ className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium',
        className
      )}
      {...props}
    />
  )
}
