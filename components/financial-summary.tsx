"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { DollarSign, TrendingUp, Calendar, Download, Wallet, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { formatDateShort, formatDateTime } from "@/lib/format-date"
import { useCurrency } from "@/contexts/currency-context"

const earningsData = [
  { month: "Jan", earnings: 2400, payouts: 2280 },
  { month: "Feb", earnings: 1398, payouts: 1328 },
  { month: "Mar", earnings: 9800, payouts: 9310 },
  { month: "Apr", earnings: 3908, payouts: 3712 },
  { month: "May", earnings: 4800, payouts: 4560 },
  { month: "Jun", earnings: 3800, payouts: 3610 },
]

export default function FinancialSummary() {
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutMethod, setPayoutMethod] = useState("paypal")
  const [payoutNotes, setPayoutNotes] = useState("")
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([])
  const [isLoadingBalance, setIsLoadingBalance] = useState(true)
  const [timeFrame, setTimeFrame] = useState("6months")
  const [isExporting, setIsExporting] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const { toast } = useToast()
  const { formatPrice } = useCurrency()

  useEffect(() => {
    const supabase = createClient()

    const loadFinancialData = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsLoadingBalance(false)
          setIsLoadingTransactions(false)
          return
        }

        // Calculate available balance from completed bookings
        const { data: bookings, error: bookingsError } = await supabase
          .from("bookings")
          .select("final_amount")
          .eq("host_id", user.id)
          .eq("payment_status", "paid")
          .eq("status", "completed")

        if (bookingsError) {
        }

        const totalEarnings = bookings?.reduce((sum, b) => sum + Number(b.final_amount), 0) || 0

        setTotalEarnings(totalEarnings)

        // Get total amount from completed payouts
        const { data: completedPayouts, error: payoutsError } = await supabase
          .from("payout_requests")
          .select("amount")
          .eq("user_id", user.id)
          .eq("status", "completed")

        if (payoutsError) {
        }

        const totalPaidOut = completedPayouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

        // Calculate available balance
        const balance = totalEarnings - totalPaidOut
        setAvailableBalance(Math.max(0, balance))

        // Get pending payout requests
        const { data: pending, error: pendingError } = await supabase
          .from("payout_requests")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["pending", "processing"])
          .order("created_at", { ascending: false })

        if (pendingError) {
        }

        setPendingPayouts(pending || [])
        setIsLoadingBalance(false)
      } catch (error) {
        setIsLoadingBalance(false)
      }
    }

    loadFinancialData()

    // Subscribe to payout requests changes
    const payoutChannel = supabase
      .channel("payout_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payout_requests",
        },
        () => {
          loadFinancialData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(payoutChannel)
    }
  }, [])

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoadingTransactions(true)
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsLoadingTransactions(false)
          return
        }

        // Calculate date range based on time frame
        const now = new Date()
        const startDate = new Date()

        switch (timeFrame) {
          case "3months":
            startDate.setMonth(now.getMonth() - 3)
            break
          case "6months":
            startDate.setMonth(now.getMonth() - 6)
            break
          case "12months":
            startDate.setMonth(now.getMonth() - 12)
            break
          default:
            startDate.setMonth(now.getMonth() - 6)
        }

        // Fetch bookings with related data
        const { data: bookingsData, error } = await supabase
          .from("bookings")
          .select(
            `
            *,
            space:spaces(title, address_line1, city, state),
            guest:guest_id(first_name, last_name, display_name)
          `,
          )
          .eq("host_id", user.id)
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching transactions:", error)
          setTransactions([])
        } else {
          setTransactions(bookingsData || [])
        }
      } catch (error) {
        console.error("Error loading transactions:", error)
        setTransactions([])
      } finally {
        setIsLoadingTransactions(false)
      }
    }

    loadTransactions()
  }, [timeFrame])

  const handleRequestPayout = async () => {
    const amount = Number.parseFloat(payoutAmount)

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payout amount.",
        variant: "destructive",
      })
      return
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You cannot request more than your available balance of ${formatPrice(availableBalance)}.`,
        variant: "destructive",
      })
      return
    }

    if (amount < 50) {
      toast({
        title: "Minimum Amount Required",
        description: "The minimum payout amount is $50.00.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingPayout(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      const { error } = await supabase.from("payout_requests").insert({
        user_id: user.id,
        amount: amount,
        status: "pending",
        payout_method: payoutMethod,
        notes: payoutNotes.trim() || null,
      })

      if (error) throw error

      toast({
        title: "Payout Request Submitted",
        description: `Your payout request for ${formatPrice(amount)} has been submitted successfully. You'll be notified once it's processed.`,
      })

      // Reset form and close dialog
      setPayoutAmount("")
      setPayoutMethod("paypal")
      setPayoutNotes("")
      setIsPayoutDialogOpen(false)
    } catch (error: any) {
      console.error("Error submitting payout request:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit payout request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingPayout(false)
    }
  }

  const handleExport = async () => {
    if (transactions.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no transactions in the selected time frame to export.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      // Generate CSV content
      const headers = [
        "Transaction ID",
        "Date",
        "Guest Name",
        "Space Name",
        "Location",
        "Start Date",
        "End Date",
        "Total Hours",
        "Price Per Hour",
        "Subtotal",
        "Service Fee",
        "Tax",
        "Total Amount",
        "Status",
        "Payment Status",
      ]

      const csvRows = [headers.join(",")]

      transactions.forEach((transaction) => {
        const row = [
          transaction.id,
          formatDateShort(transaction.created_at),
          transaction.guest?.display_name ||
            `${transaction.guest?.first_name || ""} ${transaction.guest?.last_name || ""}`.trim() ||
            "Unknown",
          transaction.space?.title || "Unknown Space",
          `"${transaction.space?.city || ""}, ${transaction.space?.state || ""}"`,
          formatDateTime(transaction.start_date),
          formatDateTime(transaction.end_date),
          transaction.total_hours,
          formatPrice(Number(transaction.price_per_hour)),
          formatPrice(Number(transaction.total_amount)),
          formatPrice(Number(transaction.service_fee || 0)),
          formatPrice(Number(transaction.tax_amount || 0)),
          formatPrice(Number(transaction.final_amount)),
          transaction.status,
          transaction.payment_status,
        ]
        csvRows.push(row.join(","))
      })

      // Add summary row
      const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.final_amount), 0)
      const totalServiceFee = transactions.reduce((sum, t) => sum + Number(t.service_fee || 0), 0)
      const totalTax = transactions.reduce((sum, t) => sum + Number(t.tax_amount || 0), 0)

      csvRows.push("")
      csvRows.push("SUMMARY")
      csvRows.push(`Total Transactions,${transactions.length}`)
      csvRows.push(`Total Revenue,${formatPrice(totalRevenue)}`)
      csvRows.push(`Total Service Fees,${formatPrice(totalServiceFee)}`)
      csvRows.push(`Total Tax,${formatPrice(totalTax)}`)

      const csvContent = csvRows.join("\n")

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      const timeFrameLabel = {
        "3months": "3-months",
        "6months": "6-months",
        "12months": "12-months",
      }[timeFrame]

      link.setAttribute("href", url)
      link.setAttribute("download", `financial-summary-${timeFrameLabel}-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: `Your financial data for the last ${timeFrameLabel} has been downloaded.`,
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export Failed",
        description: "There was an error exporting your financial data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <TrendingUp className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calculate total payout as Total Earnings minus 15% platform fee
  const totalPayout = totalEarnings * 0.85
  const platformFee = totalEarnings * 0.15

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Financial Summary</h1>
        <div className="flex gap-2">
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Last 6 months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} disabled={isExporting || isLoadingTransactions}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingBalance ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-green-600">{formatPrice(availableBalance)}</div>
                <p className="text-xs text-muted-foreground mt-1">Ready to withdraw • Minimum payout: $50.00</p>
                <Button
                  onClick={() => setIsPayoutDialogOpen(true)}
                  disabled={availableBalance < 50}
                  className="mt-4 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Request Payout
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayouts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingPayouts.length > 0
                ? `${formatPrice(pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0))} in processing`
                : "No pending payouts"}
            </p>
          </CardContent>
        </Card>
      </div>

      {pendingPayouts.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Payout Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold text-gray-900">{formatPrice(Number(payout.amount))}</div>
                      {getStatusBadge(payout.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Requested on {formatDateShort(payout.created_at)}
                    </p>
                    {payout.notes && <p className="text-xs text-gray-500 mt-1 italic">"{payout.notes}"</p>}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">via {payout.payout_method}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">From completed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalPayout)}</div>
            <p className="text-xs text-muted-foreground">After 15% platform fee ({formatPrice(platformFee)})</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,350</div>
            <p className="text-xs text-muted-foreground">Expected June 22, 2024</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings & Payouts Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              earnings: {
                label: "Earnings",
                color: "hsl(var(--chart-1))",
              },
              payouts: {
                label: "Payouts",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="earnings" stroke="var(--color-earnings)" strokeWidth={2} />
                <Line type="monotone" dataKey="payouts" stroke="var(--color-payouts)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No transactions found</p>
              <p className="text-sm text-gray-500 mt-1">
                Transactions from your bookings will appear here for the selected time frame
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {transaction.guest?.display_name ||
                            `${transaction.guest?.first_name || ""} ${transaction.guest?.last_name || ""}`.trim() ||
                            "Guest"}
                        </p>
                        <p className="text-sm text-gray-600">{transaction.space?.title || "Space"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>Booking: {formatDateShort(transaction.start_date)}</span>
                      <span>
                        Duration: {transaction.total_hours} hour{transaction.total_hours !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{formatPrice(Number(transaction.final_amount))}</div>
                    <Badge
                      variant={transaction.status === "completed" ? "default" : "secondary"}
                      className={transaction.status === "completed" ? "bg-green-500" : ""}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {transactions.length > 10 && (
                <p className="text-center text-sm text-gray-500 pt-2">
                  Showing 10 of {transactions.length} transactions. Export to see all.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              Request Payout
            </DialogTitle>
            <DialogDescription>
              Request a payout from your available balance. Minimum payout is $50.00.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-medium text-gray-700">Available Balance</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(availableBalance)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payout Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="50"
                  max={availableBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">Minimum: {formatPrice(50)} • Maximum: {formatPrice(availableBalance)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Payout Method *</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="skrill">Skrill</SelectItem>
                  <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder="Add any special instructions or notes for the admin team..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{payoutNotes.length}/500</p>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-800">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Payouts are typically processed within 3-5 business days. You'll receive a notification once your
                request is approved.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayoutDialogOpen(false)} disabled={isSubmittingPayout}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestPayout}
              disabled={isSubmittingPayout || !payoutAmount || Number.parseFloat(payoutAmount) < 50}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmittingPayout ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
