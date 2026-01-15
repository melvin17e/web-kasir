"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { stockApi, productApi, Product, StockMovement } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Loader2, Search } from "lucide-react"

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
    const [movements, setMovements] = useState<StockMovement[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showStockDialog, setShowStockDialog] = useState(false)
    const [stockType, setStockType] = useState<"in" | "out">("in")
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [quantity, setQuantity] = useState("")
    const [notes, setNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [productsData, lowStock, movementsData] = await Promise.all([
                productApi.getAll("limit=100"),
                stockApi.getLowStock(),
                stockApi.getMovements("limit=50")
            ])
            setProducts(productsData.products)
            setLowStockProducts(lowStock.products)
            setMovements(movementsData.movements)
        } catch (error) {
            console.error("Failed to load data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const openStockDialog = (product: Product, type: "in" | "out") => {
        setSelectedProduct(product)
        setStockType(type)
        setQuantity("")
        setNotes("")
        setShowStockDialog(true)
    }

    const handleStockSubmit = async () => {
        if (!selectedProduct || !quantity) return
        setIsSubmitting(true)
        try {
            const data = { productId: selectedProduct.id, quantity: parseInt(quantity), notes }
            if (stockType === "in") {
                await stockApi.stockIn(data)
            } else {
                await stockApi.stockOut(data)
            }
            setShowStockDialog(false)
            loadData()
        } catch (error) {
            alert(error instanceof Error ? error.message : "Gagal memproses stok")
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredProducts = products.filter(p =>
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery)
    )

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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Stok</h1>
                    <p className="text-gray-500">Kelola stok masuk dan keluar</p>
                </div>

                {/* Low Stock Alert */}
                {lowStockProducts.length > 0 && (
                    <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Peringatan Stok Menipis ({lowStockProducts.length} produk)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {lowStockProducts.slice(0, 10).map(p => (
                                    <Badge key={p.id} variant="warning" className="cursor-pointer" onClick={() => openStockDialog(p, "in")}>
                                        {p.name}: {p.stock} {p.unit}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Tabs defaultValue="products">
                    <TabsList>
                        <TabsTrigger value="products"><Package className="h-4 w-4 mr-2" />Daftar Stok</TabsTrigger>
                        <TabsTrigger value="history"><ArrowUpCircle className="h-4 w-4 mr-2" />Riwayat</TabsTrigger>
                    </TabsList>

                    <TabsContent value="products" className="mt-4 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Cari produk..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stok</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Min</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredProducts.map(p => (
                                                <tr key={p.id}>
                                                    <td className="px-4 py-3 font-medium">{p.name}</td>
                                                    <td className="px-4 py-3 text-center">{p.stock} {p.unit}</td>
                                                    <td className="px-4 py-3 text-center text-gray-500">{p.minStock}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge variant={p.stock === 0 ? "danger" : p.stock <= p.minStock ? "warning" : "success"}>
                                                            {p.stock === 0 ? "Habis" : p.stock <= p.minStock ? "Menipis" : "OK"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" variant="outline" onClick={() => openStockDialog(p, "in")}>
                                                                <ArrowDownCircle className="h-4 w-4 mr-1 text-green-500" />Masuk
                                                            </Button>
                                                            <Button size="sm" variant="outline" onClick={() => openStockDialog(p, "out")} disabled={p.stock === 0}>
                                                                <ArrowUpCircle className="h-4 w-4 mr-1 text-red-500" />Keluar
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipe</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {movements.map(m => (
                                                <tr key={m.id}>
                                                    <td className="px-4 py-3 text-gray-500">{formatDate(m.createdAt)}</td>
                                                    <td className="px-4 py-3 font-medium">{m.product?.name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge variant={m.type === "in" ? "success" : m.type === "out" ? "danger" : "default"}>
                                                            {m.type === "in" ? "Masuk" : m.type === "out" ? "Keluar" : "Adjustment"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-medium">{m.type === "in" ? "+" : "-"}{Math.abs(m.quantity)}</td>
                                                    <td className="px-4 py-3 text-gray-500">{m.notes || "-"}</td>
                                                    <td className="px-4 py-3 text-gray-500">{m.user?.fullName}</td>
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

            {/* Stock Dialog */}
            <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {stockType === "in" ? <ArrowDownCircle className="h-5 w-5 text-green-500" /> : <ArrowUpCircle className="h-5 w-5 text-red-500" />}
                            Stok {stockType === "in" ? "Masuk" : "Keluar"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <p className="font-medium">{selectedProduct?.name}</p>
                            <p className="text-sm text-gray-500">Stok saat ini: {selectedProduct?.stock} {selectedProduct?.unit}</p>
                        </div>
                        <div>
                            <Label>Jumlah *</Label>
                            <Input type="number" min="1" max={stockType === "out" ? selectedProduct?.stock : undefined} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                        </div>
                        <div>
                            <Label>Keterangan</Label>
                            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsional" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStockDialog(false)}>Batal</Button>
                        <Button onClick={handleStockSubmit} disabled={isSubmitting || !quantity} variant={stockType === "in" ? "success" : "destructive"}>
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {stockType === "in" ? "Tambah Stok" : "Kurangi Stok"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
