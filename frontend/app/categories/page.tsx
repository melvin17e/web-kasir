"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { categoryApi, Category } from "@/lib/api"
import { Plus, Edit, Trash2, Loader2, FolderTree } from "lucide-react"

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({ name: "", description: "", color: "#3B82F6" })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const data = await categoryApi.getAll()
            setCategories(data.categories)
        } catch (error) {
            console.error("Failed to load categories:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const openCreateForm = () => {
        setEditingCategory(null)
        setFormData({ name: "", description: "", color: "#3B82F6" })
        setShowForm(true)
    }

    const openEditForm = (category: Category) => {
        setEditingCategory(category)
        setFormData({ name: category.name, description: category.description || "", color: category.color })
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            if (editingCategory) {
                await categoryApi.update(editingCategory.id, formData)
            } else {
                await categoryApi.create(formData)
            }
            setShowForm(false)
            loadData()
        } catch (error) {
            alert(error instanceof Error ? error.message : "Gagal menyimpan kategori")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (category: Category) => {
        if (!confirm(`Hapus kategori "${category.name}"?`)) return
        try {
            await categoryApi.delete(category.id)
            loadData()
        } catch (error) {
            alert(error instanceof Error ? error.message : "Gagal menghapus kategori")
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
                <div className="flex justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kategori</h1>
                        <p className="text-gray-500">Kelola kategori produk</p>
                    </div>
                    <Button onClick={openCreateForm}><Plus className="h-4 w-4 mr-2" />Tambah Kategori</Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map(cat => (
                        <Card key={cat.id}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color }}>
                                        <FolderTree className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{cat.name}</CardTitle>
                                        <p className="text-xs text-gray-500">{cat._count?.products || 0} produk</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-sm text-gray-500 mb-3">{cat.description || "Tidak ada deskripsi"}</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditForm(cat)}>
                                        <Edit className="h-4 w-4 mr-1" />Edit
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(cat)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Nama *</Label>
                            <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <Label>Deskripsi</Label>
                            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div>
                            <Label>Warna</Label>
                            <div className="flex gap-2">
                                <Input type="color" className="w-14 h-10 p-1" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                                <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
