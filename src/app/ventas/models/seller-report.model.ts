/**
 * Seller Reports Models
 * Interfaces for seller performance reports
 */

// Status Summary Report (Donut Chart)
export interface StatusSummaryResponse {
  success: boolean;
  message: string;
  data: StatusSummaryData;
}

export interface StatusSummaryData {
  seller_id: string;
  summary: {
    total_orders: number;
    total_amount: number;
  };
  status_summary: StatusSummaryItem[];
}

export interface StatusSummaryItem {
  status: string;
  count: number;
  percentage: number;
  total_amount: number;
}

// Clients Summary Report (Earnings Table)
export interface ClientsSummaryResponse {
  success: boolean;
  message: string;
  data: ClientsSummaryData;
}

export interface ClientsSummaryData {
  seller_id: string;
  summary: {
    total_clients: number;
    total_orders: number;
    total_amount: number;
  };
  clients: ClientEarnings[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
    next_page: number | null;
    prev_page: number | null;
  };
}

export interface ClientEarnings {
  client_id: string;
  client_name: string;
  orders_count: number;
  total_amount: number;
}

// Monthly Summary Report (Line Chart)
export interface MonthlySummaryResponse {
  success: boolean;
  message: string;
  data: MonthlySummaryData;
}

export interface MonthlySummaryData {
  seller_id: string;
  period: {
    start_date: string;
    end_date: string;
    months: number;
  };
  summary: {
    total_orders: number;
    total_amount: number;
  };
  monthly_data: MonthlyDataItem[];
}

export interface MonthlyDataItem {
  year: number;
  month: number;
  month_name: string;
  month_short: string;
  label: string;
  orders_count: number;
  total_amount: number;
}
