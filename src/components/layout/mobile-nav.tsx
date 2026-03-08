'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Activity, Users, Settings, Shield, Target, type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Tab {
  label: string
  href: string
  icon: LucideIcon
}

const baseTabs: Tab[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Log', href: '/log', icon: Activity },
  { label: 'Team', href: '/team', icon: Users },
]

const adminTab: Tab = { label: 'Admin', href: '/admin', icon: Shield }

const settingsTab: Tab = { label: 'Settings', href: '/settings', icon: Settings }

interface MobileNavProps {
  userRole?: string
  isDemo?: boolean
}

export function MobileNav({ userRole, isDemo = false }: MobileNavProps) {
  const pathname = usePathname()

  const isAdmin = userRole === 'admin' || userRole === 'broker'

  // In demo mode: show the same tabs a regular agent sees, plus Goals
  const demoTabs: Tab[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Log', href: '/log', icon: Activity },
    { label: 'Team', href: '/team', icon: Users },
    { label: 'Goals', href: '/goals', icon: Target },
    { label: 'Settings', href: '/settings', icon: Settings },
  ]

  const tabs: Tab[] = isDemo
    ? demoTabs
    : isAdmin
      ? [...baseTabs, adminTab, settingsTab]
      : [...baseTabs, settingsTab]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 items-center justify-center"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-1',
                  isActive ? 'text-primary' : 'text-muted'
                )}
              >
                <tab.icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium leading-tight">
                  {tab.label}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
