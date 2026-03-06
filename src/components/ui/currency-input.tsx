'use client'

import { useState, useCallback, useEffect } from 'react'

interface CurrencyInputProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
}

export function CurrencyInput({ value, onChange, placeholder = '$0' }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(
    value ? formatDisplay(value) : ''
  )

  // Sync display when parent value changes (e.g., preset button tap)
  useEffect(() => {
    setDisplayValue(value ? formatDisplay(value) : '')
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, '')
      if (raw === '') {
        setDisplayValue('')
        onChange(null)
        return
      }
      const num = parseInt(raw, 10)
      setDisplayValue(formatDisplay(num))
      onChange(num)
    },
    [onChange]
  )

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full h-14 text-2xl text-center font-bold bg-secondary rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary"
    />
  )
}

function formatDisplay(num: number): string {
  return '$' + num.toLocaleString('en-US')
}
