import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Define product IDs
export const PRODUCT_EMPIRE_PACK = 'empire_pack';
export const PRODUCT_COINS_1000 = 'coins_1000';

export function useBilling(addViralCoins: (n: number) => void) {
  const [isReady, setIsReady] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).store) {
        console.warn("Store not found. Are you on a device?");
        return;
    }

    const store = (window as any).store;

    // 1. Register Products
    store.register([
      {
        id: PRODUCT_EMPIRE_PACK,
        type: store.NON_CONSUMABLE,
      },
      {
        id: PRODUCT_COINS_1000,
        type: store.CONSUMABLE,
      },
    ]);

    // 2. Handle Approvals (This is where the actual logic happens after payment)
    store.when(PRODUCT_EMPIRE_PACK).approved((p: any) => {
      toast.success("Empire Pack Activated!");
      p.finish();
      // Logic for No Ads / Special Skins would go here
    });

    store.when(PRODUCT_COINS_1000).approved((p: any) => {
      toast.success("1,000 ViralCoins added!");
      addViralCoins(1000); // Update the user's wallet in Supabase
      p.finish();
    });

    // Handle Errors
    store.error((error: any) => {
      console.error('Store Error ' + JSON.stringify(error));
      toast.error("Transaction failed: " + error.message);
    });

    // 3. Refresh the store to load products from Google Play
    store.ready(() => {
      setIsReady(true);
      setProducts(store.products);
    });

    store.refresh();

    return () => {
        // Clean up listeners if needed (plugin usually handles this)
    };
  }, [addViralCoins]);

  const purchase = (productId: string) => {
    const store = (window as any).store;
    if (!store) return toast.error("Billing not available on this device");

    toast.info("Connecting to Google Play...");
    store.order(productId);
  };

  return { isReady, products, purchase };
}
