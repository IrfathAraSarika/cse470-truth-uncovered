import { apiRequest } from './apiClient';

export interface Category {
  category_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export interface Article {
  article_id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  author_id: string;
  author_name?: string;
  author_role?: string;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  cover_image: string | null;
  rejection_reason: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  notification_id: string;
  user_id: string;
  article_id: string | null;
  type: string;
  channel: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export async function getCategories(): Promise<{ categories: Category[] }> {
  return apiRequest('/articles/categories');
}

export async function getFollowedCategories(): Promise<{ follows: string[] }> {
  return apiRequest('/articles/categories/follows');
}

export async function followCategory(categoryId: string): Promise<{ message: string }> {
  return apiRequest(`/articles/categories/${categoryId}/follow`, { method: 'POST' });
}

export async function unfollowCategory(categoryId: string): Promise<{ message: string }> {
  return apiRequest(`/articles/categories/${categoryId}/unfollow`, { method: 'POST' });
}

export async function getArticles(params?: { search?: string; category_id?: string }): Promise<{ articles: Article[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.category_id) query.append('category_id', params.category_id);
  const path = `/articles${query.toString() ? `?${query.toString()}` : ''}`;
  return apiRequest(path);
}

export async function getArticleBySlug(slug: string): Promise<{ article: Article }> {
  return apiRequest(`/articles/slug/${slug}`);
}

export async function getMyArticles(): Promise<{ articles: Article[] }> {
  return apiRequest('/articles/my');
}

export async function createArticle(data: {
  title: string;
  description: string;
  content: string;
  category_id: string;
  cover_image?: string | null;
  status?: string;
}): Promise<{ article: Article }> {
  return apiRequest('/articles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateArticle(
  id: string,
  data: {
    title?: string;
    description?: string;
    content?: string;
    category_id?: string;
    cover_image?: string | null;
  }
): Promise<{ article: Article }> {
  return apiRequest(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function submitArticleForReview(id: string): Promise<{ article: Article }> {
  return apiRequest(`/articles/${id}/submit`, { method: 'POST' });
}

export async function getAdminArticles(): Promise<{ articles: Article[] }> {
  return apiRequest('/articles/admin');
}

export async function reviewArticle(
  id: string,
  decision: 'approve' | 'reject',
  reason?: string
): Promise<{ article: Article }> {
  return apiRequest(`/articles/admin/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason }),
  });
}

export async function deleteArticle(id: string): Promise<{ message: string }> {
  return apiRequest(`/articles/${id}`, { method: 'DELETE' });
}

export async function getMyNotifications(): Promise<{ notifications: AppNotification[] }> {
  return apiRequest('/articles/notifications/my');
}

export async function markNotificationRead(id: string): Promise<{ message: string }> {
  return apiRequest(`/articles/notifications/${id}/read`, { method: 'POST' });
}
