export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Rocken My Vibe';
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
  'Style Your Soul & Your Body Will Thank You For';
export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.rooms4rentlv.com';
export const LATEST_PRODUCTS_LIMIT =
  Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;


export const NEXTAUTH_URL = process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'https://www.rockenmyvibe.com';
export const signInDefaultValues = {
  email: 'allenyoung1979@yahoo.com',
  password: 'NewLove2044$&@*',
};

export const signUpDefaultValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const shippingAddressDefaultValues = {
  fullName: '',
  streetAddress: '',
  city: '',
  postalCode: '',
  country: '',
};

export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(', ')
  : ['PayPal', 'Stripe', 'CashOnDelivery'];
export const DEFAULT_PAYMENT_METHOD =
  process.env.DEFAULT_PAYMENT_METHOD || 'Stripe';

export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 12;

export const productDefaultValues = {
  name: '',
  slug: '',
  category: '',
  images: [],
  brand: '',
  description: '',
  price: '0',
  stock: 0,
  rating: '0',
  numReviews: '0',
  isFeatured: false,
  banner: null,
  colorIds: [],
  sizeIds: [],
};

export const USER_ROLES = process.env.USER_ROLES
  ? process.env.USER_ROLES.split(', ')
  : ['admin', 'user'];

export const reviewFormDefaultValues = {
  title: '',
  comment: '',
  rating: 0,
};

export const SENDER_EMAIL = process.env.SENDER_EMAIL || 'vegaswarrior888@gmail.com';
