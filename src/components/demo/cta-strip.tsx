import { getDemoCTAUrl } from '@/lib/demo'

export function CTAStrip() {
  const ctaUrl = getDemoCTAUrl()

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-gradient-to-r from-primary to-blue-700 px-4 py-3 text-center shadow-lg pb-safe">
      <a
        href={ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-white"
      >
        Get This For Your Team
        <span aria-hidden="true">&rarr;</span>
      </a>
    </div>
  )
}
