export type MostSoldProduct = {
  productId: number;
  productName: string;
  unitsSold: number;
  imageUrl: string | null;
};

export type AdminDashboardStats = {
  totalArchivists: number;
  archivistGrowthPercent: number;
  revenueLast30Days: number;
  revenuePrior30Days: number;
  mostSoldProduct: MostSoldProduct | null;
};
