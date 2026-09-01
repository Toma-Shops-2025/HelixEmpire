import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import 'cordova-plugin-purchase/www/store.js';

export const PRODUCT_COINS_1000 = 'coins_1000';

type CdvPurchaseNs = {
  store: CdvStore;
  LogLevel: { DEBUG: number };
  ProductType: { CONSUMABLE: string };
  Platform: { GOOGLE_PLAY: string };
  ErrorCode: { PAYMENT_CANCELLED: number };
};

type CdvOffer = {
  productId: string;
  platform: string;
  order: (additionalData?: unknown) => Promise<CdvError | undefined>;
};

type CdvProduct = {
  id: string;
  canPurchase: boolean;
  getOffer: (id?: string) => CdvOffer | undefined;
  offers?: CdvOffer[];
};

type CdvError = { code?: number; message?: string; isError?: boolean };

type CdvStore = {
  verbosity: number;
  register: (product: unknown) => void;
  when: () => {
    approved: (cb: (tx: { productId: string; verify: () => void; finish: () => void }) => void) => unknown;
    verified: (cb: (receipt: { finish: () => void }) => void) => unknown;
    unverified: (cb: () => void) => unknown;
    productUpdated: (cb: (product: CdvProduct) => void) => unknown;
  };
  ready: (cb: () => void) => void;
  error: (cb: (err: CdvError) => void) => void;
  initialize: (platforms: unknown[]) => Promise<void>;
  update: () => Promise<void>;
  get: (id: string, platform?: unknown) => CdvProduct | undefined;
  order: (offer: CdvOffer, additionalData?: unknown) => Promise<CdvError | undefined>;
};

function getCdv(): CdvPurchaseNs | null {
  const CdvPurchase = (window as { CdvPurchase?: CdvPurchaseNs }).CdvPurchase;
  if (!CdvPurchase?.store) return null;
  return CdvPurchase;
}

async function waitForNativeBridge(maxMs = 10000): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const w = window as { cordova?: { exec?: unknown }; Capacitor?: { Plugins?: unknown } };
    if (w.cordova?.exec || w.Capacitor?.Plugins) return;
    await new Promise((r) => setTimeout(r, 150));
  }
}

function getProductOffer(product: CdvProduct): CdvOffer | undefined {
  return product.getOffer?.() ?? product.offers?.[0];
}

export function useBilling(addViralCoins: (n: number) => void | Promise<void>) {
  const [isReady, setIsReady] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const initStarted = useRef(false);
  const addCoinsRef = useRef(addViralCoins);

  useEffect(() => {
    addCoinsRef.current = addViralCoins;
  }, [addViralCoins]);

  const ensureInitialized = useCallback(async () => {
    const CdvPurchase = getCdv();
    if (!CdvPurchase) return false;

    await waitForNativeBridge();
    const { store } = CdvPurchase;

    try {
      await store.initialize([CdvPurchase.Platform.GOOGLE_PLAY]);
      await store.update();
      setIsReady(true);
      return true;
    } catch (e) {
      console.error('Billing: ensureInitialized failed', e);
      return false;
    }
  }, []);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const initStore = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.warn('Billing: in-app purchases require the Play Store app');
        return;
      }

      await waitForNativeBridge();

      const CdvPurchase = getCdv();
      if (!CdvPurchase) {
        console.warn('Billing: cordova-plugin-purchase not available');
        return;
      }

      const { store } = CdvPurchase;
      store.verbosity = CdvPurchase.LogLevel.DEBUG;

      store.register({
        id: PRODUCT_COINS_1000,
        type: CdvPurchase.ProductType.CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      });

      store.when().productUpdated(() => {
        setIsReady(true);
      });

      store.when().approved((tx) => {
        if (tx.productId === PRODUCT_COINS_1000) {
          void Promise.resolve(addCoinsRef.current(1000)).then(() => {
            toast.success('1,000 ViralCoins added!');
          });
        }
        tx.verify();
        tx.finish();
      });

      store.when().verified((receipt) => receipt.finish());
      store.when().unverified(() => {
        console.warn('Billing: purchase unverified');
      });

      store.ready(() => {
        console.log('Billing: Store is ready');
        setIsReady(true);
      });

      store.error((err) => {
        console.error('Billing error:', err?.code, err?.message);
        if (err?.message) toast.error(err.message);
      });

      await ensureInitialized();
    };

    void initStore();
  }, [ensureInitialized]);

  const purchase = async (id: string) => {
    if (!Capacitor.isNativePlatform()) {
      toast.error('Purchases only work in the Play Store app on your phone.');
      return;
    }

    setIsPurchasing(true);
    try {
      let CdvPurchase = getCdv();
      if (!CdvPurchase) {
        toast.error('Google Play billing is not available on this build.');
        return;
      }

      if (!isReady) {
        toast.info('Connecting to Google Play...');
        const ok = await ensureInitialized();
        if (!ok) {
          toast.error('Could not connect to Google Play. Try again in a few seconds.');
          return;
        }
        CdvPurchase = getCdv();
        if (!CdvPurchase) return;
      }

      const { store } = CdvPurchase;

      let product =
        store.get(id, CdvPurchase.Platform.GOOGLE_PLAY) ?? store.get(id);

      if (!product) {
        await store.update();
        product = store.get(id, CdvPurchase.Platform.GOOGLE_PLAY) ?? store.get(id);
      }

      if (!product) {
        toast.error(
          'Product "coins_1000" not found. Confirm it is Active in Play Console and install from Play testing.',
        );
        return;
      }

      const offer = getProductOffer(product);
      if (!offer) {
        toast.error('Purchase option not loaded yet. Wait a moment and try again.');
        return;
      }

      toast.info('Opening Google Play checkout...');
      const error = await offer.order();
      if (error?.isError || error?.message) {
        if (error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
          toast.info('Purchase cancelled.');
        } else {
          toast.error(error.message || 'Purchase failed.');
        }
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  return { isReady, isPurchasing, purchase, ensureInitialized };
}
