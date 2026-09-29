import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DateControls } from '../DateControls'
import { destinations } from '../../data/destinations'
import { snapshotRates } from '../../services/exchange'

const settings = {
  pace: 'balanced' as const,
  interest: 'all' as const,
  includeTentativeMeals: true,
  savedIds: [],
  maxMealsUsd: 35,
  maxActivitiesUsd: 65,
}

describe('date controls', () => {
  it('checks a changed date range before generating a new route', () => {
    const onDates = vi.fn().mockReturnValue(null)
    const onGenerate = vi.fn()
    render(
      <DateControls
        startDate="2026-12-22"
        endDate="2026-12-25"
        settings={settings}
        city={destinations[0]}
        quote={snapshotRates}
        onDates={onDates}
        onSettings={vi.fn()}
        onGenerate={onGenerate}
      />,
    )
    fireEvent.change(screen.getByLabelText('Trip end date'), {
      target: { value: '2026-12-20' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Generate a route/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('end date')
    expect(onDates).not.toHaveBeenCalled()
    expect(onGenerate).not.toHaveBeenCalled()
  })

  it('allows separate per-person USD meal and attraction caps', () => {
    const onSettings = vi.fn()
    render(<DateControls
      startDate="2026-12-22" endDate="2026-12-24"
      settings={settings} city={destinations[0]} quote={snapshotRates}
      onDates={vi.fn()} onSettings={onSettings} onGenerate={vi.fn()}
    />)
    fireEvent.change(screen.getByLabelText('Maximum meal cost per day in USD'), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText('Maximum activities cost per day in USD'), { target: { value: '40' } })
    expect(onSettings).toHaveBeenCalledWith({ maxMealsUsd: 20 })
    expect(onSettings).toHaveBeenCalledWith({ maxActivitiesUsd: 40 })
  })
})
