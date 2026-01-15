import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, authApi } from '@/lib/api'

interface AuthState {
    user: User | null
    token: string | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (username: string, password: string) => Promise<void>
    logout: () => void
    checkAuth: () => Promise<void>
    setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: true,
            isAuthenticated: false,

            login: async (username: string, password: string) => {
                const data = await authApi.login(username, password)
                localStorage.setItem('token', data.token)
                set({
                    user: data.user,
                    token: data.token,
                    isAuthenticated: true,
                    isLoading: false
                })
            },

            logout: () => {
                localStorage.removeItem('token')
                set({ user: null, token: null, isAuthenticated: false })
            },

            checkAuth: async () => {
                const token = localStorage.getItem('token')
                if (!token) {
                    set({ isLoading: false, isAuthenticated: false })
                    return
                }

                try {
                    const data = await authApi.me()
                    set({
                        user: data.user,
                        token,
                        isAuthenticated: true,
                        isLoading: false
                    })
                } catch {
                    localStorage.removeItem('token')
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false
                    })
                }
            },

            setUser: (user) => set({ user })
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token })
        }
    )
)
