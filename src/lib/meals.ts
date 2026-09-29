import type { MealSlot, Place, RequiredMeal } from '../types'

export const requiredMeals: RequiredMeal[] = ['breakfast', 'lunch', 'dinner']

export const mealWindows: Record<RequiredMeal, { earliest: number; latest: number; target: number }> = {
  breakfast: { earliest: 7 * 60 + 30, latest: 10 * 60, target: 8 * 60 + 15 },
  lunch: { earliest: 12 * 60, latest: 14 * 60, target: 12 * 60 + 45 },
  dinner: { earliest: 18 * 60, latest: 20 * 60 + 30, target: 18 * 60 + 30 },
}

export const MAX_MEAL_WALK_MINUTES = 25
export const MAX_MEAL_WALK_METERS = 1800

export function isRequiredMeal(value: MealSlot | undefined): value is RequiredMeal {
  return value === 'breakfast' || value === 'lunch' || value === 'dinner'
}

export function resolveMealSlot(place: Place, start: number, requested?: MealSlot): MealSlot | null {
  if (place.kind !== 'food') return null
  const slots = requested ? [requested] : [...requiredMeals, 'snack' as const]
  for (const slot of slots) {
    if (!place.mealSlots?.includes(slot)) continue
    if (slot === 'snack') return slot
    const { earliest, latest } = mealWindows[slot]
    if (start >= earliest && start <= latest) return slot
  }
  return null
}
