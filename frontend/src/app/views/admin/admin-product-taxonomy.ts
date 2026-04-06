/** Must match backend `ProductCategories` */
export const PRODUCT_CATEGORIES = [
  'Hoodie',
  'Sneakers',
  'Shirt',
  'T-shirt',
  'Sweat pants',
  'Jeans pants',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function sizesForCategory(category: string): string[] {
  switch (category) {
    case 'Sneakers':
      return ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
    case 'Jeans pants':
      return ['28', '30', '32', '34', '36', '38'];
    case 'Hoodie':
    case 'Shirt':
    case 'T-shirt':
    case 'Sweat pants':
    default:
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  }
}
