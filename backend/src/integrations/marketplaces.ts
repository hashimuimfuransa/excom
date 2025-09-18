// Integration stubs for external marketplaces
// Replace with real SDKs/APIs (Amazon, eBay, Alibaba, Shopify)

export async function fetchAmazonProducts(query: string) {
  return [{ id: 'amz-1', title: `Amazon: ${query}` }];
}

export async function fetchEbayProducts(query: string) {
  return [{ id: 'ebay-1', title: `eBay: ${query}` }];
}

export async function fetchAlibabaProducts(query: string) {
  return [{ id: 'ali-1', title: `Alibaba: ${query}` }];
}

export async function fetchShopifyProducts(query: string) {
  return [{ id: 'shop-1', title: `Shopify: ${query}` }];
}