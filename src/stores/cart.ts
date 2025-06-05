import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    image_url: string;
  };
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  fetchCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  addItem: async (productId) => {
    set({ loading: true });
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id);
    } else {
      await supabase
        .from('cart_items')
        .insert({ product_id: productId, quantity: 1 });
    }
    
    await get().fetchCart();
    set({ loading: false });
  },
  removeItem: async (productId) => {
    set({ loading: true });
    await supabase
      .from('cart_items')
      .delete()
      .eq('product_id', productId);
    
    await get().fetchCart();
    set({ loading: false });
  },
  updateQuantity: async (productId, quantity) => {
    set({ loading: true });
    if (quantity <= 0) {
      await get().removeItem(productId);
    } else {
      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('product_id', productId);
      
      await get().fetchCart();
    }
    set({ loading: false });
  },
  fetchCart: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(
          name,
          price,
          image_url
        )
      `);
    
    set({ items: data || [], loading: false });
  },
}));