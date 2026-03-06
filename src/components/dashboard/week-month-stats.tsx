'use client'

interface WeekMonthStatsProps {
  weekTotal: number
  monthTotal: number
}

export function WeekMonthStats({ weekTotal, monthTotal }: WeekMonthStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      <StatCard label="This Week" value={Math.round(weekTotal)} />
      <StatCard label="This Month" value={Math.round(monthTotal)} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">
        {value}
        <span className="text-sm font-normal text-muted ml-1">pts</span>
      </p>
    </div>
  )
}
