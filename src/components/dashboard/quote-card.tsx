interface QuoteCardProps {
  text: string
  author: string | null
}

export function QuoteCard({ text, author }: QuoteCardProps) {
  return (
    <div className="mx-4 mb-4 p-4 bg-card border border-border rounded-xl border-l-4 border-l-primary">
      <p className="text-sm italic text-foreground leading-relaxed">
        &ldquo;{text}&rdquo;
      </p>
      {author && (
        <p className="text-xs text-muted mt-2 text-right">
          -- {author}
        </p>
      )}
    </div>
  )
}
