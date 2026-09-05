import { apiRequest } from './apiClient';

export interface ImpactStory {
  story_id: string;
  title: string;
  description: string;
  date_added: string;
  outcome_type: 'arrest' | 'fine' | 'reform' | 'policy_change' | 'other';
  public_slug: string;
  share_count: number;
  report_reference: string | null;
  case_reference: string | null;
  institution_name: string | null;
}

export interface AdminImpactStory extends ImpactStory {
  review_status: 'pending' | 'approved' | 'rejected';
  is_anonymous: boolean;
}

export const impactStoriesApi = {
  getPublicStories: async (outcomeType?: string): Promise<ImpactStory[]> => {
    let url = '/public/impact-stories';
    if (outcomeType && outcomeType !== 'all') {
      url += `?outcome=${outcomeType}`;
    }
    const response = await apiRequest<{ stories: ImpactStory[] }>(url);
    return response.stories;
  },

  getStoryBySlug: async (slug: string): Promise<ImpactStory> => {
    const response = await apiRequest<{ story: ImpactStory }>(`/public/impact-stories/${slug}`);
    return response.story;
  },

  shareStory: async (slug: string): Promise<number> => {
    const response = await apiRequest<{ shareCount: number }>(`/public/impact-stories/${slug}/share`, { method: 'POST' });
    return response.shareCount;
  },

  getAdminStories: async (): Promise<AdminImpactStory[]> => {
    const response = await apiRequest<{ stories: AdminImpactStory[] }>('/admin/transparency/impact-stories');
    return response.stories;
  },

  createStory: async (data: {
    title: string;
    description: string;
    outcomeType: string;
    isAnonymous: boolean;
    reportId?: string;
    caseId?: string;
    institutionId?: string;
  }): Promise<ImpactStory> => {
    const response = await apiRequest<{ story: ImpactStory }>('/admin/transparency/impact-stories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.story;
  },

  reviewStory: async (storyId: string, approved: boolean): Promise<{ review_status: string }> => {
    const response = await apiRequest<{ story: { review_status: string } }>(`/admin/transparency/impact-stories/${storyId}/review`, {
      method: 'POST',
      body: JSON.stringify({ approved }),
    });
    return response.story;
  }
};
