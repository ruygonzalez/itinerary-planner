import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { DistanceUnit, PlanSettings } from '../../types'
import { WalkingControls } from '../WalkingControls'

function InteractiveLimit() {
  const [limit, setLimit] = useState({ maxWalkingMeters: 10000, distanceUnit: 'km' as DistanceUnit })
  return <WalkingControls meters={limit.maxWalkingMeters} unit={limit.distanceUnit}
    onChange={(changes: Partial<Pick<PlanSettings, 'maxWalkingMeters' | 'distanceUnit'>>) =>
      setLimit((current) => ({ ...current, ...changes }))} />
}

describe('editable daily walking limit', () => {
  it('keeps the same distance when changing units and accepts typed or slider updates', () => {
    render(<InteractiveLimit />)
    const slider = screen.getByRole('slider', { name: 'Maximum distance walked per day' })
    const unit = screen.getByRole('combobox', { name: 'Walking distance unit' })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Daily walking limit in Kilometers' }), {
      target: { value: '3.5' },
    })
    expect(slider).toHaveAttribute('aria-valuetext', '3.5 km')
    fireEvent.change(unit, { target: { value: 'miles' } })
    expect(screen.getByRole('spinbutton', { name: 'Daily walking limit in Miles' })).toHaveValue(2.17)
    fireEvent.change(unit, { target: { value: 'steps' } })
    expect(slider).toHaveAttribute('aria-valuetext', '4,593 steps')
    fireEvent.change(slider, { target: { value: '5000' } })
    expect(slider).toHaveAttribute('aria-valuetext', '5,000 steps')
    fireEvent.change(unit, { target: { value: 'feet' } })
    expect(slider).toHaveAttribute('aria-valuetext', '12,500 ft')
  })

  it('rejects typed limits over the maximum without changing the actual allowance', () => {
    render(<InteractiveLimit />)
    const number = screen.getByRole('spinbutton', { name: 'Daily walking limit in Kilometers' })
    fireEvent.change(number, { target: { value: '51' } })
    expect(number).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('50 km')
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '10 km')
    fireEvent.blur(number)
    expect(number).toHaveValue(10)
  })

  it('preserves a 50 km limit when the rounded mile value is displayed', () => {
    render(<InteractiveLimit />)
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Daily walking limit in Kilometers' }), {
      target: { value: '50' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Walking distance unit' }), {
      target: { value: 'miles' },
    })
    const miles = screen.getByRole('spinbutton', { name: 'Daily walking limit in Miles' })
    expect(miles).toHaveValue(31.07)
    expect(miles).toHaveAttribute('aria-invalid', 'false')
    expect(miles).toBeValid()
  })
})
