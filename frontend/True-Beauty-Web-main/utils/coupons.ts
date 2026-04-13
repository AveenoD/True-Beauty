export type Coupon = {
  code: string;
  description?: string;
  /** Flat discount amount in rupees (ignored when discountPercent is set) */
  discountAmount: number;
  /** Optional percentage off; when set, discount = eligibleTotal * discountPercent / 100 */
  discountPercent?: number;
  /** Minimum cart total (on eligible items) required */
  minCartTotal: number;
  /** ISO date string (inclusive) */
  startDate: string;
  /** ISO date string (inclusive) */
  expiryDate: string;
  /** Only these product categories are eligible (by `Product.category`); ['*'] = all */
  applicableCategories: string[];
  /** If true, products where originalPrice > price are excluded from discount calculations */
  excludeDiscountedProducts: boolean;
  /** Max total redemptions across all users (0 or undefined = unlimited) */
  usageLimit?: number;
  /** Max redemptions per user (default 1 for your use-case) */
  perUserLimit: number;
  /** If false, cannot be combined with other coupons (we only support one anyway) */
  combinable: boolean;
  /** If false, coupon is disabled */
  active: boolean;
};

export type CouponUsageSummary = {
  totalUsed: number;
  perUser: Record<string, number>;
};

export type CouponUsageStore = Record<string, CouponUsageSummary>;

/** Status for coupon history (used on order, expired, or cancelled). */
export type CouponHistoryStatus = 'used' | 'expired' | 'cancelled';

/** Single entry in coupon history (after use, expiry, or cancel). */
export type CouponHistoryEntry = {
  id: string;
  couponCode: string;
  discountAmount: number;
  orderId: string;
  usedAt: string;
  status: CouponHistoryStatus;
};

const USAGE_STORAGE_KEY = 'tb_coupon_usage';
const COUPON_HISTORY_KEY = 'tb_coupon_history';
const REWARD_COUPONS_KEY = 'tb_reward_coupons';
const LAST_EARNED_REWARD_KEY = 'tb_last_earned_reward_coupon';

/** Minimum order item price (₹) to earn a reward coupon. */
export const REWARD_ORDER_MIN_PRICE = 1500;
/** Reward coupon discount (%). */
export const REWARD_DISCOUNT_PERCENT = 10;
/** Reward coupon validity in days. */
export const REWARD_EXPIRY_DAYS = 30;

export type RewardCoupon = {
  id: string;
  code: string;
  discountPercent: number;
  expiryDate: string;
  used: boolean;
  earnedAt: string;
};

// Reusable display/config values for the default coupon used across the app
export const DEFAULT_COUPON_CODE = 'TRUEPREMIUM200';
export const DEFAULT_COUPON_DISCOUNT = 200;
export const DEFAULT_COUPON_MIN_CART_TOTAL = 1000;
// Minimum single-product price at which we want to *show*
// coupon messaging on product cards / detail pages.
// (Actual applicability at checkout is still based on
// DEFAULT_COUPON_MIN_CART_TOTAL and full validation.)
export const DEFAULT_COUPON_PRODUCT_MIN_PRICE = 1000;

// Default "premium" categories for the sample coupon (can be adjusted in admin)
export const DEFAULT_PREMIUM_CATEGORIES = ['skincare', 'makeup', 'haircare', 'fragrance', 'jewellery', 'gifting'];

// Seed example coupon that follows your spec: flat ₹200 off, min ₹1000
export const DEFAULT_COUPONS: Coupon[] = [
  {
    code: DEFAULT_COUPON_CODE,
    description: '₹200 OFF on premium categories for orders above ₹1000',
    discountAmount: DEFAULT_COUPON_DISCOUNT,
    minCartTotal: DEFAULT_COUPON_MIN_CART_TOTAL,
    startDate: new Date().toISOString().slice(0, 10),
    // 30 days validity by default
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    applicableCategories: DEFAULT_PREMIUM_CATEGORIES,
    excludeDiscountedProducts: false,
    usageLimit: 0,
    perUserLimit: 1,
    combinable: false,
    active: true,
  },
];

export type MinimalCartItem = {
  id: number;
  price: number;
  quantity?: number;
};

export type MinimalProduct = {
  id: number;
  category: string;
  price: number;
  originalPrice: number;
};

export type CouponValidationResult =
  | { ok: true; coupon: Coupon; discount: number; eligibleTotal: number }
  | { ok: false; code: string; errorCode: string; message: string };

export function getRewardCoupons(): RewardCoupon[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REWARD_COUPONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRewardCoupons(list: RewardCoupon[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REWARD_COUPONS_KEY, JSON.stringify(list));
}

/** Returns reward coupons that are unused and not expired, as Coupon-like entries for validation. */
function getActiveRewardCouponsAsCoupons(): Coupon[] {
  const rewards = getRewardCoupons();
  const today = new Date().toISOString().slice(0, 10);
  return rewards
    .filter((r) => !r.used && r.expiryDate >= today)
    .map((r) => ({
      code: r.code,
      discountAmount: 0,
      discountPercent: r.discountPercent,
      minCartTotal: 0,
      startDate: r.earnedAt.slice(0, 10),
      expiryDate: r.expiryDate,
      applicableCategories: ['*'],
      excludeDiscountedProducts: false,
      usageLimit: 1,
      perUserLimit: 1,
      combinable: false,
      active: true,
    }));
}

export function getStoredCoupons(): Coupon[] {
  if (typeof window === 'undefined') return DEFAULT_COUPONS;
  try {
    const raw = localStorage.getItem('tb_coupons');
    const base = raw ? (Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : DEFAULT_COUPONS) : DEFAULT_COUPONS;
    const rewardAsCoupons = getActiveRewardCouponsAsCoupons();
    return [...base, ...rewardAsCoupons];
  } catch {
    return [...DEFAULT_COUPONS, ...getActiveRewardCouponsAsCoupons()];
  }
}

export function saveCoupons(list: Coupon[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tb_coupons', JSON.stringify(list));
}

/**
 * Returns coupons the user can still use (active, not expired, per-user limit not reached).
 * Use to prefill coupon input on cart/checkout when user has available coupons.
 */
export function getAvailableCouponsForUser(user: unknown): Coupon[] {
  const all = getStoredCoupons();
  const today = new Date().toISOString().slice(0, 10);
  const userId = getUserIdForCouponUsage(user as any);
  return all.filter(
    (c) => c.active && c.expiryDate >= today && canUserUseCoupon(c, userId).ok
  );
}

export function getCouponByCode(code: string): Coupon | undefined {
  const normalized = code.trim().toUpperCase();
  return getStoredCoupons().find((c) => c.code.toUpperCase() === normalized);
}

export function isRewardCouponCode(code: string): boolean {
  const c = code.trim().toUpperCase();
  return c.startsWith('REWARD-');
}

export function markRewardCouponUsed(code: string): void {
  const list = getRewardCoupons();
  const normalized = code.trim().toUpperCase();
  const updated = list.map((r) => (r.code.toUpperCase() === normalized ? { ...r, used: true } : r));
  saveRewardCoupons(updated);
}

/**
 * If any order item has price >= REWARD_ORDER_MIN_PRICE, creates a 10% OFF reward coupon
 * (one-time use, 30 days expiry). Saves to tb_reward_coupons and tb_last_earned_reward_coupon for UI.
 * Returns the earned reward coupon or null.
 */
export function createRewardCouponAfterOrder(
  items: { price: number; quantity?: number }[],
): RewardCoupon | null {
  const qualifies = items.some((i) => (i.price ?? 0) >= REWARD_ORDER_MIN_PRICE);
  if (!qualifies) return null;

  const now = new Date();
  const expiry = new Date(now.getTime() + REWARD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const code = `REWARD-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const reward: RewardCoupon = {
    id: `rc_${Date.now()}`,
    code,
    discountPercent: REWARD_DISCOUNT_PERCENT,
    expiryDate: expiry.toISOString().slice(0, 10),
    used: false,
    earnedAt: now.toISOString(),
  };

  const list = getRewardCoupons();
  list.unshift(reward);
  saveRewardCoupons(list);

  if (typeof window !== 'undefined') {
    localStorage.setItem(
      LAST_EARNED_REWARD_KEY,
      JSON.stringify({ code: reward.code, discountPercent: reward.discountPercent, expiryDate: reward.expiryDate }),
    );
  }
  return reward;
}

export type LastEarnedReward = { code: string; discountPercent: number; expiryDate: string };

/** Used by order success page to show the just-earned coupon. */
export function getLastEarnedRewardCoupon(): LastEarnedReward | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_EARNED_REWARD_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastEarnedReward;
  } catch {
    return null;
  }
}

export function clearLastEarnedRewardCoupon(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LAST_EARNED_REWARD_KEY);
}

export function getCouponUsageStore(): CouponUsageStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCouponUsageStore(store: CouponUsageStore) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(store));
}

export function getUserIdForCouponUsage(user: any | null): string | null {
  if (!user) return null;
  return user.id?.toString() || user.email || user.phone || null;
}

export function getCouponUsageForUser(code: string, userId: string | null): number {
  if (!userId) return 0;
  const store = getCouponUsageStore();
  const entry = store[code.toUpperCase()];
  if (!entry) return 0;
  return entry.perUser[userId] || 0;
}

export function canUserUseCoupon(coupon: Coupon, userId: string | null): { ok: boolean; reason?: string } {
  if (!userId) {
    return { ok: false, reason: 'Please login to use this coupon.' };
  }
  const store = getCouponUsageStore();
  const key = coupon.code.toUpperCase();
  const entry = store[key];
  const alreadyUsedByUser = entry?.perUser?.[userId] || 0;

  if (alreadyUsedByUser >= (coupon.perUserLimit || 1)) {
    return { ok: false, reason: 'You have already used this coupon.' };
  }

  if (coupon.usageLimit && entry?.totalUsed >= coupon.usageLimit) {
    return { ok: false, reason: 'This coupon has reached its usage limit.' };
  }

  return { ok: true };
}

export function recordCouponUsage(coupon: Coupon, userId: string | null) {
  if (!userId) return;
  const store = getCouponUsageStore();
  const key = coupon.code.toUpperCase();
  const current: CouponUsageSummary = store[key] || { totalUsed: 0, perUser: {} };
  const userCount = current.perUser[userId] || 0;
  current.perUser[userId] = userCount + 1;
  current.totalUsed += 1;
  store[key] = current;
  saveCouponUsageStore(store);
}

export function computeEligibleTotal(
  cartItems: MinimalCartItem[],
  findProductById: (id: number) => MinimalProduct | null,
  coupon: Coupon,
): { totalEligible: number; hasEligibleItems: boolean } {
  let total = 0;
  let hasEligible = false;

  const allCategories = coupon.applicableCategories.includes('*');

  for (const item of cartItems) {
    const product = findProductById(item.id);
    if (!product) continue;
    const qty = item.quantity || 1;

    const isInCategory = allCategories || coupon.applicableCategories.includes(product.category);
    const isDiscounted = product.originalPrice > product.price;

    if (!isInCategory) continue;
    if (coupon.excludeDiscountedProducts && isDiscounted) continue;

    hasEligible = true;
    total += item.price * qty;
  }

  return { totalEligible: total, hasEligibleItems: hasEligible };
}

export function validateCoupon(
  code: string,
  cartItems: MinimalCartItem[],
  findProductById: (id: number) => MinimalProduct | null,
  user: any | null,
  now: Date = new Date(),
): CouponValidationResult {
  const trimmed = code.trim();
  if (!trimmed) {
    return { ok: false, code, errorCode: 'EMPTY', message: 'Please enter a coupon code.' };
  }

  const coupon = getCouponByCode(trimmed);
  if (!coupon) {
    return { ok: false, code, errorCode: 'NOT_FOUND', message: 'Coupon code is invalid.' };
  }

  const normalized = trimmed.toUpperCase();
  const isReward = isRewardCouponCode(trimmed);
  if (isReward) {
    const rewards = getRewardCoupons();
    const reward = rewards.find((r) => r.code.toUpperCase() === normalized);
    if (!reward) {
      return { ok: false, code, errorCode: 'NOT_FOUND', message: 'Coupon code is invalid.' };
    }
    if (reward.used) {
      return { ok: false, code: coupon.code, errorCode: 'USER_LIMIT', message: 'You have already used this coupon.' };
    }
    const todayStr = now.toISOString().slice(0, 10);
    if (todayStr > reward.expiryDate) {
      return { ok: false, code: coupon.code, errorCode: 'EXPIRED', message: 'This coupon has expired.' };
    }
    const { totalEligible, hasEligibleItems } = computeEligibleTotal(cartItems, findProductById, coupon);
    if (!hasEligibleItems) {
      return { ok: false, code: coupon.code, errorCode: 'NO_ELIGIBLE_ITEMS', message: 'Add items to cart to use this coupon.' };
    }
    const discount = Math.round((totalEligible * (coupon.discountPercent ?? REWARD_DISCOUNT_PERCENT)) / 100);
    return { ok: true, coupon, discount, eligibleTotal: totalEligible };
  }

  if (!coupon.active) {
    return { ok: false, code: coupon.code, errorCode: 'DISABLED', message: 'This coupon is currently not active.' };
  }

  const todayStr = now.toISOString().slice(0, 10);
  if (todayStr < coupon.startDate) {
    return { ok: false, code: coupon.code, errorCode: 'NOT_STARTED', message: 'This coupon is not yet active.' };
  }
  if (todayStr > coupon.expiryDate) {
    return { ok: false, code: coupon.code, errorCode: 'EXPIRED', message: 'This coupon has expired.' };
  }

  const userId = getUserIdForCouponUsage(user);
  const canUse = canUserUseCoupon(coupon, userId);
  if (!canUse.ok) {
    return { ok: false, code: coupon.code, errorCode: 'USER_LIMIT', message: canUse.reason || 'You are not eligible for this coupon.' };
  }

  const { totalEligible, hasEligibleItems } = computeEligibleTotal(cartItems, findProductById, coupon);

  if (!hasEligibleItems) {
    return {
      ok: false,
      code: coupon.code,
      errorCode: 'NO_ELIGIBLE_ITEMS',
      message: 'This coupon is only valid on selected premium categories and non-discounted products.',
    };
  }

  if (totalEligible < coupon.minCartTotal) {
    return {
      ok: false,
      code: coupon.code,
      errorCode: 'MIN_AMOUNT',
      message: `Minimum eligible cart value of ₹${coupon.minCartTotal} is required for this coupon.`,
    };
  }

  const discount =
    coupon.discountPercent != null
      ? Math.round((totalEligible * coupon.discountPercent) / 100)
      : Math.min(coupon.discountAmount, totalEligible);

  return {
    ok: true,
    coupon,
    discount,
    eligibleTotal: totalEligible,
  };
}

/**
 * Utility: returns true when a product is considered "discounted" for coupon logic.
 * We treat any case where originalPrice > price as discounted.
 */
export function isProductDiscounted(product: { price: number; originalPrice: number }): boolean {
  return product.originalPrice > product.price;
}

/**
 * Utility: shared coupon‑eligibility logic for product UI (cards / PDP).
 * A product is eligible for the default coupon messaging when:
 * - Its price is strictly greater than DEFAULT_COUPON_PRODUCT_MIN_PRICE (₹1000)
 * - We do NOT care whether it is already discounted or not.
 *
 * Note: the actual application of coupons at checkout still uses full
 * validation (categories, cart total, minCartTotal = ₹2000, etc.) via validateCoupon.
 */
export function isDefaultCouponEligibleProduct(
  product: { price: number; originalPrice: number },
): boolean {
  return product.price > DEFAULT_COUPON_PRODUCT_MIN_PRICE;
}

/** Minimum product price (₹) to show any coupon messaging. Products below this hide all coupon UI. */
export const COUPON_MESSAGE_MIN_PRICE = DEFAULT_COUPON_PRODUCT_MIN_PRICE;

/**
 * Returns whether the user is logged in and has an active default coupon (not used yet, valid dates).
 * Used to decide whether to show "you have coupon" badge or "buy & get coupon" message.
 */
export function getUserHasActiveDefaultCoupon(user: unknown): { has: boolean; coupon: Coupon | null } {
  const coupon = getCouponByCode(DEFAULT_COUPON_CODE);
  if (!coupon || !coupon.active) return { has: false, coupon: null };

  const todayStr = new Date().toISOString().slice(0, 10);
  if (todayStr < coupon.startDate || todayStr > coupon.expiryDate) return { has: false, coupon: null };

  const userId = getUserIdForCouponUsage(user as any);
  if (!userId) return { has: false, coupon: null };

  const canUse = canUserUseCoupon(coupon, userId);
  if (!canUse.ok) return { has: false, coupon: null };

  return { has: true, coupon };
}

export type CouponDisplayState =
  | { show: false }
  | { show: true; type: 'has_coupon'; discountDisplay: string }
  | { show: true; type: 'get_coupon'; message: string };

/**
 * Reusable dynamic coupon display logic for product cards and detail page.
 * - User must be logged in (pass user from profile); otherwise nothing is shown.
 * - Product must have price >= COUPON_MESSAGE_MIN_PRICE (₹1000).
 * - Product must not already be discounted (originalPrice > price).
 * If user has active coupon: show badge with discount value (₹ or %).
 * If user does not have active coupon: on detail page only, show "Buy & get ₹200 Coupon".
 */
export function getCouponDisplayState(
  product: { price: number; originalPrice: number },
  user: unknown,
  options?: { page: 'card' | 'detail' },
): CouponDisplayState {
  if (!user) return { show: false };
  if (product.price < COUPON_MESSAGE_MIN_PRICE) return { show: false };
  if (isProductDiscounted(product)) return { show: false };

  const { has, coupon } = getUserHasActiveDefaultCoupon(user);
  if (has && coupon) {
    const discountDisplay = `₹${coupon.discountAmount.toLocaleString('en-IN')}`;
    return { show: true, type: 'has_coupon', discountDisplay };
  }

  if (options?.page === 'detail') {
    return {
      show: true,
      type: 'get_coupon',
      message: `Buy this product & get a ₹${DEFAULT_COUPON_DISCOUNT} Coupon`,
    };
  }

  return { show: false };
}

// --- Coupon History (used / expired / cancelled) ---

export function getCouponHistory(): CouponHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COUPON_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addToCouponHistory(
  entry: Omit<CouponHistoryEntry, 'id'>,
): void {
  if (typeof window === 'undefined') return;
  const list = getCouponHistory();
  const newEntry: CouponHistoryEntry = {
    ...entry,
    id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  };
  list.unshift(newEntry);
  localStorage.setItem(COUPON_HISTORY_KEY, JSON.stringify(list));
}

/** Call after successful order: moves applied coupon to history with orderId and status 'used'. */
export function moveAppliedCouponToHistoryOnOrderSuccess(
  orderId: string,
  couponCode: string,
  discountAmount: number,
): void {
  addToCouponHistory({
    couponCode: couponCode.trim().toUpperCase(),
    discountAmount,
    orderId,
    usedAt: new Date().toISOString(),
    status: 'used',
  });
}

/** Ensures expired stored coupons appear in history (run once on My Coupons page load). */
export function ensureExpiredCouponsInHistory(): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  const stored = getStoredCoupons();
  const history = getCouponHistory();
  const codesInHistory = new Set(history.map((h) => h.couponCode.toUpperCase()));

  for (const coupon of stored) {
    if (coupon.expiryDate >= today) continue;
    const codeUpper = coupon.code.toUpperCase();
    if (codesInHistory.has(codeUpper)) continue;

    addToCouponHistory({
      couponCode: codeUpper,
      discountAmount: coupon.discountAmount,
      orderId: '',
      usedAt: coupon.expiryDate + 'T23:59:59.000Z',
      status: 'expired',
    });
    codesInHistory.add(codeUpper);
  }
}

