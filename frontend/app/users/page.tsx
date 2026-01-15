"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { userApi, User } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { Plus, Edit, Trash2, Key, Loader2, Users, Shield, User as UserIcon } from "lucide-react"

export default function UsersPage() {
    const { user: currentUser } = useAuthStore()
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [showResetPassword, setShowResetPassword] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [formData, setFormData] = useState({
        username: "", email: "", password: "", fullName: "", role: "cashier"
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const data = await userApi.getAll()
            setUsers(data.users)
        } catch (error) {
            console.error("Failed to load users:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const openCreateForm = () => {
        setSelectedUser(null)
        setFormData({ username: "", email: "", password: "", fullName: "", role: "cashier" })
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await userApi.create(formData)
            setShowForm(false)
            loadData()
        } catch (error) {
            alert(error instanceof Error ? error.message : "Gagal menyimpan user")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResetPassword = async () => {
        if (!selectedUser || !newPassword) return
        setIsSubmitting(true)
        try {
            await userApi.resetPassword(selectedUser.id, newPassword)
            setShowResetPassword(false)
            setNewPassword("")
            alert("Password berhasil direset")
        } catch (error) {
            alert(error instanceof Error ? error.message : "Gagal reset password")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggleActive = async (user: User) => {
        try {
            await userApi.update(user.id, { isActive: !user.isActive })
            loadData()
        } catch (error) {
            alert("Gagal mengubah status user")
        }
    }

    const handleDelete = async (user: User) => {
        if (user.id === currentUser?.id) {
            alert("Tidak dapat menghapus diri sendiri")
            return
        }
        if (!confirm(`Hapus user "${user.username}"?`)) return
        try {
            await userApi.delete(user.id)
            loadData()
        } catch (error) {
            alert(error instanceof Error ? error.message : "Gagal menghapus user")
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
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengguna</h1>
                        <p className="text-gray-500">Kelola akun pengguna sistem</p>
                    </div>
                    <Button onClick={openCreateForm}><Plus className="h-4 w-4 mr-2" />Tambah User</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map(user => (
                        <Card key={user.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-medium">
                                        {user.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">{user.fullName}</p>
                                            {user.id === currentUser?.id && <Badge variant="info">Anda</Badge>}
                                        </div>
                                        <p className="text-sm text-gray-500">@{user.username}</p>
                                        <p className="text-xs text-gray-400">{user.email}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant={user.role === "admin" ? "info" : "default"}>
                                                {user.role === "admin" ? <Shield className="h-3 w-3 mr-1" /> : <UserIcon className="h-3 w-3 mr-1" />}
                                                {user.role}
                                            </Badge>
                                            <Badge variant={user.isActive ? "success" : "danger"}>
                                                {user.isActive ? "Aktif" : "Nonaktif"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4 pt-4 border-t">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleToggleActive(user)}>
                                        {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => { setSelectedUser(user); setShowResetPassword(true) }}>
                                        <Key className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(user)} disabled={user.id === currentUser?.id}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Create User Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Tambah User Baru</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><Label>Nama Lengkap *</Label><Input required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} /></div>
                        <div><Label>Username *</Label><Input required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} /></div>
                        <div><Label>Email *</Label><Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                        <div><Label>Password *</Label><Input type="password" required minLength={6} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
                        <div>
                            <Label>Role *</Label>
                            <select className="w-full h-10 rounded-lg border px-3" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                <option value="cashier">Kasir</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
                    <p className="text-gray-500">Reset password untuk: <strong>{selectedUser?.fullName}</strong></p>
                    <div><Label>Password Baru</Label><Input type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResetPassword(false)}>Batal</Button>
                        <Button onClick={handleResetPassword} disabled={isSubmitting || !newPassword}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Reset</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
