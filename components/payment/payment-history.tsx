"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Download, RefreshCw, Calendar, MapPin } from "lucide-react"
import { paymentAPI } from "@/lib/api/payments"
import { formatDateShort } from "@/lib/format-date"
import { useCurrency } from "@/contexts/currency-context"

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  bookings?: {
    id: string
    start_date: string
    end_date: string
    spaces: {
      title: string
      images: string[]
      location: string
    }
  }
}

export function PaymentHistory() {
  const { formatPrice } = useCurrency()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await paymentAPI.getPaymentHistory()
      setPayments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payment History</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchPayments}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No payments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {payment.bookings && (
                      <div className="flex gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                          {payment.bookings.spaces.images[0] && (
                            <img
                              src={payment.bookings.spaces.images[0] || "/placeholder.svg"}
                              alt={payment.bookings.spaces.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{payment.bookings.spaces.title}</h4>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>{payment.bookings.spaces.location}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateShort(payment.created_at)}</span>
                      </div>
                      {payment.bookings && (
                        <span>
                          {formatDateShort(payment.bookings.start_date)} -{" "}
                          {formatDateShort(payment.bookings.end_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">
                      {formatPrice(payment.amount)}
                    </div>
                    <Badge className={getStatusColor(payment.status)}>{formatStatus(payment.status)}</Badge>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
