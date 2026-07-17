import { apiClient, unwrap } from './client';
import type { AboutAdminState, AboutDraft, AboutDraftPayload, AboutPreview } from '../types/about';

export function normalizeAboutAdminState(state: AboutAdminState): AboutDraft {
  return {
    id: 'about',
    ...state.draft,
    version: state.version,
    hasUnpublishedChanges: state.hasUnpublishedChanges,
    publishedAt: state.publishedAt ?? undefined,
    updatedAt: state.updatedAt,
  };
}

export function fetchAboutAdmin(signal?: AbortSignal): Promise<AboutDraft> {
  return unwrap<AboutAdminState>(apiClient.get('/admin/about', { signal })).then(normalizeAboutAdminState);
}

/** Throws ApiError with status 409 / code 'ABOUT_VERSION_CONFLICT' if `payload.version` is stale. */
export function saveAboutDraft(payload: AboutDraftPayload): Promise<AboutDraft> {
  return unwrap<AboutAdminState>(apiClient.put('/admin/about', payload)).then(normalizeAboutAdminState);
}

export function fetchAboutPreview(signal?: AbortSignal): Promise<AboutPreview> {
  return unwrap(apiClient.get('/admin/about/preview', { signal }));
}

export function publishAbout(): Promise<AboutDraft> {
  return unwrap(apiClient.post('/admin/about/publish'));
}

export function discardAboutDraft(): Promise<AboutDraft> {
  return unwrap<AboutAdminState>(apiClient.post('/admin/about/discard-draft')).then(normalizeAboutAdminState);
}
