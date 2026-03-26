export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ─── Enums ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'preparing'
  | 'served'
  | 'completed'
  | 'cancelled'

export type PaymentMethod = 'online' | 'cashier'
export type PaymentStatus = 'unpaid' | 'paid'
export type AdminRole = 'super_admin' | 'cashier' | 'kitchen'

// ─── Database Tables ──────────────────────────────────────────────────────────

export interface Restaurant {
  id: string
  name: string
  address: string | null
  logo_url: string | null
  is_active: boolean
  created_at: string
}

export interface Table {
  id: string
  restaurant_id: string
  table_number: string
  qr_code_url: string | null
  is_active: boolean
  created_at: string
}

export interface Category {
  id: string
  restaurant_id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Menu {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  sort_order: number
  created_at: string
}

export interface MenuOption {
  id: string
  menu_id: string
  name: string           // "Pilihan Level Pedas", "Tambahan Topping"
  is_required: boolean
  is_multiple: boolean
  created_at: string
}

export interface MenuOptionItem {
  id: string
  menu_option_id: string
  label: string          // "Pedas Level 1", "Extra Keju"
  additional_price: number
  created_at: string
}

export interface Order {
  id: string
  restaurant_id: string
  table_id: string
  status: OrderStatus
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  transaction_id: string | null
  total_price: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_id: string
  quantity: number
  unit_price: number     // snapshot harga saat pesan
  notes: string | null
  subtotal: number
  created_at: string
}

export interface OrderItemOption {
  id: string
  order_item_id: string
  menu_option_item_id: string
  label: string          // snapshot nama pilihan
  additional_price: number  // snapshot harga tambahan
}

export interface AdminUser {
  id: string
  restaurant_id: string
  email: string
  role: AdminRole
  created_at: string
}

// ─── Extended Types (dengan relasi) ──────────────────────────────────────────

export interface MenuWithOptions extends Menu {
  menu_options: (MenuOption & {
    menu_option_items: MenuOptionItem[]
  })[]
}

export interface CategoryWithMenus extends Category {
  menus: Menu[]
}

export interface OrderItemWithDetails extends OrderItem {
  menu: Menu
  order_item_options: OrderItemOption[]
}

export interface OrderWithItems extends Order {
  order_items: OrderItemWithDetails[]
  table: Table
}

// ─── Cart Types (local state) ─────────────────────────────────────────────────

export interface CartItemOption {
  menu_option_id: string
  menu_option_item_id: string
  label: string
  additional_price: number
}

export interface CartItem {
  menu: Menu
  quantity: number
  notes: string
  selected_options: CartItemOption[]
  subtotal: number
}
