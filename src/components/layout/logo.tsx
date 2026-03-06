'use client'

export function Logo({ className, brokerageName }: { className?: string; brokerageName?: string }) {
  const name = brokerageName || 'Daily Prospect Tracker'

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-0">
        {/* Accent bars */}
        <div className="mr-1.5 flex gap-[3px]">
          <div className="h-[28px] w-[3px] rounded-sm bg-primary" />
          <div className="h-[28px] w-[3px] rounded-sm bg-primary" />
        </div>
        {/* Brokerage name */}
        <span className="text-[20px] font-bold leading-none tracking-tight text-foreground">
          {name}
        </span>
      </div>
    </div>
  )
}
