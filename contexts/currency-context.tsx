"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

const CURRENCIES = [
  { code: "USD", symbol: "$", flag: "\uD83C\uDDFA\uD83C\uDDF8", label: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "\u20AC", flag: "\uD83C\uDDEA\uD83C\uDDFA", label: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "\u00A3", flag: "\uD83C\uDDEC\uD83C\uDDE7", label: "British Pound", locale: "en-GB" },
  { code: "CAD", symbol: "CA$", flag: "\uD83C\uDDE8\uD83C\uDDE6", label: "Canadian Dollar", locale: "en-CA" },
  { code: "AUD", symbol: "A$", flag: "\uD83C\uDDE6\uD83C\uDDFA", label: "Australian Dollar", locale: "en-AU" },
  { code: "JPY", symbol: "\u00A5", flag: "\uD83C\uDDEF\uD83C\uDDF5", label: "Japanese Yen", locale: "ja-JP" },
  { code: "CHF", symbol: "CHF", flag: "\uD83C\uDDE8\uD83C\uDDED", label: "Swiss Franc", locale: "de-CH" },
  { code: "MXN", symbol: "MX$", flag: "\uD83C\uDDF2\uD83C\uDDFD", label: "Mexican Peso", locale: "es-MX" },
] as const

type CurrencyCode = (typeof CURRENCIES)[number]["code"]

// Approximate exchange rates relative to USD (updated periodically)
// In production, these would be fetched from an API
const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.5,
  CHF: 0.88,
  MXN: 17.15,
}

const STORAGE_KEY = "preferred-currency"

type CurrencyInfo = (typeof CURRENCIES)[number]

type CurrencyContextType = {
  currency: CurrencyCode
  currencyInfo: CurrencyInfo
  currencies: typeof CURRENCIES
  setCurrency: (code: CurrencyCode) => void
  convertPrice: (usdAmount: number) => number
  formatPrice: (usdAmount: number | null | undefined, options?: { showUnit?: boolean; unit?: string }) => string
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD")
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = globalThis?.localStorage?.getItem(STORAGE_KEY)
      if (stored && CURRENCIES.some((c) => c.code === stored)) {
        setCurrencyState(stored as CurrencyCode)
      }
    } catch {
      // localStorage unavailable
    }
    setHasLoaded(true)
  }, [])

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code)
    try {
      globalThis?.localStorage?.setItem(STORAGE_KEY, code)
    } catch {
      // localStorage unavailable
    }
  }, [])

  const currencyInfo = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]

  const convertPrice = useCallback(
    (usdAmount: number): number => {
      const rate = EXCHANGE_RATES[currency] || 1
      return usdAmount * rate
    },
    [currency],
  )

  const formatPrice = useCallback(
    (usdAmount: number | null | undefined, options?: { showUnit?: boolean; unit?: string }): string => {
      if (usdAmount === null || usdAmount === undefined) return "N/A"

      const converted = convertPrice(usdAmount)
      const info = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]

      // For JPY, no decimal places
      const decimals = currency === "JPY" ? 0 : 2

      let formatted: string
      try {
        formatted = new Intl.NumberFormat(info.locale, {
          style: "currency",
          currency: currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(converted)
      } catch {
        formatted = `${info.symbol}${converted.toFixed(decimals)}`
      }

      if (options?.showUnit && options?.unit) {
        return `${formatted}/${options.unit}`
      }

      return formatted
    },
    [currency, convertPrice],
  )

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyInfo,
        currencies: CURRENCIES,
        setCurrency,
        convertPrice,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}

export { CURRENCIES, STORAGE_KEY, EXCHANGE_RATES }
export type { CurrencyCode }
