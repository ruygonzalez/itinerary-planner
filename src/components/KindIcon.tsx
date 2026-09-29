import { Columns3, Landmark, Trees, UtensilsCrossed } from 'lucide-react'
import type { PlaceKind } from '../types'

export function KindIcon({ kind, size = 18 }: { kind: PlaceKind; size?: number }) {
  switch (kind) {
    case 'sight':
      return <Landmark size={size} aria-hidden="true" />
    case 'museum':
      return <Columns3 size={size} aria-hidden="true" />
    case 'outdoors':
      return <Trees size={size} aria-hidden="true" />
    case 'food':
      return <UtensilsCrossed size={size} aria-hidden="true" />
  }
}
