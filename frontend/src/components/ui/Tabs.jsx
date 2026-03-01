import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'

export function Tabs({ className, ...props }) {
  return (
    <TabsPrimitive.Root className={cn('flex flex-col gap-2', className)} {...props} />
  )
}

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-auto w-fit items-center justify-center rounded-xl p-0 flex gap-3',
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'flex flex-col items-center gap-2 py-4 px-6 rounded-lg border-2 border-gray-200 bg-white text-gray-700 text-sm font-medium transition-all hover:border-[#1e3a8a]',
        'data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white data-[state=active]:border-[#1e3a8a] data-[state=active]:shadow-lg',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]',
        className
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content className={cn('flex-1 outline-none', className)} {...props} />
  )
}
