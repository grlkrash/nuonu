"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTheme } from "next-themes"

interface WalletDashboardProps {
  data: {
    balance: number
    transactions: Array<{
      id: number
      type: string
      amount: number
      from?: string
      to?: string
      date: string
    }>
    grants: Array<{
      id: number
      name: string
      amount: number
      status: string
    }>
  }
}

export function WalletDashboard({ data }: WalletDashboardProps) {
  const formatUSD = (amount: number) => `$${amount.toFixed(2)}`
  const { theme } = useTheme()

  const cardClass = theme === "light" ? "bg-white border-black" : "bg-black border-white"
  const textClass = theme === "light" ? "text-black" : "text-white"

  return (
    <div className="space-y-8">
      <Card className={`${cardClass} border`}>
        <CardHeader>
          <CardTitle className={`lowercase ${textClass}`}>wallet balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-4xl font-bold ${textClass}`}>{formatUSD(data.balance)}</div>
            <div className={`text-sm ${textClass} lowercase`}>total balance</div>
          </div>
        </CardContent>
      </Card>

      <Card className={`${cardClass} border`}>
        <CardHeader>
          <CardTitle className={`lowercase ${textClass}`}>transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={`lowercase ${textClass}`}>type</TableHead>
                <TableHead className={`lowercase ${textClass}`}>amount</TableHead>
                <TableHead className={`lowercase ${textClass}`}>from/to</TableHead>
                <TableHead className={`lowercase ${textClass}`}>date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.length > 0 ? (
                data.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className={`lowercase ${textClass}`}>{tx.type}</TableCell>
                    <TableCell className={textClass}>{formatUSD(tx.amount)}</TableCell>
                    <TableCell className={`lowercase ${textClass}`}>{tx.from || tx.to}</TableCell>
                    <TableCell className={textClass}>{tx.date}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className={`text-center py-4 ${textClass}`}>
                    No transactions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className={`${cardClass} border`}>
        <CardHeader>
          <CardTitle className={`lowercase ${textClass}`}>grant funds</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={`lowercase ${textClass}`}>grant</TableHead>
                <TableHead className={`lowercase ${textClass}`}>amount</TableHead>
                <TableHead className={`lowercase ${textClass}`}>status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.grants.length > 0 ? (
                data.grants.map((grant) => (
                  <TableRow key={grant.id}>
                    <TableCell className={`lowercase ${textClass}`}>{grant.name}</TableCell>
                    <TableCell className={textClass}>{formatUSD(grant.amount)}</TableCell>
                    <TableCell className={`lowercase ${textClass}`}>{grant.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className={`text-center py-4 ${textClass}`}>
                    No grants yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 