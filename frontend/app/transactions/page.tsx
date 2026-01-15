"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { transactionApi, Transaction } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Search, Eye, Printer, Receipt } from "lucide-react"

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [showDetail, setShowDetail] = useState(false)

    useEffect(() => {
        loadData()
    }, [startDate, endDate])

    const loadData = async () => {
        try {
            let params = "limit=100"
            if (startDate) params += `&startDate=${startDate}`
            if (endDate) params += `&endDate=${endDate}`

            const data = await transactionApi.getAll(params)
            setTransactions(data.transactions)
        } catch (error) {
            console.error("Failed to load transactions:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredTransactions = transactions.filter(tx =>
        searchQuery === "" || tx.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const viewDetail = async (tx: Transaction) => {
        try {
            const data = await transactionApi.getById(tx.id)
            setSelectedTransaction(data.transaction)
            setShowDetail(true)
        } catch (error) {
            console.error("Failed to load transaction detail:", error)
        }
    }

    const printReceipt = () => {
        window.print()
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaksi</h1>
                    <p className="text-gray-500 dark:text-gray-400">Riwayat transaksi penjualan</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Cari invoice..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Input
                        type="date"
                        className="w-40"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                        type="date"
                        className="w-40"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                {/* Transactions Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kasir</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Metode</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {filteredTransactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3">
                                                <span className="font-mono font-medium text-gray-900 dark:text-white">
                                                    {tx.invoiceNo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{formatDate(tx.createdAt)}</td>
                                            <td className="px-4 py-3 text-gray-500">{tx.user?.fullName || "-"}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={tx.paymentMethod === "cash" ? "success" : tx.paymentMethod === "qris" ? "info" : "default"}>
                                                    {tx.paymentMethod.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(tx.total)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={tx.status === "completed" ? "success" : "danger"}>
                                                    {tx.status === "completed" ? "Selesai" : "Batal"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => viewDetail(tx)}>
                                                    <Eye className="h-4 w-4 mr-1" /> Detail
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredTransactions.length === 0 && (
                                <p className="text-center py-8 text-gray-500">Tidak ada transaksi</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction Detail Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Detail Transaksi
                        </DialogTitle>
                    </DialogHeader>

                    {selectedTransaction && (
                        <div className="space-y-4">
                            {/* Invoice Info */}
                            <div className="text-center border-b pb-4">
                                <p className="text-lg font-mono font-bold">{selectedTransaction.invoiceNo}</p>
                                <p className="text-sm text-gray-500">{formatDate(selectedTransaction.createdAt)}</p>
                                <p className="text-sm text-gray-500">Kasir: {selectedTransaction.user?.fullName}</p>
                            </div>

                            {/* Items */}
                            <div className="space-y-2">
                                {selectedTransaction.items?.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <div>
                                            <p>{item.productName}</p>
                                            <p className="text-gray-500">
                                                {item.quantity} x {formatCurrency(item.price)}
                                                {item.discount > 0 && ` (-${item.discount}%)`}
                                            </p>
                                        </div>
                                        <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="border-t pt-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                                </div>
                                {selectedTransaction.discountAmount > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Diskon ({selectedTransaction.discountPercent}%)</span>
                                        <span>-{formatCurrency(selectedTransaction.discountAmount)}</span>
                                    </div>
                                )}
                                {selectedTransaction.taxAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span>Pajak ({selectedTransaction.taxPercent}%)</span>
                                        <span>{formatCurrency(selectedTransaction.taxAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <span>Total</span>
                                    <span className="text-blue-600">{formatCurrency(selectedTransaction.total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Bayar ({selectedTransaction.paymentMethod.toUpperCase()})</span>
                                    <span>{formatCurrency(selectedTransaction.paidAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Kembalian</span>
                                    <span>{formatCurrency(selectedTransaction.changeAmount)}</span>
                                </div>
                            </div>

                            <Button className="w-full" onClick={printReceipt}>
                                <Printer className="h-4 w-4 mr-2" /> Cetak Struk
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
