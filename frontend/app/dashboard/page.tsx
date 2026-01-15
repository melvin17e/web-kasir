"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { dashboardApi, DashboardStats, ChartData } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
    TrendingUp,
    ShoppingBag,
    Package,
    AlertTriangle,
    ArrowRight,
    BarChart3
} from "lucide-react"
import Link from "next/link"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts"

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [chartData, setChartData] = useState<ChartData[]>([])
    const [chartPeriod, setChartPeriod] = useState<string>("week")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        loadChartData()
    }, [chartPeriod])

    const loadData = async () => {
        try {
            const data = await dashboardApi.getStats()
            setStats(data)
        } catch (error) {
            console.error("Failed to load stats:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const loadChartData = async () => {
        try {
            const data = await dashboardApi.getSalesChart(chartPeriod)
            setChartData(data.chartData)
        } catch (error) {
            console.error("Failed to load chart data:", error)
        }
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400">Ringkasan aktivitas bisnis Anda</p>
                    </div>
                    <Link href="/pos">
                        <Button size="lg" className="gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            Buka Kasir
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Penjualan Hari Ini</p>
                                    <p className="text-2xl font-bold mt-1">{formatCurrency(stats?.todaySales || 0)}</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Transaksi Hari Ini</p>
                                    <p className="text-2xl font-bold mt-1">{stats?.todayTransactions || 0}</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <ShoppingBag className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Total Produk</p>
                                    <p className="text-2xl font-bold mt-1">{stats?.totalProducts || 0}</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Package className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`border-0 ${(stats?.lowStockCount || 0) > 0 ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'}`}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm ${(stats?.lowStockCount || 0) > 0 ? 'text-amber-100' : 'text-gray-100'}`}>Stok Menipis</p>
                                    <p className="text-2xl font-bold mt-1">{stats?.lowStockCount || 0}</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts and Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sales Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                Grafik Penjualan
                            </CardTitle>
                            <div className="flex gap-2">
                                {["week", "month", "year"].map((period) => (
                                    <Button
                                        key={period}
                                        variant={chartPeriod === period ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setChartPeriod(period)}
                                    >
                                        {period === "week" ? "7 Hari" : period === "month" ? "30 Hari" : "1 Tahun"}
                                    </Button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                                        <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1F2937",
                                                border: "none",
                                                borderRadius: "8px",
                                                color: "#fff"
                                            }}
                                            formatter={(value) => [
                                                formatCurrency(Number(value ?? 0)),
                                                "Penjualan"
                                            ]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorSales)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Produk Terlaris</CardTitle>
                            <Link href="/reports" className="text-sm text-blue-600 hover:underline">
                                Lihat Semua
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats?.topProducts && stats.topProducts.length > 0 ? (
                                    stats.topProducts.map((product, index) => (
                                        <div key={product.id} className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {product.totalSold} terjual
                                                </p>
                                            </div>
                                            <Badge variant="success">{formatCurrency(product.sellPrice)}</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">Belum ada data</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Transaksi Terbaru</CardTitle>
                        <Link href="/transactions">
                            <Button variant="ghost" size="sm" className="gap-1">
                                Lihat Semua <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-800">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Invoice
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Waktu
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Kasir
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Metode
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                                        stats.recentTransactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                    {tx.invoiceNo}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {formatDate(tx.createdAt)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {tx.user?.fullName || "-"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={tx.paymentMethod === "cash" ? "success" : "info"}>
                                                        {tx.paymentMethod.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-white">
                                                    {formatCurrency(tx.total)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                Belum ada transaksi
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
