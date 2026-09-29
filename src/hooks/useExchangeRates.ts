import { useEffect, useState } from 'react'
import { fetchUsdExchange, initialExchangeQuote } from '../services/exchange'

export function useExchangeRates() {
  const [quote, setQuote] = useState(initialExchangeQuote)
  useEffect(() => {
    let active = true
    fetchUsdExchange().then((result) => {
      if (active) setQuote(result)
    })
    return () => { active = false }
  }, [])
  return quote
}
