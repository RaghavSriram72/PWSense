import { useEffect } from 'react'
import { cn } from '../../lib/utils'

export function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} aria-hidden />
      <div className="relative z-10 max-h-[90vh] overflow-y-auto">{children}</div>
    </div>
  )
}

export function DialogContent({ className, children, ...props }) {
  return (
    <div
      className={cn('bg-white rounded-xl shadow-lg border border-gray-200 p-6 mx-4 max-w-lg w-full', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ children }) {
  return <div className="mb-4">{children}</div>
}

export function DialogTitle({ className, ...props }) {
  return <h3 className={'text-2xl font-bold text-gray-900 ' + (className || '')} {...props} />
}

export function DialogDescription({ className, ...props }) {
  return <p className={'text-gray-600 mt-1 ' + (className || '')} {...props} />
}
