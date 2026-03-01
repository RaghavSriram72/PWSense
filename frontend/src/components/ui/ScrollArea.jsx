export function ScrollArea({ className, ...props }) {
  return <div className={`overflow-y-auto pr-4 ${className || ''}`} {...props} />
}
