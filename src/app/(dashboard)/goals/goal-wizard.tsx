'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { PresetButton } from '@/components/ui/preset-button'
import { CurrencyInput } from '@/components/ui/currency-input'
import { calculateGoals, type ConversionRates } from '@/lib/calculations'
import { saveGoals, markOnboarded } from './actions'
import { saveDemoGoals } from './demo-actions'
import type { Tables } from '@/lib/supabase/types'

interface GoalWizardProps {
  existingGoals: Tables<'goals'> | null
  conversionRates: ConversionRates
  isDemo?: boolean
}

const INCOME_PRESETS = [100000, 150000, 200000, 250000, 300000]
const COMMISSION_PRESETS = [0.02, 0.025, 0.03]
const PRICE_PRESETS = [500000, 750000, 1000000, 1250000, 1500000]

const STEPS = [
  { title: 'Annual Income Goal', subtitle: 'How much do you want to earn this year?' },
  { title: 'Commission Rate', subtitle: 'Your average commission percentage' },
  { title: 'Average Sale Price', subtitle: 'Typical home sale price in your area' },
  { title: 'Your Goal Summary', subtitle: 'Review your targets and daily points goal' },
]

export function GoalWizard({ existingGoals, conversionRates, isDemo = false }: GoalWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [annualIncome, setAnnualIncome] = useState<number | null>(
    existingGoals?.annual_income_goal ? Number(existingGoals.annual_income_goal) : null
  )
  const [commissionRate, setCommissionRate] = useState<number | null>(
    existingGoals?.avg_commission_pct ? Number(existingGoals.avg_commission_pct) : null
  )
  const [salePrice, setSalePrice] = useState<number | null>(
    existingGoals?.avg_sale_price ? Number(existingGoals.avg_sale_price) : null
  )
  const [dailyPoints, setDailyPoints] = useState<number>(
    existingGoals?.daily_points_goal ? Number(existingGoals.daily_points_goal) : 80
  )

  const calculated = annualIncome && commissionRate && salePrice
    ? calculateGoals(annualIncome, commissionRate, salePrice, conversionRates)
    : null

  function canProceed(): boolean {
    switch (step) {
      case 0: return annualIncome !== null && annualIncome > 0
      case 1: return commissionRate !== null && commissionRate > 0
      case 2: return salePrice !== null && salePrice > 0
      case 3: return calculated !== null
      default: return false
    }
  }

  function handleNext() {
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleSave()
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1)
  }

  function handleSave() {
    if (!calculated || !annualIncome || !commissionRate || !salePrice) return
    setError(null)

    startTransition(async () => {
      const goalData = {
        annualIncomeGoal: annualIncome,
        avgCommissionPct: commissionRate,
        avgSalePrice: salePrice,
        closingsGoal: calculated.closingsGoal,
        contractsGoal: calculated.contractsGoal,
        appointmentsGoal: calculated.appointmentsGoal,
        contactsGoal: calculated.contactsGoal,
        dailyPointsGoal: dailyPoints,
      }

      const result = isDemo
        ? await saveDemoGoals(goalData)
        : await saveGoals(goalData)

      if (result.error) {
        setError(result.error)
        return
      }

      if (!isDemo && !existingGoals) {
        await markOnboarded()
      }

      router.push(isDemo ? '/team' : '/')
      router.refresh()
    })
  }

  return (
    <>
      <Header title={STEPS[step].title} subtitle={STEPS[step].subtitle} />
      <div className="flex flex-col flex-1 px-4 pb-28">
        {/* Step indicator */}
        <div className="flex gap-1.5 my-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {step === 0 && (
              <div className="space-y-4">
                <CurrencyInput
                  value={annualIncome}
                  onChange={setAnnualIncome}
                  placeholder="$200,000"
                />
                <div className="flex flex-wrap gap-2">
                  {INCOME_PRESETS.map((preset) => (
                    <PresetButton
                      key={preset}
                      label={`$${(preset / 1000).toFixed(0)}K`}
                      selected={annualIncome === preset}
                      onSelect={() => setAnnualIncome(preset)}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <span className="text-4xl font-bold">
                    {commissionRate ? `${(commissionRate * 100).toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {COMMISSION_PRESETS.map((preset) => (
                    <PresetButton
                      key={preset}
                      label={`${(preset * 100).toFixed(1)}%`}
                      selected={commissionRate === preset}
                      onSelect={() => setCommissionRate(preset)}
                    />
                  ))}
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-muted underline"
                    onClick={() => {
                      const val = prompt('Enter commission rate (e.g. 2.75):')
                      if (val) {
                        const num = parseFloat(val)
                        if (!isNaN(num) && num > 0 && num < 100) {
                          setCommissionRate(num / 100)
                        }
                      }
                    }}
                  >
                    Enter custom rate
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <CurrencyInput
                  value={salePrice}
                  onChange={setSalePrice}
                  placeholder="$800,000"
                />
                <div className="flex flex-wrap gap-2">
                  {PRICE_PRESETS.map((preset) => (
                    <PresetButton
                      key={preset}
                      label={`$${(preset / 1000).toFixed(0)}K`}
                      selected={salePrice === preset}
                      onSelect={() => setSalePrice(preset)}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && calculated && (
              <div className="space-y-6">
                {/* Funnel breakdown */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
                    Annual Targets
                  </h3>
                  <FunnelRow label="Contacts needed" value={calculated.contactsGoal} />
                  <FunnelRow label="Appointments" value={calculated.appointmentsGoal} />
                  <FunnelRow label="Contracts" value={calculated.contractsGoal} />
                  <FunnelRow label="Closings" value={calculated.closingsGoal} />
                </div>

                {/* Daily points slider */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
                    Daily Points Goal
                  </h3>
                  <div className="text-center">
                    <span className="text-5xl font-bold text-primary">{dailyPoints}</span>
                    <span className="text-lg text-muted ml-2">pts/day</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={120}
                    step={5}
                    value={dailyPoints}
                    onChange={(e) => setDailyPoints(parseInt(e.target.value, 10))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted">
                    <span>40 (light)</span>
                    <span>80 (standard)</span>
                    <span>120 (intense)</span>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-fire text-center">{error}</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 h-12 rounded-xl font-medium bg-secondary text-foreground touch-manipulation"
            >
              Back
            </button>
          )}
          <motion.button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || isPending}
            whileTap={{ scale: 0.97 }}
            className={`flex-1 h-12 rounded-xl font-medium text-white touch-manipulation transition-colors ${
              canProceed() && !isPending
                ? 'bg-primary'
                : 'bg-primary/50 cursor-not-allowed'
            }`}
          >
            {isPending ? 'Saving...' : step === 3 ? 'Save Goals' : 'Next'}
          </motion.button>
        </div>
      </div>
    </>
  )
}

function FunnelRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-foreground">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  )
}
