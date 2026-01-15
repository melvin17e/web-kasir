"use client"

import { useEffect, useState, useRef } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { productApi, transactionApi, categoryApi, Product, Category } from "@/lib/api"
import { useCartStore, CartItem } from "@/store/cartStore"
import { formatCurrency } from "@/lib/utils"
import {
    Search,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    QrCode,
    Printer,
    ShoppingCart,
    X,
    Check,
    Loader2
} from "lucide-react"

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [showPayment, setShowPayment] = useState(false)
    const [showReceipt, setShowReceipt] = useState(false)
    const [receiptData, setReceiptData] = useState<{ invoiceNo: string; id: number } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const searchRef = useRef<HTMLInputElement>(null)

    const {
        items,
        addItem,
        removeItem,
        updateQuantity,
        discountPercent,
        setDiscountPercent,
        taxPercent,
        setTaxPercent,
        paymentMethod,
        setPaymentMethod,
        paidAmount,
        setPaidAmount,
        clearCart,
        getSubtotal,
        getDiscountAmount,
        getTaxAmount,
        getTotal,
        getChange
    } = useCartStore()

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        // Keyboard shortcut: F2 to focus search
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "F2") {
                e.preventDefault()
                searchRef.current?.focus()
            }
            if (e.key === "F12" && items.length > 0) {
                e.preventDefault()
                setShowPayment(true)
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [items])

    const loadData = async () => {
        try {
            const [productsData, categoriesData] = await Promise.all([
                productApi.getAll("isActive=true&limit=100"),
                categoryApi.getAll()
            ])
            setProducts(productsData.products)
            setCategories(categoriesData.categories)
        } catch (error) {
            console.error("Failed to load data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleBarcodeSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            try {
                const { product } = await productApi.getByBarcode(searchQuery.trim())
                if (product) {
                    addItem(product)
                    setSearchQuery("")
                }
            } catch {
                // Not found by barcode, search by name
            }
        }
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = searchQuery === "" ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode?.includes(searchQuery)
        const matchesCategory = selectedCategory === null || p.categoryId === selectedCategory
        return matchesSearch && matchesCategory && p.stock > 0
    })

    const handlePayment = async () => {
        if (paidAmount < getTotal()) return

        setIsProcessing(true)
        try {
            const { transaction } = await transactionApi.create({
                items: items.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    discount: item.discount
                })),
                discountPercent,
                taxPercent,
                paidAmount,
                paymentMethod,
                notes: ""
            })

            setReceiptData({ invoiceNo: transaction.invoiceNo, id: transaction.id })
            setShowPayment(false)
            setShowReceipt(true)
            clearCart()
            loadData() // Refresh product stock
        } catch (error) {
            console.error("Payment failed:", error)
            alert(error instanceof Error ? error.message : "Pembayaran gagal")
        } finally {
            setIsProcessing(false)
        }
    }

    const quickPay = (amount: number) => {
        setPaidAmount(amount)
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
            <div className="h-[calc(100vh-4rem)] flex gap-4">
                {/* Products Section */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Search and Categories */}
                    <div className="space-y-4 mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                ref={searchRef}
                                type="text"
                                placeholder="Cari produk atau scan barcode... (F2)"
                                className="pl-10 h-12 text-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleBarcodeSearch}
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <Button
                                variant={selectedCategory === null ? "default" : "outline"}
                                onClick={() => setSelectedCategory(null)}
                                className="whitespace-nowrap"
                            >
                                Semua
                            </Button>
                            {categories.map(cat => (
                                <Button
                                    key={cat.id}
                                    variant={selectedCategory === cat.id ? "default" : "outline"}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className="whitespace-nowrap"
                                    style={{
                                        backgroundColor: selectedCategory === cat.id ? cat.color : undefined,
                                        borderColor: cat.color
                                    }}
                                >
                                    {cat.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addItem(product)}
                                    disabled={product.stock <= 0}
                                    className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-3 text-left transition-all hover:border-blue-500 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {product.image ? (
                                        <img
                                            src={`http://localhost:5000${product.image}`}
                                            alt={product.name}
                                            className="h-24 w-full rounded-lg object-cover mb-2"
                                        />
                                    ) : (
                                        <div className="h-24 w-full rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                                            <ShoppingCart className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                                        {product.name}
                                    </p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {formatCurrency(product.sellPrice)}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-2">
                                        <Badge variant={product.stock <= product.minStock ? "warning" : "default"}>
                                            Stok: {product.stock}
                                        </Badge>
                                        {product.discount > 0 && (
                                            <Badge variant="danger">-{product.discount}%</Badge>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-blue-600/80 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Plus className="h-12 w-12 text-white" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cart Section */}
                <Card className="w-96 flex flex-col">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Keranjang
                            </span>
                            {items.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearCart}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
                                <p>Keranjang kosong</p>
                                <p className="text-sm">Pilih produk untuk memulai</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <CartItemRow
                                        key={item.product.id}
                                        item={item}
                                        onUpdateQuantity={updateQuantity}
                                        onRemove={removeItem}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>

                    {/* Cart Footer */}
                    <div className="border-t p-4 space-y-3">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium">{formatCurrency(getSubtotal())}</span>
                            </div>
                            {discountPercent > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>Diskon ({discountPercent}%)</span>
                                    <span>-{formatCurrency(getDiscountAmount())}</span>
                                </div>
                            )}
                            {taxPercent > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Pajak ({taxPercent}%)</span>
                                    <span>{formatCurrency(getTaxAmount())}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total</span>
                                <span className="text-blue-600">{formatCurrency(getTotal())}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 text-lg"
                            size="xl"
                            disabled={items.length === 0}
                            onClick={() => setShowPayment(true)}
                        >
                            <CreditCard className="h-5 w-5 mr-2" />
                            Bayar (F12)
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Payment Dialog */}
            <Dialog open={showPayment} onOpenChange={setShowPayment}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pembayaran</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="text-center py-4 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Pembayaran</p>
                            <p className="text-3xl font-bold text-blue-600">{formatCurrency(getTotal())}</p>
                        </div>

                        {/* Discount & Tax */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm text-gray-500">Diskon (%)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={discountPercent}
                                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Pajak (%)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={taxPercent}
                                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <Tabs defaultValue={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                            <TabsList className="w-full">
                                <TabsTrigger value="cash" className="flex-1 gap-2">
                                    <Banknote className="h-4 w-4" /> Tunai
                                </TabsTrigger>
                                <TabsTrigger value="qris" className="flex-1 gap-2">
                                    <QrCode className="h-4 w-4" /> QRIS
                                </TabsTrigger>
                                <TabsTrigger value="transfer" className="flex-1 gap-2">
                                    <CreditCard className="h-4 w-4" /> Transfer
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="cash" className="space-y-3 mt-4">
                                <div>
                                    <label className="text-sm text-gray-500">Jumlah Bayar</label>
                                    <Input
                                        type="number"
                                        className="h-14 text-xl text-center font-bold"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[getTotal(), 50000, 100000, 200000].map((amount) => (
                                        <Button
                                            key={amount}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => quickPay(amount)}
                                        >
                                            {amount === getTotal() ? "Pas" : formatCurrency(amount).replace("Rp", "")}
                                        </Button>
                                    ))}
                                </div>
                                {paidAmount >= getTotal() && (
                                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-center">
                                        <p className="text-sm text-gray-500">Kembalian</p>
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(getChange())}</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="qris" className="mt-4">
                                <div className="text-center py-8">
                                    <QrCode className="h-32 w-32 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-500">QR Code akan ditampilkan di sini</p>
                                    <Button
                                        className="mt-4"
                                        variant="outline"
                                        onClick={() => setPaidAmount(getTotal())}
                                    >
                                        Konfirmasi Pembayaran
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="transfer" className="mt-4">
                                <div className="text-center py-8">
                                    <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-500 mb-2">Transfer ke rekening:</p>
                                    <p className="font-mono text-lg font-bold">1234567890</p>
                                    <p className="text-sm text-gray-400">Bank BCA - POS System</p>
                                    <Button
                                        className="mt-4"
                                        variant="outline"
                                        onClick={() => setPaidAmount(getTotal())}
                                    >
                                        Konfirmasi Pembayaran
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPayment(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={handlePayment}
                            disabled={paidAmount < getTotal() || isProcessing}
                            className="gap-2"
                        >
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                            Proses Pembayaran
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Receipt Dialog */}
            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogContent className="max-w-sm">
                    <div className="text-center py-8">
                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-4">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Transaksi Berhasil!</h2>
                        <p className="text-gray-500 mb-4">{receiptData?.invoiceNo}</p>
                        <div className="flex gap-2 justify-center">
                            <Button variant="outline" onClick={() => setShowReceipt(false)}>
                                <X className="h-4 w-4 mr-2" />
                                Tutup
                            </Button>
                            <Button onClick={() => window.print()}>
                                <Printer className="h-4 w-4 mr-2" />
                                Cetak Struk
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}

function CartItemRow({
    item,
    onUpdateQuantity,
    onRemove
}: {
    item: CartItem
    onUpdateQuantity: (id: number, qty: number) => void
    onRemove: (id: number) => void
}) {
    const itemTotal = item.product.sellPrice * (1 - item.discount / 100) * item.quantity

    return (
        <div className="flex gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.product.name}
                </p>
                <p className="text-xs text-gray-500">
                    {formatCurrency(item.product.sellPrice)}
                    {item.discount > 0 && <span className="text-red-500 ml-1">-{item.discount}%</span>}
                </p>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                >
                    <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>

            <div className="text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(itemTotal)}
                </p>
                <button
                    onClick={() => onRemove(item.product.id)}
                    className="text-xs text-red-500 hover:underline"
                >
                    Hapus
                </button>
            </div>
        </div>
    )
}
