"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { productApi, categoryApi, Product, Category } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Package,
    Loader2

} from "lucide-react"

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        barcode: "",
        sku: "",
        categoryId: "",
        buyPrice: "",
        sellPrice: "",
        discount: "0",
        stock: "0",
        minStock: "5",
        unit: "pcs",
        description: ""
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [productsData, categoriesData] = await Promise.all([
                productApi.getAll("limit=100"),
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

    const filteredProducts = products.filter(p => {
        const matchesSearch = searchQuery === "" ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode?.includes(searchQuery)
        const matchesCategory = selectedCategory === "" || p.categoryId === parseInt(selectedCategory)
        return matchesSearch && matchesCategory
    })

    const openCreateForm = () => {
        setEditingProduct(null)
        setFormData({
            name: "",
            barcode: "",
            sku: "",
            categoryId: categories[0]?.id.toString() || "",
            buyPrice: "",
            sellPrice: "",
            discount: "0",
            stock: "0",
            minStock: "5",
            unit: "pcs",
            description: ""
        })
        setShowForm(true)
    }

    const openEditForm = (product: Product) => {
        setEditingProduct(product)
        setFormData({
            name: product.name,
            barcode: product.barcode || "",
            sku: product.sku || "",
            categoryId: product.categoryId.toString(),
            buyPrice: product.buyPrice.toString(),
            sellPrice: product.sellPrice.toString(),
            discount: product.discount.toString(),
            stock: product.stock.toString(),
            minStock: product.minStock.toString(),
            unit: product.unit,
            description: product.description || ""
        })
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const data = new FormData()
            data.append("name", formData.name)
            data.append("barcode", formData.barcode)
            data.append("sku", formData.sku)
            data.append("categoryId", formData.categoryId)
            data.append("buyPrice", formData.buyPrice)
            data.append("sellPrice", formData.sellPrice)
            data.append("discount", formData.discount)
            data.append("stock", formData.stock)
            data.append("minStock", formData.minStock)
            data.append("unit", formData.unit)
            data.append("description", formData.description)

            if (editingProduct) {
                await productApi.update(editingProduct.id, data)
            } else {
                await productApi.create(data)
            }

            setShowForm(false)
            loadData()
        } catch (error) {
            alert(error instanceof Error ? error.message : "Gagal menyimpan produk")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (product: Product) => {
        if (!confirm(`Hapus produk "${product.name}"?`)) return

        try {
            await productApi.delete(product.id)
            loadData()
        } catch (error) {
            alert(error instanceof Error ? error.message : "Gagal menghapus produk")
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produk</h1>
                        <p className="text-gray-500 dark:text-gray-400">Kelola produk toko Anda</p>
                    </div>
                    <Button onClick={openCreateForm} className="gap-2">
                        <Plus className="h-5 w-5" />
                        Tambah Produk
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Cari produk..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-10 rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-900"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Products Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga Beli</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga Jual</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stok</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                                        {product.image ? (
                                                            <img src={`http://localhost:5000${product.image}`} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <Package className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                                                        <p className="text-xs text-gray-500">{product.barcode || "-"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge style={{ backgroundColor: product.category?.color }}>
                                                    {product.category?.name}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(product.buyPrice)}</td>
                                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(product.sellPrice)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={product.stock <= product.minStock ? "warning" : "default"}>
                                                    {product.stock} {product.unit}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={product.isActive ? "success" : "danger"}>
                                                    {product.isActive ? "Aktif" : "Nonaktif"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon-sm" onClick={() => openEditForm(product)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(product)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredProducts.length === 0 && (
                                <p className="text-center py-8 text-gray-500">Tidak ada produk ditemukan</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Product Form Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label>Nama Produk *</Label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Barcode</Label>
                                <Input
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>SKU</Label>
                                <Input
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                />
                            </div>

                            <div className="col-span-2">
                                <Label>Kategori *</Label>
                                <select
                                    required
                                    className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-900"
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label>Harga Beli *</Label>
                                <Input
                                    type="number"
                                    required
                                    value={formData.buyPrice}
                                    onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Harga Jual *</Label>
                                <Input
                                    type="number"
                                    required
                                    value={formData.sellPrice}
                                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Diskon (%)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.discount}
                                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Stok</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Stok Minimum</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.minStock}
                                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Satuan</Label>
                                <Input
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
