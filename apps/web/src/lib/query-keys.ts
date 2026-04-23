export const queryKeys = {
  services: () => ["services"] as const,
  service: (serviceId: string) => ["service", serviceId] as const,
  logs: (serviceId: string, filters: Record<string, unknown>) =>
    ["logs", serviceId, filters] as const,
  singleLog: (serviceId: string, logId: string) =>
    ["log", serviceId, logId] as const,
  overviewStats: (serviceId: string, filters: Record<string, unknown>) =>
    ["overview-stats", serviceId, filters] as const,
  timeseriesStats: (serviceId: string, filters: Record<string, unknown>) =>
    ["timeseries-stats", serviceId, filters] as const,
  statusBreakdown: (serviceId: string, filters: Record<string, unknown>) =>
    ["status-breakdown", serviceId, filters] as const,
  logLevelBreakdown: (serviceId: string, filters: Record<string, unknown>) =>
    ["log-level-breakdown", serviceId, filters] as const,
  topEndpoints: (serviceId: string, filters: Record<string, unknown>) =>
    ["top-endpoints", serviceId, filters] as const,
  errorGroups: (serviceId: string, filters: Record<string, unknown>) =>
    ["error-groups", serviceId, filters] as const,
  // user: () => ["user"] as const,
  // cart: () => ["cart"] as const,
  // product: (id: string) => ["product", id] as const,
  // relatedProducts: (id: string) => ["related-products", id] as const,
  // featuredProduct: () => ["featured-product"] as const,
  // latestProducts: () => ["latest-products"] as const,
  // topCategories: () => ["top-categories"] as const,
  // trendingProducts: () => ["trending-products"] as const,
  // shopProducts: (
  //   params: Record<string, string | number | boolean | undefined> = {},
  // ) => ["shop-products", params] as const,
  // searchProducts: (query: string) => ["search-products", query] as const,
  // allCategories: () => ["all-categories"] as const,
  // adminStats: () => ["admin", "stats"] as const,
  // adminMonthlyStats: () => ["admin", "stats", "monthly"] as const,
  // adminUsers: (
  //   params: Record<string, string | number | boolean | undefined> = {},
  // ) => ["admin", "users", params] as const,
  // adminCategories: (
  //   params: Record<string, string | number | boolean | undefined> = {},
  // ) => ["admin", "categories", params] as const,
  // adminProducts: (
  //   params: Record<string, string | number | boolean | undefined> = {},
  // ) => ["admin", "products", params] as const,
  // adminOrders: (
  //   params: Record<string, string | number | boolean | undefined> = {},
  // ) => ["admin", "orders", params] as const,
};
