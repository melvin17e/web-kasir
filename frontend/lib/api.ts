const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pos-api-umkm.loca.lt/api'



interface RequestOptions {
    method?: string
    body?: unknown
    headers?: Record<string, string>
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
    }

    return data
}

export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint),
    post: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'POST', body }),
    put: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PUT', body }),
    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' })
}

// Auth
export const authApi = {
    login: (username: string, password: string) =>
        api.post<{ token: string; user: User }>('/auth/login', { username, password }),
    me: () => api.get<{ user: User }>('/auth/me'),
    logout: () => api.post('/auth/logout'),
    register: (data: RegisterData) => api.post<{ user: User }>('/auth/register', data)
}

// Products
export const productApi = {
    getAll: (params?: string) => api.get<{ products: Product[]; pagination: Pagination }>(`/products${params ? `?${params}` : ''}`),
    getById: (id: number) => api.get<{ product: Product }>(`/products/${id}`),
    getByBarcode: (code: string) => api.get<{ product: Product }>(`/products/barcode/${code}`),
    create: (data: FormData) => uploadFile<{ product: Product }>('/products', data),
    update: (id: number, data: FormData) => uploadFile<{ product: Product }>(`/products/${id}`, data, 'PUT'),
    delete: (id: number) => api.delete(`/products/${id}`),
    getLowStock: () => api.get<{ products: Product[] }>('/products/low-stock')
}

// Categories
export const categoryApi = {
    getAll: () => api.get<{ categories: Category[] }>('/categories'),
    create: (data: Partial<Category>) => api.post<{ category: Category }>('/categories', data),
    update: (id: number, data: Partial<Category>) => api.put<{ category: Category }>(`/categories/${id}`, data),
    delete: (id: number) => api.delete(`/categories/${id}`)
}

// Transactions
export const transactionApi = {
    getAll: (params?: string) => api.get<{ transactions: Transaction[]; pagination: Pagination }>(`/transactions${params ? `?${params}` : ''}`),
    getById: (id: number) => api.get<{ transaction: Transaction }>(`/transactions/${id}`),
    create: (data: CreateTransactionData) => api.post<{ transaction: Transaction }>('/transactions', data),
    cancel: (id: number) => api.post(`/transactions/${id}/cancel`),
    getReceipt: (id: number) => api.get<{ receipt: Receipt }>(`/transactions/${id}/receipt`)
}

// Stock
export const stockApi = {
    getMovements: (params?: string) => api.get<{ movements: StockMovement[]; pagination: Pagination }>(`/stock${params ? `?${params}` : ''}`),
    stockIn: (data: StockInOutData) => api.post('/stock/in', data),
    stockOut: (data: StockInOutData) => api.post('/stock/out', data),
    getLowStock: () => api.get<{ products: Product[]; count: number }>('/stock/low')
}

// Dashboard
export const dashboardApi = {
    getStats: () => api.get<DashboardStats>('/dashboard/stats'),
    getSalesChart: (period?: string) => api.get<{ chartData: ChartData[] }>(`/dashboard/sales-chart${period ? `?period=${period}` : ''}`),
    getPaymentStats: () => api.get<{ paymentStats: PaymentStat[] }>('/dashboard/payment-stats')
}

// Reports
export const reportApi = {
    getSales: (startDate: string, endDate: string) =>
        api.get<SalesReport>(`/reports/sales?startDate=${startDate}&endDate=${endDate}`),
    getStock: () => api.get<StockReport>('/reports/stock'),
    getCash: (startDate: string, endDate: string) =>
        api.get<CashReport>(`/reports/cash?startDate=${startDate}&endDate=${endDate}`),
    export: (type: string, startDate: string, endDate: string) =>
        api.get<ExportData>(`/reports/export?type=${type}&startDate=${startDate}&endDate=${endDate}`)
}

// Users
export const userApi = {
    getAll: () => api.get<{ users: User[] }>('/users'),
    create: (data: RegisterData) => api.post<{ user: User }>('/auth/register', data),
    update: (id: number, data: Partial<User>) => api.put<{ user: User }>(`/users/${id}`, data),
    delete: (id: number) => api.delete(`/users/${id}`),
    resetPassword: (id: number, newPassword: string) =>
        api.post(`/users/${id}/reset-password`, { newPassword }),
    changePassword: (currentPassword: string, newPassword: string) =>
        api.post('/users/change-password', { currentPassword, newPassword })
}

// File upload helper
async function uploadFile<T>(endpoint: string, formData: FormData, method = 'POST'): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    const headers: Record<string, string> = {}
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers,
        body: formData
    })

    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
    }
    return data
}

// Types
export interface User {
    id: number
    username: string
    email: string
    fullName: string
    role: 'admin' | 'cashier'
    isActive: boolean
    createdAt: string
}

export interface RegisterData {
    username: string
    email: string
    password: string
    fullName: string
    role?: string
}

export interface Category {
    id: number
    name: string
    description?: string
    color: string
    isActive: boolean
    _count?: { products: number }
}

export interface Product {
    id: number
    name: string
    barcode?: string
    sku?: string
    image?: string
    categoryId: number
    category?: Category
    buyPrice: number
    sellPrice: number
    discount: number
    stock: number
    minStock: number
    unit: string
    description?: string
    isActive: boolean
}

export interface Transaction {
    id: number
    invoiceNo: string
    userId: number
    user?: User
    subtotal: number
    discountPercent: number
    discountAmount: number
    taxPercent: number
    taxAmount: number
    total: number
    paidAmount: number
    changeAmount: number
    paymentMethod: 'cash' | 'qris' | 'transfer'
    status: string
    notes?: string
    createdAt: string
    items?: TransactionItem[]
}

export interface TransactionItem {
    id: number
    productId: number
    product?: Product
    productName: string
    quantity: number
    price: number
    discount: number
    subtotal: number
}

export interface CreateTransactionData {
    items: { productId: number; quantity: number; discount?: number }[]
    discountPercent?: number
    taxPercent?: number
    paidAmount: number
    paymentMethod: string
    notes?: string
}

export interface StockMovement {
    id: number
    productId: number
    product?: Product
    userId: number
    user?: User
    type: 'in' | 'out' | 'adjustment'
    quantity: number
    notes?: string
    createdAt: string
}

export interface StockInOutData {
    productId: number
    quantity: number
    notes?: string
}

export interface Receipt {
    storeName: string
    storeAddress: string
    storePhone: string
    invoiceNo: string
    date: string
    cashier: string
    items: { name: string; quantity: number; price: number; discount: number; subtotal: number }[]
    subtotal: number
    discount: number
    tax: number
    total: number
    paid: number
    change: number
    paymentMethod: string
}

export interface DashboardStats {
    todaySales: number
    todayTransactions: number
    totalProducts: number
    lowStockCount: number
    topProducts: { id: number; name: string; image?: string; sellPrice: number; totalSold: number }[]
    recentTransactions: Transaction[]
}

export interface ChartData {
    date: string
    sales: number
    count: number
}

export interface PaymentStat {
    method: string
    total: number
    count: number
}

export interface SalesReport {
    summary: {
        totalSales: number
        totalCost: number
        grossProfit: number
        totalDiscount: number
        totalTax: number
        transactionCount: number
        averageTransaction: number
    }
    dailyData: { date: string; sales: number; cost: number; profit: number; count: number }[]
    transactions: Transaction[]
}

export interface StockReport {
    summary: {
        totalProducts: number
        totalStockValue: number
        totalRetailValue: number
        potentialProfit: number
        lowStockCount: number
        outOfStockCount: number
    }
    products: Product[]
}

export interface CashReport {
    summary: {
        totalIncome: number
        transactionCount: number
        byMethod: Record<string, { count: number; total: number }>
    }
    dailyData: { date: string; cash: number; qris: number; transfer: number; total: number }[]
    transactions: Transaction[]
}

export interface ExportData {
    headers: string[]
    data: Record<string, unknown>[]
    filename: string
}

export interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}
