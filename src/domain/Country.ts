import type { CurrencyCode } from '../types'

/** Country-owned facts stay separate from the city-specific itinerary catalog. */
export class Country {
  constructor(
    readonly code: 'GR' | 'EG' | 'TR',
    readonly name: string,
    readonly currency: CurrencyCode,
    readonly timeZone: string,
    readonly locale: string,
  ) {}

  format(amount: number): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: this.currency,
      maximumFractionDigits: this.currency === 'EUR' ? 2 : 0,
    }).format(amount)
  }
}
