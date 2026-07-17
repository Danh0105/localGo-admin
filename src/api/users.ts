import type { Paginated } from '../types/api';
import type {
  ApproveBusinessApplicationInput,
  BusinessApplication,
  BusinessApplicationAdminQuery,
} from '../types/business-application';
import type { CurrentUser, UserAdminQuery, UserStatus } from '../types/user';
import {
  approveMockBusinessApplication,
  getMockBusinessApplications,
  getMockUsers,
  rejectMockBusinessApplication,
  setMockUserStatus,
} from '../mocks/user-management.mock';
import { apiClient, unwrap, unwrapPaginated } from './client';

const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export function fetchAdminUsers(query: UserAdminQuery): Promise<Paginated<CurrentUser>> {
  if (useMockData) return getMockUsers(query);
  return unwrapPaginated(apiClient.get('/admin/users', { params: query }));
}

export function updateUserStatus(id: string, status: UserStatus): Promise<CurrentUser> {
  if (useMockData) return setMockUserStatus(id, status);
  return unwrap(apiClient.patch(`/admin/users/${id}/status`, { status }));
}

export function fetchBusinessApplications(
  query: BusinessApplicationAdminQuery,
): Promise<Paginated<BusinessApplication>> {
  if (useMockData) return getMockBusinessApplications(query);
  return unwrapPaginated(apiClient.get('/admin/business-applications', { params: query }));
}

export function approveBusinessApplication(
  id: string,
  input: ApproveBusinessApplicationInput,
): Promise<BusinessApplication> {
  if (useMockData) return approveMockBusinessApplication(id, input);
  return unwrap(apiClient.post(`/admin/business-applications/${id}/approve`, input));
}

export function rejectBusinessApplication(
  id: string,
  reason: string,
): Promise<BusinessApplication> {
  if (useMockData) return rejectMockBusinessApplication(id, reason);
  return unwrap(apiClient.post(`/admin/business-applications/${id}/reject`, { reason }));
}
