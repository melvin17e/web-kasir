"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { reportApi, SalesReport, StockReport } from "@/lib/api"
import { formatCurrency, formatDateOnly } from "@/lib/utils"
import { FileText, Download, TrendingUp, Package, DollarSign } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

export default function ReportsPage() {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        return d.toISOString().split("T")[0]
    })
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0])
    const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
    const [stockReport, setStockReport] = useState<StockReport | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadReports()
    }, [startDate, endDate])

    const loadReports = async () => {
        setIsLoading(true)
        try {
            const [sales, stock] = await Promise.all([
                reportApi.getSales(startDate, endDate),
                reportApi.getStock()
            ])
            setSalesReport(sales)
            setStockReport(stock)
        } catch (error) {
            console.error("Failed to load reports:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const exportCSV = async (type: string) => {
        try {
            const data = await reportApi.export(type, startDate, endDate)
            const csv = [data.headers.join(","), ...data.data.map(row => data.headers.map(h => row[h]).join(","))].join("\n")
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = data.filename
            a.click()
        } catch (error) {
            alert("Export gagal")
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
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan</h1>
                        <p className="text-gray-500">Analisis penjualan dan stok</p>
                    </div>
                    <div className="flex gap-2">
                        <Input type="date" className="w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <Input type="date" className="w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>

                <Tabs defaultValue="sales">
                    <TabsList>
                        <TabsTrigger value="sales"><TrendingUp className="h-4 w-4 mr-2" />Penjualan</TabsTrigger>
                        <TabsTrigger value="stock"><Package className="h-4 w-4 mr-2" />Stok</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sales" className="space-y-6 mt-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-500">Total Penjualan</p>
                                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(salesReport?.summary.totalSales || 0)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-500">Total HPP</p>
                                    <p className="text-2xl font-bold">{formatCurrency(salesReport?.summary.totalCost || 0)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-500">Laba Kotor</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(salesReport?.summary.grossProfit || 0)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-500">Jumlah Transaksi</p>
                                    <p className="text-2xl font-bold">{salesReport?.summary.transactionCount || 0}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Chart */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Grafik Penjualan Harian</CardTitle>
                                <Button variant="outline" size="sm" onClick={() => exportCSV("sales")}>
                                    <Download className="h-4 w-4 mr-2" />Export CSV
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer>
                                        <BarChart data={salesReport?.dailyData || []}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" fontSize={12} />
                                            <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                            <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="stock" className="space-y-6 mt-4">
                        {/* Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-500">Total Produk</p>
                                    <p className="text-2xl font-bold">{stockReport?.summary.totalProducts || 0}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-sm text-gray-500">Nilai Stok</p>
                                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(stockReport?.summary.totalStockValue || 0)}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-amber-50 dark:bg-amber-900/20">
                                <CardContent className="p-4">
                                    <p className="text-sm text-amber-600">Stok Menipis</p>
                                    <p className="text-2xl font-bold text-amber-600">{stockReport?.summary.lowStockCount || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-red-50 dark:bg-red-900/20">
                                <CardContent className="p-4">
                                    <p className="text-sm text-red-600">Stok Habis</p>
                                    <p className="text-2xl font-bold text-red-600">{stockReport?.summary.outOfStockCount || 0}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Stock Table */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Daftar Stok Produk</CardTitle>
                                <Button variant="outline" size="sm" onClick={() => exportCSV("stock")}>
                                    <Download className="h-4 w-4 mr-2" />Export CSV
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stok</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nilai</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {stockReport?.products.slice(0, 20).map((p: any) => (
                                                <tr key={p.id}>
                                                    <td className="px-4 py-3">{p.name}</td>
                                                    <td className="px-4 py-3 text-center">{p.stock} {p.unit}</td>
                                                    <td className="px-4 py-3 text-right">{formatCurrency(p.stockValue)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge variant={p.status === "out" ? "danger" : p.status === "low" ? "warning" : "success"}>
                                                            {p.status === "out" ? "Habis" : p.status === "low" ? "Menipis" : "OK"}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
