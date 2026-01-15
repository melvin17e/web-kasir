"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ShoppingCart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/store/authStore"

export default function LoginPage() {
    const router = useRouter()
    const { login } = useAuthStore()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            await login(username, password)
            router.push("/dashboard")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login gagal")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30 mb-4">
                        <ShoppingCart className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">POS System</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Point of Sale untuk UMKM</p>
                </div>

                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl">Masuk</CardTitle>
                        <CardDescription>Masukkan kredensial Anda untuk melanjutkan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-900/50 dark:border-red-800 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="username">Username atau Email</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="admin"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    "Masuk"
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                Demo credentials:<br />
                                <span className="font-mono">admin / admin123</span> atau{" "}
                                <span className="font-mono">kasir1 / kasir123</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
