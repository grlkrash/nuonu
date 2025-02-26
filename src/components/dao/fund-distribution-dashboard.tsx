"use client"

import { useState } from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { 
  Download, 
  Filter, 
  ArrowUpDown, 
  ChevronDown, 
  MoreHorizontal, 
  Calendar, 
  DollarSign,
  Wallet,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Transaction {
  id: string
  date: string
  amount: number
  source: string
  status: "completed" | "pending" | "failed"
  type: "grant" | "donation" | "payment"
  description: string
}

interface Fund {
  id: string
  name: string
  totalAmount: number
  remainingAmount: number
  source: string
  startDate: string
  endDate: string
  status: "active" | "completed" | "upcoming"
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

function FundDistributionDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx1",
      date: "2023-05-15",
      amount: 2500,
      source: "MusicDAO",
      status: "completed",
      type: "grant",
      description: "Community Music Festival Grant - First Installment"
    },
    {
      id: "tx2",
      date: "2023-05-28",
      amount: 750,
      source: "Fan Donations",
      status: "completed",
      type: "donation",
      description: "Monthly fan support contributions"
    },
    {
      id: "tx3",
      date: "2023-06-10",
      amount: 1200,
      source: "ArtistCollective",
      status: "completed",
      type: "payment",
      description: "Album production advance payment"
    },
    {
      id: "tx4",
      date: "2023-06-22",
      amount: 2500,
      source: "MusicDAO",
      status: "pending",
      type: "grant",
      description: "Community Music Festival Grant - Second Installment"
    },
    {
      id: "tx5",
      date: "2023-07-05",
      amount: 800,
      source: "NFTCreators",
      status: "failed",
      type: "payment",
      description: "Digital art exhibition payment - Failed due to network issues"
    }
  ])

  const [funds, setFunds] = useState<Fund[]>([
    {
      id: "fund1",
      name: "Community Music Festival Grant",
      totalAmount: 5000,
      remainingAmount: 2500,
      source: "MusicDAO",
      startDate: "2023-05-15",
      endDate: "2023-07-15",
      status: "active"
    },
    {
      id: "fund2",
      name: "Album Production Fund",
      totalAmount: 3000,
      remainingAmount: 1800,
      source: "ArtistCollective",
      startDate: "2023-06-01",
      endDate: "2023-09-01",
      status: "active"
    },
    {
      id: "fund3",
      name: "Digital Art Exhibition",
      totalAmount: 1500,
      remainingAmount: 1500,
      source: "NFTCreators",
      startDate: "2023-07-15",
      endDate: "2023-08-15",
      status: "upcoming"
    }
  ])

  const [selectedTimeRange, setSelectedTimeRange] = useState("all")
  const [selectedTransactionType, setSelectedTransactionType] = useState("all")

  // Calculate total funds received
  const totalReceived = transactions
    .filter(tx => tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0)

  // Calculate pending funds
  const pendingFunds = transactions
    .filter(tx => tx.status === "pending")
    .reduce((sum, tx) => sum + tx.amount, 0)

  // Calculate funds by type for pie chart
  const fundsByType = [
    {
      name: "Grants",
      value: transactions
        .filter(tx => tx.type === "grant" && tx.status === "completed")
        .reduce((sum, tx) => sum + tx.amount, 0)
    },
    {
      name: "Donations",
      value: transactions
        .filter(tx => tx.type === "donation" && tx.status === "completed")
        .reduce((sum, tx) => sum + tx.amount, 0)
    },
    {
      name: "Payments",
      value: transactions
        .filter(tx => tx.type === "payment" && tx.status === "completed")
        .reduce((sum, tx) => sum + tx.amount, 0)
    }
  ]

  // Calculate monthly data for bar chart
  const monthlyData = [
    { name: "May", amount: 3250 },
    { name: "Jun", amount: 3700 },
    { name: "Jul", amount: 800 },
    { name: "Aug", amount: 0 },
    { name: "Sep", amount: 0 }
  ]

  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(tx => {
    if (selectedTransactionType !== "all" && tx.type !== selectedTransactionType) {
      return false
    }
    
    if (selectedTimeRange === "last30") {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return new Date(tx.date) >= thirtyDaysAgo
    }
    
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "active":
        return "bg-blue-100 text-blue-800"
      case "upcoming":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Fund Distribution Dashboard</h2>
        <p className="text-gray-600">
          Track and manage your received funds from grants, donations, and payments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold">{formatCurrency(totalReceived)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-yellow-500" />
              <div className="text-2xl font-bold">{formatCurrency(pendingFunds)}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Wallet className="mr-2 h-5 w-5 text-blue-500" />
              <div className="text-2xl font-bold">{funds.filter(f => f.status === "active").length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
            <CardDescription>Fund distribution over the past months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Funds by Type</CardTitle>
            <CardDescription>Distribution of funds by source type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fundsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {fundsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="funds">Active Funds</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>View all your incoming transactions</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select 
                    defaultValue="all" 
                    onValueChange={setSelectedTimeRange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="last30">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    defaultValue="all" 
                    onValueChange={setSelectedTransactionType}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Transaction Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="grant">Grants</SelectItem>
                      <SelectItem value="donation">Donations</SelectItem>
                      <SelectItem value="payment">Payments</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{formatDate(tx.date)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{tx.description}</TableCell>
                        <TableCell>{tx.source}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(tx.status)} capitalize`}>
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Download Receipt</DropdownMenuItem>
                              {tx.status === "pending" && (
                                <DropdownMenuItem>Check Status</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                        No transactions found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="funds">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Active Funds</CardTitle>
                  <CardDescription>Track your active and upcoming funds</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {funds.map((fund) => (
                  <div key={fund.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-lg">{fund.name}</h3>
                          <Badge className={`${getStatusColor(fund.status)} capitalize`}>
                            {fund.status}
                          </Badge>
                        </div>
                        <p className="text-gray-500 text-sm">
                          {formatDate(fund.startDate)} - {formatDate(fund.endDate)}
                        </p>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <Badge variant="outline">{fund.source}</Badge>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Fund Usage</span>
                        <span>
                          {formatCurrency(fund.totalAmount - fund.remainingAmount)} of {formatCurrency(fund.totalAmount)}
                        </span>
                      </div>
                      <Progress 
                        value={((fund.totalAmount - fund.remainingAmount) / fund.totalAmount) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Remaining: {formatCurrency(fund.remainingAmount)}</span>
                      <Button variant="ghost" size="sm" className="h-8 gap-1">
                        View Details <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important Tax Information</AlertTitle>
        <AlertDescription>
          Remember to keep track of all received funds for tax purposes. Different types of income may have different tax implications.
          <div className="mt-2">
            <Button variant="outline" size="sm">
              Download Annual Report
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export { FundDistributionDashboard } 