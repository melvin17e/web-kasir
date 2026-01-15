import { create } from 'zustand'
import { Product } from '@/lib/api'

export interface CartItem {
    product: Product
    quantity: number
    discount: number // per-item discount percentage
}

interface CartState {
    items: CartItem[]
    discountPercent: number
    taxPercent: number
    paymentMethod: 'cash' | 'qris' | 'transfer'
    paidAmount: number
    notes: string

    // Actions
    addItem: (product: Product, quantity?: number) => void
    removeItem: (productId: number) => void
    updateQuantity: (productId: number, quantity: number) => void
    updateItemDiscount: (productId: number, discount: number) => void
    setDiscountPercent: (percent: number) => void
    setTaxPercent: (percent: number) => void
    setPaymentMethod: (method: 'cash' | 'qris' | 'transfer') => void
    setPaidAmount: (amount: number) => void
    setNotes: (notes: string) => void
    clearCart: () => void

    // Computed
    getSubtotal: () => number
    getDiscountAmount: () => number
    getTaxAmount: () => number
    getTotal: () => number
    getChange: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    discountPercent: 0,
    taxPercent: 0,
    paymentMethod: 'cash',
    paidAmount: 0,
    notes: '',

    addItem: (product, quantity = 1) => {
        const { items } = get()
        const existingItem = items.find(item => item.product.id === product.id)

        if (existingItem) {
            set({
                items: items.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                )
            })
        } else {
            set({
                items: [...items, { product, quantity, discount: product.discount || 0 }]
            })
        }
    },

    removeItem: (productId) => {
        set({ items: get().items.filter(item => item.product.id !== productId) })
    },

    updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
            get().removeItem(productId)
            return
        }
        set({
            items: get().items.map(item =>
                item.product.id === productId ? { ...item, quantity } : item
            )
        })
    },

    updateItemDiscount: (productId, discount) => {
        set({
            items: get().items.map(item =>
                item.product.id === productId ? { ...item, discount } : item
            )
        })
    },

    setDiscountPercent: (percent) => set({ discountPercent: percent }),
    setTaxPercent: (percent) => set({ taxPercent: percent }),
    setPaymentMethod: (method) => set({ paymentMethod: method }),
    setPaidAmount: (amount) => set({ paidAmount: amount }),
    setNotes: (notes) => set({ notes }),

    clearCart: () => set({
        items: [],
        discountPercent: 0,
        taxPercent: 0,
        paymentMethod: 'cash',
        paidAmount: 0,
        notes: ''
    }),

    getSubtotal: () => {
        return get().items.reduce((total, item) => {
            const itemPrice = item.product.sellPrice * (1 - item.discount / 100)
            return total + (itemPrice * item.quantity)
        }, 0)
    },

    getDiscountAmount: () => {
        return get().getSubtotal() * (get().discountPercent / 100)
    },

    getTaxAmount: () => {
        const afterDiscount = get().getSubtotal() - get().getDiscountAmount()
        return afterDiscount * (get().taxPercent / 100)
    },

    getTotal: () => {
        return get().getSubtotal() - get().getDiscountAmount() + get().getTaxAmount()
    },

    getChange: () => {
        return get().paidAmount - get().getTotal()
    }
}))
