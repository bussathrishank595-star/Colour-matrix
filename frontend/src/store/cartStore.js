import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, colorVariant = null) => {
        const { items } = get();
        const key = `${product._id}-${colorVariant || 'default'}`;
        const existingIndex = items.findIndex((i) => i.key === key);

        if (existingIndex >= 0) {
          const updated = [...items];
          updated[existingIndex].quantity += quantity;
          set({ items: updated });
          toast.success('Quantity updated!');
        } else {
          set({
            items: [
              ...items,
              {
                key,
                product,
                quantity,
                colorVariant,
                price: product.discountedPrice || product.price,
              },
            ],
          });
          toast.success(`${product.name} added to cart! 🛒`);
        }
        set({ isOpen: true });
      },

      removeItem: (key) => {
        set({ items: get().items.filter((i) => i.key !== key) });
        toast.success('Item removed from cart');
      },

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        set({
          items: get().items.map((i) => (i.key === key ? { ...i, quantity } : i)),
        });
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      getSubtotal: () =>
        get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),

      getItemCount: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),
    }),
    {
      name: 'cart-store',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
