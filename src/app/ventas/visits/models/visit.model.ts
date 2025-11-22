export interface Video {
  id: number;
  visit_id: string;
  name: string;
  file_status: string | null;
  find: string | null;
  filename_url: string | null;
  filename_url_processed: string | null;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface VideosResponse {
  videos: Video[];
  pagination: Pagination;
}
