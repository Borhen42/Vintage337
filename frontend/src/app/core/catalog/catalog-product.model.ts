export interface ProductVariant {
  size: string;
  color: string;
  stock: number;
}

export interface CatalogProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string | null;
  imageUrl: string;
  imageUrls?: string[];
  variants?: ProductVariant[];
  createdAt: string;
}
