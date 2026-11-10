// Re-export types and pure helpers needed by storefront components

export type {
  Product,
  ProductVariant,
  ProductCalculatedPrice,
  MerchantCategory,
  CategoryTile,
  Banner,
  BannerLinkType,
  StorefrontContent,
  HomeSection,
  FooterContent,
  FooterNetwork,
  FooterPageSlug,
  FooterPage,
  RichBlock,
  RichInline,
  RichListBlock,
  RichListItem,
  RichText,
  RichLink,
  Region,
  Order,
  Cart,
  LineItem,
  Address,
  ShippingOption,
  Customer,
} from "@/lib/medusa";

export {
  formatPrice,
  cleanCategoryHandle,
  bannerHref,
  STORE_NAME,
  FOOTER_NETWORK_NAMES,
  getFooterSettings,
  getDerivedOrderStatus,
  getDerivedPaymentStatus,
} from "@/lib/medusa";

