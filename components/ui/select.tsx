import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <select ref={ref} className={cn('w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600', className)} {...props}>
      {children}
    </select>
  )
})

Select.displayName = 'Select'