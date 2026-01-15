"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { useAuthStore } from "@/store/authStore"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        checkAuth()
        setMounted(true)
    }, [checkAuth])

    useEffect(() => {
        if (!isLoading && !isAuthenticated && mounted) {
            router.push("/login")
        }
    }, [isLoading, isAuthenticated, router, mounted])

    if (isLoading || !mounted) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Sidebar />
            <main className="lg:pl-64">
                <div className="min-h-screen p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
