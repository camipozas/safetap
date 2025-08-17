export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeStickers: number;
  pendingPayments: number;
  thisMonthUsers: number;
  thisMonthOrders: number;
  thisMonthRevenue: number;
  userGrowth: number;
  orderGrowth: number;
  revenueGrowth: number;
}

export interface OrderWithDetails {
  id: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    country: string | null;
  };
  sticker: {
    id: string;
    slug: string;
    serial: string;
    nameOnSticker: string;
    status: string;
  } | null;
  amountCents: number;
  currency: string;
  method: string;
  reference: string;
  status: string;
  receivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsData {
  revenue: {
    labels: string[];
    data: number[];
  };
  orders: {
    labels: string[];
    data: number[];
  };
  users: {
    labels: string[];
    data: number[];
  };
  stickerStatus: {
    labels: string[];
    data: number[];
  };
  paymentMethods: {
    labels: string[];
    data: number[];
  };
  countryDistribution: {
    labels: string[];
    data: number[];
  };
}

export interface UserWithStats {
  id: string;
  email: string;
  name: string | null;
  country: string | null;
  role: string;
  createdAt: Date;
  _count: {
    stickers: number;
    payments: number;
  };
  totalSpent: number;
}
