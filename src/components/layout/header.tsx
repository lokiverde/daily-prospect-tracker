'use client'

import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  className?: string
}

export function Header({ title, subtitle, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center border-b border-border bg-card px-4',
        className
      )}
    >
      <div className="flex flex-col justify-center">
        <h1 className="text-lg font-semibold leading-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs leading-tight text-muted">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  )
}
