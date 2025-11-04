/**
 * Interfaces para Dashboard
 * Baseado na estrutura do backend: /api/dashboard
 */

export interface DashboardPeriod {
  type: "7d" | "30d" | "90d";
  days: number;
  start_date: string;
  end_date: string;
}

export interface UserWallet {
  points: number;
  balance: number;
  updated_at: string;
}

export interface UserActivity {
  purchases_count: number;
  transfers_count: number;
  friends_count: number;
}

export interface UserStats {
  user_id: number;
  wallet: UserWallet;
  activity: UserActivity;
}

export interface PointsStats {
  current_balance: number;
  pending: number;
  total_available: number;
  balance: number;
  period: {
    earned: number;
    spent: number;
    net: number;
    transactions: number;
  };
}

export interface PurchaseStats {
  total_count: number;
  confirmed_count: number;
  pending_count: number;
  rejected_count: number;
  total_amount: number;
  confirmed_amount: number;
  total_points_earned: number;
  confirmed_points_earned: number;
  pending_points: number;
  avg_amount: number;
  max_amount: number;
  min_amount: number;
  top_establishments: Array<{
    establishment_id: string;
    name: string;
    visits: number;
    total_spent: number;
    total_points: number;
  }>;
}

export interface TransferStats {
  total_count: number;
  sent_count: number;
  received_count: number;
  points_sent: number;
  points_received: number;
  net_points: number;
  avg_amount: number;
  max_amount: number;
  top_friends: Array<{
    friend_id: number;
    name: string;
    user_code: string;
    transfer_count: number;
    total_amount: number;
  }>;
}

export interface FriendsStats {
  total: number;
  new_in_period: number;
  pending_requests: number;
  most_active: Array<{
    friend_id: number;
    name: string;
    user_code: string;
    interaction_count: number;
    total_interaction_amount: number;
  }>;
}

export interface EstablishmentsStats {
  visited_count: number;
  favorites: Array<{
    establishment_id: string;
    name: string;
    type: string;
    visit_count: number;
    total_spent: number;
    total_points_earned: number;
  }>;
}

export interface TimelineDataPoint {
  date: string;
  earned?: number;
  spent?: number;
  net?: number;
  count?: number;
  amount?: number;
  points?: number;
}

export interface DistributionDataPoint {
  status?: string;
  type?: string;
  establishment_id?: string;
  name?: string;
  count: number;
  amount?: number;
  total_points?: number;
}

export interface ChartsData {
  points_timeline: TimelineDataPoint[];
  purchases_timeline: TimelineDataPoint[];
  purchases_by_status: DistributionDataPoint[];
  transfers_distribution: DistributionDataPoint[];
  purchases_by_establishment: DistributionDataPoint[];
}

export interface Activity {
  type: "purchase" | "transfer" | "points" | "friend";
  id: string;
  code?: string;
  title: string;
  description: string;
  amount?: number;
  points?: number;
  status?: string;
  created_at: string;
}

export interface Trend {
  trend: "up" | "down" | "stable";
  percentage: number;
  current: number;
  previous: number;
}

export interface Projection {
  avg_points_per_day: number;
  projected_points_30_days: number;
  days_analyzed: number;
}

export interface Insight {
  type: "positive" | "negative" | "warning" | "info";
  title: string;
  message: string;
}

export interface Trends {
  purchases: Trend;
  amount: Trend;
  points: Trend;
  projection: Projection;
  insights: Insight[];
}

export interface DashboardSummary {
  total_points: number;
  total_purchases: number;
  total_transfers: number;
  total_friends: number;
  total_establishments: number;
  pending_points: number;
  activity_score: number;
}

export interface DashboardData {
  period: DashboardPeriod;
  user: UserStats;
  points: PointsStats;
  purchases: PurchaseStats;
  transfers: TransferStats;
  friends: FriendsStats;
  establishments: EstablishmentsStats;
  charts: ChartsData;
  activities: Activity[];
  trends: Trends;
  summary: DashboardSummary;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  message?: string;
}

export interface DashboardMetricsResponse {
  success: boolean;
  data: {
    type: string;
    period: string;
    metrics: PointsStats | PurchaseStats | TransferStats | FriendsStats;
  };
}

export interface DashboardChartsResponse {
  success: boolean;
  data: {
    type: string;
    period: string;
    charts: ChartsData | Partial<ChartsData>;
  };
}

export interface DashboardActivitiesResponse {
  success: boolean;
  data: {
    activities: Activity[];
    total: number;
  };
}


