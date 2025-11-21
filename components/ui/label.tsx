import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn('block text-sm text-gray-700', className)} {...props} />
}