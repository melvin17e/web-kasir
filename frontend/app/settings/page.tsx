"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Settings,
    Store,
    QrCode,
    CreditCard,
    Percent,
    Printer,
    Save,
    Loader2,
    Check
} from "lucide-react"

interface SettingsData {
    // Store Info
    store_name: string
    store_address: string
    store_phone: string
    store_email: string

    // Tax
    tax_enabled: string
    tax_percentage: string

    // QRIS
    qris_enabled: string
    qris_name: string
    qris_nmid: string

    // Bank Transfer
    bank_enabled: string
    bank_name: string
    bank_account_number: string
    bank_account_name: string

    // Bank 2
    bank2_enabled: string
    bank2_name: string
    bank2_account_number: string
    bank2_account_name: string

    // E-Wallet
    ewallet_enabled: string
    ewallet_type: string
    ewallet_number: string
    ewallet_name: string

    // Receipt
    receipt_footer: string
    receipt_show_logo: string
}

const defaultSettings: SettingsData = {
    store_name: "POS System",
    store_address: "Jl. Contoh No. 123",
    store_phone: "021-1234567",
    store_email: "info@pos-system.com",
    tax_enabled: "false",
    tax_percentage: "11",
    qris_enabled: "true",
    qris_name: "POS SYSTEM",
    qris_nmid: "",
    bank_enabled: "true",
    bank_name: "BCA",
    bank_account_number: "1234567890",
    bank_account_name: "POS SYSTEM",
    bank2_enabled: "false",
    bank2_name: "BRI",
    bank2_account_number: "",
    bank2_account_name: "",
    ewallet_enabled: "false",
    ewallet_type: "DANA",
    ewallet_number: "",
    ewallet_name: "",
    receipt_footer: "Terima kasih telah berbelanja!",
    receipt_show_logo: "true"
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingsData>(defaultSettings)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            // Load from localStorage for now (can be moved to API later)
            const saved = localStorage.getItem("pos_settings")
            if (saved) {
                setSettings({ ...defaultSettings, ...JSON.parse(saved) })
            }
        } catch (error) {
            console.error("Failed to load settings:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Save to localStorage
            localStorage.setItem("pos_settings", JSON.stringify(settings))
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (error) {
            alert("Gagal menyimpan pengaturan")
        } finally {
            setIsSaving(false)
        }
    }

    const updateSetting = (key: keyof SettingsData, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }))
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
            <div className="space-y-6 max-w-4xl">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Settings className="h-6 w-6" />
                            Pengaturan
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Konfigurasi toko dan pembayaran</p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : saved ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {saved ? "Tersimpan!" : "Simpan Pengaturan"}
                    </Button>
                </div>

                <Tabs defaultValue="store" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="store" className="gap-2">
                            <Store className="h-4 w-4" /> Toko
                        </TabsTrigger>
                        <TabsTrigger value="payment" className="gap-2">
                            <CreditCard className="h-4 w-4" /> Pembayaran
                        </TabsTrigger>
                        <TabsTrigger value="tax" className="gap-2">
                            <Percent className="h-4 w-4" /> Pajak
                        </TabsTrigger>
                        <TabsTrigger value="receipt" className="gap-2">
                            <Printer className="h-4 w-4" /> Struk
                        </TabsTrigger>
                    </TabsList>

                    {/* Store Settings */}
                    <TabsContent value="store">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Toko</CardTitle>
                                <CardDescription>Data ini akan ditampilkan di struk pembayaran</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Nama Toko</Label>
                                        <Input
                                            value={settings.store_name}
                                            onChange={(e) => updateSetting("store_name", e.target.value)}
                                            placeholder="Nama toko Anda"
                                        />
                                    </div>
                                    <div>
                                        <Label>No. Telepon</Label>
                                        <Input
                                            value={settings.store_phone}
                                            onChange={(e) => updateSetting("store_phone", e.target.value)}
                                            placeholder="021-1234567"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Alamat</Label>
                                        <Input
                                            value={settings.store_address}
                                            onChange={(e) => updateSetting("store_address", e.target.value)}
                                            placeholder="Alamat lengkap toko"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={settings.store_email}
                                            onChange={(e) => updateSetting("store_email", e.target.value)}
                                            placeholder="email@toko.com"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Payment Settings */}
                    <TabsContent value="payment" className="space-y-4">
                        {/* QRIS */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                            <QrCode className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">QRIS</CardTitle>
                                            <CardDescription>Pembayaran via scan QR code</CardDescription>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.qris_enabled === "true"}
                                            onChange={(e) => updateSetting("qris_enabled", e.target.checked ? "true" : "false")}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </CardHeader>
                            {settings.qris_enabled === "true" && (
                                <CardContent className="space-y-4 border-t pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Nama Merchant QRIS</Label>
                                            <Input
                                                value={settings.qris_name}
                                                onChange={(e) => updateSetting("qris_name", e.target.value)}
                                                placeholder="Nama yang muncul di QRIS"
                                            />
                                        </div>
                                        <div>
                                            <Label>NMID (Opsional)</Label>
                                            <Input
                                                value={settings.qris_nmid}
                                                onChange={(e) => updateSetting("qris_nmid", e.target.value)}
                                                placeholder="ID Merchant QRIS"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        💡 QR Code dapat diupload melalui pengaturan printer atau ditampilkan dari provider pembayaran Anda.
                                    </p>
                                </CardContent>
                            )}
                        </Card>

                        {/* Bank Transfer 1 */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                            <CreditCard className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Transfer Bank 1</CardTitle>
                                            <CardDescription>Rekening bank utama</CardDescription>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.bank_enabled === "true"}
                                            onChange={(e) => updateSetting("bank_enabled", e.target.checked ? "true" : "false")}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </CardHeader>
                            {settings.bank_enabled === "true" && (
                                <CardContent className="space-y-4 border-t pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label>Nama Bank</Label>
                                            <select
                                                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-900"
                                                value={settings.bank_name}
                                                onChange={(e) => updateSetting("bank_name", e.target.value)}
                                            >
                                                <option value="BCA">BCA</option>
                                                <option value="BRI">BRI</option>
                                                <option value="BNI">BNI</option>
                                                <option value="Mandiri">Mandiri</option>
                                                <option value="CIMB">CIMB Niaga</option>
                                                <option value="Permata">Permata</option>
                                                <option value="BSI">BSI</option>
                                                <option value="Danamon">Danamon</option>
                                                <option value="Other">Lainnya</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Nomor Rekening</Label>
                                            <Input
                                                value={settings.bank_account_number}
                                                onChange={(e) => updateSetting("bank_account_number", e.target.value)}
                                                placeholder="1234567890"
                                            />
                                        </div>
                                        <div>
                                            <Label>Atas Nama</Label>
                                            <Input
                                                value={settings.bank_account_name}
                                                onChange={(e) => updateSetting("bank_account_name", e.target.value)}
                                                placeholder="Nama pemilik rekening"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Bank Transfer 2 */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                            <CreditCard className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Transfer Bank 2</CardTitle>
                                            <CardDescription>Rekening bank alternatif</CardDescription>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.bank2_enabled === "true"}
                                            onChange={(e) => updateSetting("bank2_enabled", e.target.checked ? "true" : "false")}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </CardHeader>
                            {settings.bank2_enabled === "true" && (
                                <CardContent className="space-y-4 border-t pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label>Nama Bank</Label>
                                            <select
                                                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-900"
                                                value={settings.bank2_name}
                                                onChange={(e) => updateSetting("bank2_name", e.target.value)}
                                            >
                                                <option value="BCA">BCA</option>
                                                <option value="BRI">BRI</option>
                                                <option value="BNI">BNI</option>
                                                <option value="Mandiri">Mandiri</option>
                                                <option value="CIMB">CIMB Niaga</option>
                                                <option value="Permata">Permata</option>
                                                <option value="BSI">BSI</option>
                                                <option value="Danamon">Danamon</option>
                                                <option value="Other">Lainnya</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Nomor Rekening</Label>
                                            <Input
                                                value={settings.bank2_account_number}
                                                onChange={(e) => updateSetting("bank2_account_number", e.target.value)}
                                                placeholder="0987654321"
                                            />
                                        </div>
                                        <div>
                                            <Label>Atas Nama</Label>
                                            <Input
                                                value={settings.bank2_account_name}
                                                onChange={(e) => updateSetting("bank2_account_name", e.target.value)}
                                                placeholder="Nama pemilik rekening"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* E-Wallet */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">E-Wallet</CardTitle>
                                            <CardDescription>DANA, GoPay, OVO, ShopeePay</CardDescription>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.ewallet_enabled === "true"}
                                            onChange={(e) => updateSetting("ewallet_enabled", e.target.checked ? "true" : "false")}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </CardHeader>
                            {settings.ewallet_enabled === "true" && (
                                <CardContent className="space-y-4 border-t pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label>Jenis E-Wallet</Label>
                                            <select
                                                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-900"
                                                value={settings.ewallet_type}
                                                onChange={(e) => updateSetting("ewallet_type", e.target.value)}
                                            >
                                                <option value="DANA">DANA</option>
                                                <option value="GoPay">GoPay</option>
                                                <option value="OVO">OVO</option>
                                                <option value="ShopeePay">ShopeePay</option>
                                                <option value="LinkAja">LinkAja</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Nomor HP/Akun</Label>
                                            <Input
                                                value={settings.ewallet_number}
                                                onChange={(e) => updateSetting("ewallet_number", e.target.value)}
                                                placeholder="081234567890"
                                            />
                                        </div>
                                        <div>
                                            <Label>Atas Nama</Label>
                                            <Input
                                                value={settings.ewallet_name}
                                                onChange={(e) => updateSetting("ewallet_name", e.target.value)}
                                                placeholder="Nama akun e-wallet"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </TabsContent>

                    {/* Tax Settings */}
                    <TabsContent value="tax">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Pengaturan Pajak</CardTitle>
                                        <CardDescription>Aktifkan pajak untuk diterapkan otomatis di transaksi</CardDescription>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.tax_enabled === "true"}
                                            onChange={(e) => updateSetting("tax_enabled", e.target.checked ? "true" : "false")}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </CardHeader>
                            {settings.tax_enabled === "true" && (
                                <CardContent className="border-t pt-4">
                                    <div className="max-w-xs">
                                        <Label>Persentase Pajak (%)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={settings.tax_percentage}
                                                onChange={(e) => updateSetting("tax_percentage", e.target.value)}
                                                className="text-center"
                                            />
                                            <span className="text-gray-500">%</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            PPN Indonesia saat ini: 11%
                                        </p>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </TabsContent>

                    {/* Receipt Settings */}
                    <TabsContent value="receipt">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pengaturan Struk</CardTitle>
                                <CardDescription>Kustomisasi tampilan struk pembayaran</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Footer Struk</Label>
                                    <Input
                                        value={settings.receipt_footer}
                                        onChange={(e) => updateSetting("receipt_footer", e.target.value)}
                                        placeholder="Terima kasih telah berbelanja!"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Pesan yang muncul di bagian bawah struk</p>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                                    <div>
                                        <p className="font-medium">Tampilkan Logo di Struk</p>
                                        <p className="text-sm text-gray-500">Logo toko akan muncul di header struk</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.receipt_show_logo === "true"}
                                            onChange={(e) => updateSetting("receipt_show_logo", e.target.checked ? "true" : "false")}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {/* Preview */}
                                <div className="mt-6">
                                    <Label className="mb-2 block">Preview Struk</Label>
                                    <div className="max-w-xs mx-auto p-4 bg-white dark:bg-gray-900 border rounded-lg font-mono text-xs">
                                        <div className="text-center border-b border-dashed pb-2 mb-2">
                                            <p className="font-bold text-sm">{settings.store_name || "NAMA TOKO"}</p>
                                            <p>{settings.store_address || "Alamat Toko"}</p>
                                            <p>{settings.store_phone || "Telepon"}</p>
                                        </div>
                                        <div className="border-b border-dashed pb-2 mb-2">
                                            <p>No: INV240114001</p>
                                            <p>Kasir: Admin</p>
                                            <p>14/01/2024 17:00</p>
                                        </div>
                                        <div className="border-b border-dashed pb-2 mb-2 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Produk A x2</span>
                                                <span>20.000</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Produk B x1</span>
                                                <span>15.000</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span>Subtotal</span>
                                                <span>35.000</span>
                                            </div>
                                            {settings.tax_enabled === "true" && (
                                                <div className="flex justify-between">
                                                    <span>Pajak ({settings.tax_percentage}%)</span>
                                                    <span>{(35000 * Number(settings.tax_percentage) / 100).toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-bold">
                                                <span>TOTAL</span>
                                                <span>{settings.tax_enabled === "true" ? (35000 * (1 + Number(settings.tax_percentage) / 100)).toLocaleString() : "35.000"}</span>
                                            </div>
                                        </div>
                                        <div className="text-center border-t border-dashed pt-2 mt-2">
                                            <p>{settings.receipt_footer || "Terima kasih!"}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
