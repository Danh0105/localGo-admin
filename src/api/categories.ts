import { apiClient, unwrap } from './client';
import type { Category, CategoryDomain, CreateCategoryInput, UpdateCategoryInput } from '../types/category';

/** Admin listing — includes inactive categories so they can be reactivated (public endpoint hides them). */
export function fetchCategoriesByDomain(domain: CategoryDomain): Promise<Category[]> {
  return unwrap(apiClient.get('/admin/categories', { params: { domain } }));
}

export function createCategory(input: CreateCategoryInput): Promise<Category> {
  return unwrap(apiClient.post('/admin/categories', input));
}

export function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  return unwrap(apiClient.patch(`/admin/categories/${id}`, input));
}

export function deleteCategory(id: string): Promise<void> {
  return unwrap(apiClient.delete(`/admin/categories/${id}`));
}
