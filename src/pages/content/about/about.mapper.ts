import type { AboutDraft, AboutDraftPayload } from '../../../types/about';
import type { AboutFormValues } from './about.schema';

export function createClientId(): string {
  return crypto.randomUUID();
}

export function draftToFormValues(draft: AboutDraft): AboutFormValues {
  return {
    title: draft.title,
    hero: {
      mediaId: draft.hero.mediaId,
      imageUrl: draft.hero.imageUrl,
      imageAlt: draft.hero.imageAlt,
    },
    overview: {
      title: draft.overview.title,
      paragraphs: draft.overview.paragraphs.map((text) => ({ text })),
    },
    statistics: [...draft.statistics]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((stat) => ({ ...stat })),
    highlightsSectionTitle: draft.highlightsSectionTitle,
    highlights: [...draft.highlights]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((highlight) => ({ ...highlight })),
    milestonesSectionTitle: draft.milestonesSectionTitle,
    milestones: [...draft.milestones]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((milestone) => ({ ...milestone })),
  };
}

/** Normalizes sortOrder to 0..n-1 by current array order and drops the RHF-only paragraph wrapper. */
export function formValuesToDraftPayload(values: AboutFormValues, version: number): AboutDraftPayload {
  return {
    version,
    title: values.title,
    hero: {
      mediaId: values.hero.mediaId,
      imageUrl: values.hero.imageUrl,
      imageAlt: values.hero.imageAlt,
    },
    overview: {
      title: values.overview.title,
      paragraphs: values.overview.paragraphs.map((p) => p.text),
    },
    statistics: values.statistics.map((stat, index) => ({ ...stat, sortOrder: index })),
    highlightsSectionTitle: values.highlightsSectionTitle,
    highlights: values.highlights.map((highlight, index) => ({ ...highlight, sortOrder: index })),
    milestonesSectionTitle: values.milestonesSectionTitle,
    milestones: values.milestones.map((milestone, index) => ({ ...milestone, sortOrder: index })),
  };
}

export function createEmptyStatistic(): AboutFormValues['statistics'][number] {
  return { id: createClientId(), sortOrder: 0, isActive: true, value: '', unit: '', label: '' };
}

export function createEmptyHighlight(): AboutFormValues['highlights'][number] {
  return { id: createClientId(), sortOrder: 0, isActive: true, title: '', description: '', imageAlt: '' };
}

export function createEmptyMilestone(): AboutFormValues['milestones'][number] {
  return { id: createClientId(), sortOrder: 0, isActive: true, year: '', description: '' };
}
