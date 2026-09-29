import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DateControls } from '../DateControls'

const settings = {
  pace: 'balanced' as const,
  interest: 'all' as const,
  includeTentativeMeals: true,
  savedIds: [],
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
})
