"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    FolderTree,
    ArrowLeftRight,
    BarChart3,
    Users,
    Settings,
    LogOut,
    Boxes,
    Moon,
    Sun,
    Menu,
    X
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "cashier"] },
    { name: "Kasir (POS)", href: "/pos", icon: ShoppingCart, roles: ["admin", "cashier"] },
    { name: "Produk", href: "/products", icon: Package, roles: ["admin"] },
    { name: "Kategori", href: "/categories", icon: FolderTree, roles: ["admin"] },
    { name: "Stok", href: "/inventory", icon: Boxes, roles: ["admin"] },
    { name: "Transaksi", href: "/transactions", icon: ArrowLeftRight, roles: ["admin", "cashier"] },
    { name: "Laporan", href: "/reports", icon: BarChart3, roles: ["admin"] },
    { name: "Pengguna", href: "/users", icon: Users, roles: ["admin"] },
    { name: "Pengaturan", href: "/settings", icon: Settings, roles: ["admin"] },
]

export function Sidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuthStore()
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    useEffect(() => {
        const isDark = localStorage.getItem("theme") === "dark" ||
            (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
        setIsDarkMode(isDark)
        document.documentElement.classList.toggle("dark", isDark)
    }, [])

    const toggleDarkMode = () => {
        const newMode = !isDarkMode
        setIsDarkMode(newMode)
        localStorage.setItem("theme", newMode ? "dark" : "light")
        document.documentElement.classList.toggle("dark", newMode)
    }

    const handleLogout = () => {
        logout()
        window.location.href = "/login"
    }

    const filteredNav = navigation.filter(item =>
        user && item.roles.includes(user.role)
    )

    return (
        <>
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 lg:hidden"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 z-40 h-screen w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 lg:translate-x-0",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700">
                                <ShoppingCart className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">POS System</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                        {filteredNav.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-blue-600 dark:text-blue-400" : "")} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User section */}
                    <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                        {user && (
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-medium text-white">
                                    {user.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                                        {user.fullName}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize dark:text-gray-400">
                                        {user.role}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={toggleDarkMode}
                            >
                                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
