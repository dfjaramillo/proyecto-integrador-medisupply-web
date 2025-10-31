export interface SalesPlan {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  client_id: string;
  seller_id: string;
  target_revenue: number;
  objectives: string;
  created_at: string;
  updated_at: string;
  client_name: string;
  seller_name: string;
}

export interface SalesPlanPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface SalesPlanListResponse {
  success: boolean;
  message: string;
  data: {
    items: SalesPlan[];
    pagination: SalesPlanPagination;
  };
}

export interface SalesPlanDetailResponse {
  success: boolean;
  message: string;
  data: SalesPlan;
}
