"use client"

import { useState, useEffect } from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useCurrency } from "@/contexts/currency-context"

export function CurrencySelector() {
  const { currency, currencyInfo, currencies, setCurrency } = useCurrency()
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    setHasLoaded(true)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-9 w-9 bg-transparent relative"
          aria-label={`Currency: ${currency}. Click to change currency`}
        >
          {hasLoaded && currencyInfo ? (
            <span className="text-lg leading-none" role="img" aria-label={currencyInfo.label}>
              {currencyInfo.flag}
            </span>
          ) : (
            <Globe className="h-[18px] w-[18px]" />
          )}
          <span className="sr-only">Select currency</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[60] w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Display currency
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {currencies.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="w-6 text-center text-base" role="img" aria-label={c.label}>
                {c.flag}
              </span>
              <span>{c.label}</span>
            </span>
            {currency === c.code && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
