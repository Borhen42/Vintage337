/** Shared shape for JSON responses from the Spring API. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
