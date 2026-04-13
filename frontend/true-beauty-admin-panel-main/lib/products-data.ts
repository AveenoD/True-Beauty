export type ProductStockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type ProductStatus = "active" | "draft" | "inactive";

export const PRODUCT_CATEGORIES = [
  "Skincare",
  "Makeup",
  "Bath & Body",
  "Haircare",
  "Fragrance",
  "Wellness",
  "Gifting",
  "Jewellery",
  "Offers",
] as const;

export const DEFAULT_STOCK_THRESHOLD = 15;

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  commissionRate?: number;
  stock: number;
  stockStatus: ProductStockStatus;
  status: ProductStatus;
  image?: string | null;
  images?: string[];
  description: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isAffiliateProduct?: boolean;
  /** Product SKU for inventory */
  sku?: string;
  /** Below this count, status is low_stock */
  stockThreshold?: number;
  /** Optional warehouse/shelf location */
  stockLocation?: string;
  /** Optional supplier name */
  supplier?: string;
  /** Optional inventory notes */
  inventoryNotes?: string;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "True Beauty Night Cream",
    category: "Skincare",
    price: 1399,
    commissionRate: 10,
    stock: 45,
    stockStatus: "in_stock",
    status: "active",
    image: "/products/dayCream.png",
    images: ["/products/dayCream.png"],
    description:
      "Luxurious night cream enriched with natural extracts. Deeply nourishes and restores skin overnight for a radiant morning glow.",
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-10T10:00:00Z",
    sku: "TB-NC-001",
    stockThreshold: 15,
  },
  {
    id: "prod-2",
    name: "Vitamin C Face Wash",
    category: "Skincare",
    price: 499,
    commissionRate: 8,
    stock: 8,
    stockStatus: "low_stock",
    status: "active",
    image: "/products/faceWash.png",
    images: ["/products/faceWash.png"],
    description:
      "Gentle cleanser with Vitamin C to brighten and refresh. Suitable for all skin types.",
    createdAt: "2024-02-15T10:00:00Z",
    updatedAt: "2024-02-15T10:00:00Z",
    sku: "TB-VC-002",
    stockThreshold: 15,
  },
  {
    id: "prod-3",
    name: "Hair Growth Serum",
    category: "Haircare",
    price: 899,
    commissionRate: 12,
    stock: 0,
    stockStatus: "out_of_stock",
    status: "inactive",
    image: "/products/serum.png",
    images: ["/products/serum.png"],
    description:
      "Promotes hair growth and reduces breakage. Formulated with biotin and natural oils.",
    createdAt: "2024-03-01T10:00:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
    sku: "TB-HS-003",
    stockThreshold: 15,
  },
  {
    id: "prod-4",
    name: "Sunscreen SPF 50",
    category: "Skincare",
    price: 449,
    commissionRate: 6,
    stock: 120,
    stockStatus: "in_stock",
    status: "active",
    image: "/products/sunscreen.png",
    images: ["/products/sunscreen.png"],
    description:
      "Broad-spectrum protection with a lightweight, non-greasy formula. Water-resistant.",
    createdAt: "2024-04-05T10:00:00Z",
    updatedAt: "2024-04-05T10:00:00Z",
    sku: "TB-SP-004",
    stockThreshold: 15,
  },
  {
    id: "prod-5",
    name: "Lip Balm Set",
    category: "Makeup",
    price: 299,
    commissionRate: 5,
    stock: 25,
    stockStatus: "in_stock",
    status: "draft",
    image: "/products/lipBalm.png",
    images: ["/products/lipBalm.png"],
    description: "Set of 3 nourishing lip balms in different flavors.",
    createdAt: "2024-05-12T10:00:00Z",
    updatedAt: "2024-05-12T10:00:00Z",
    sku: "TB-LB-005",
    stockThreshold: 15,
  },
];

export { MOCK_PRODUCTS };

export function generateProductId(): string {
  return "prod-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
