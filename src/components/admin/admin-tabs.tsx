'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Agents', href: '/admin' },
  { label: 'Teams', href: '/admin/teams' },
  { label: 'Settings', href: '/admin/settings' },
]

export function AdminTabs() {
  const pathname = usePathname()

  return (
    <div className="sticky top-12 z-30 bg-background border-b border-border">
      <div className="flex gap-0 px-4">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/admin'
              ? pathname === '/admin' || pathname.startsWith('/admin/agents') || pathname.startsWith('/admin/invite')
              : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 py-3 text-center text-sm font-medium transition-colors touch-manipulation',
                isActive
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
