import axios from 'axios';
import { signOutFirebase } from '../utils/firebase';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tera_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Real API client exports without silent mock fallbacks in normal mode
export const authApi = {
  login: async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data?.access_token) {
      localStorage.setItem('tera_token', res.data.access_token);
      localStorage.setItem('tera_user', JSON.stringify(res.data));
    }
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  getUsers: async () => {
    const res = await api.get('/auth/users');
    return res.data;
  },
  createUser: async (data: { username: string; email: string; password: string; role: string; full_name: string }) => {
    const res = await api.post('/auth/users', data);
    return res.data;
  },
  updateUser: async (userId: string, data: { email?: string; role?: string; full_name?: string; is_active?: boolean; password?: string }) => {
    const res = await api.patch(`/auth/users/${userId}`, data);
    return res.data;
  },
  deleteUser: async (userId: string) => {
    const res = await api.delete(`/auth/users/${userId}`);
    return res.data;
  },
  register: async (data: { username: string; email: string; password: string; full_name: string; role?: string; invitation_code?: string }) => {
    const res = await api.post('/auth/register', data);
    if (res.data?.access_token) {
      localStorage.setItem('tera_token', res.data.access_token);
      localStorage.setItem('tera_user', JSON.stringify(res.data));
    }
    return res.data;
  },
  firebaseLogin: async (data: {
    firebase_token: string;
    requested_role?: string;
    invitation_code?: string;
    full_name?: string;
    email?: string;
  }) => {
    const res = await api.post('/auth/firebase-login', data);
    if (res.data?.access_token) {
      localStorage.setItem('tera_token', res.data.access_token);
      localStorage.setItem('tera_user', JSON.stringify(res.data));
    }
    return res.data;
  },
  approveUser: async (userId: string, notes?: string) => {
    const res = await api.post(`/auth/users/${userId}/approve`, null, { params: { notes } });
    return res.data;
  },
  suspendUser: async (userId: string, reason?: string) => {
    const res = await api.post(`/auth/users/${userId}/suspend`, null, { params: { reason } });
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('tera_token');
    localStorage.removeItem('tera_user');
    signOutFirebase();
  },

  getAuditLogs: async (limit: number = 50) => {
    const res = await api.get(`/auth/audit-logs?limit=${limit}`);
    return res.data;
  }
};

export const sqlApi = {
  execute: async (sqlQuery: string) => {
    const res = await api.post('/sql/execute', { sql_query: sqlQuery });
    return res.data;
  }
};

export const dashboardApi = {
  getMetrics: async () => {
    const res = await api.get('/dashboard/metrics');
    return res.data;
  },
  getAlerts: async () => {
    const res = await api.get('/dashboard/alerts');
    return res.data;
  }
};

export const hospitalsApi = {
  getAll: async (params?: { status?: string; emergency_level?: string; limit?: number }) => {
    const res = await api.get('/hospitals', { params });
    return res.data;
  },
  getById: async (hospitalId: string) => {
    const res = await api.get(`/hospitals/${hospitalId}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/hospitals', data);
    return res.data;
  },
  update: async (hospitalId: string, data: any) => {
    const res = await api.patch(`/hospitals/${hospitalId}`, data);
    return res.data;
  },
  delete: async (hospitalId: string) => {
    const res = await api.delete(`/hospitals/${hospitalId}`);
    return res.data;
  }
};

export const incidentsApi = {
  getAll: async (params?: { status?: string; severity?: string; my_reports?: boolean; reporter_id?: string; tracking_codes?: string; limit?: number }) => {
    const res = await api.get('/incidents', { params });
    return res.data;
  },
  getMyReports: async () => {
    const res = await api.get('/incidents/my-reports');
    return res.data;
  },
  getById: async (incidentId: string) => {
    const res = await api.get(`/incidents/${incidentId}`);
    return res.data;
  },
  reportEmergency: async (data: {
    incident_type: string;
    description: string;
    severity?: string;
    latitude: number;
    longitude: number;
    country?: string;
    state?: string;
    district?: string;
    city?: string;
    locality?: string;
    landmark?: string;
    location_name: string;
    estimated_patient_count: number;
    reporter_name?: string;
    reporter_contact?: string;
    reporter_consent?: boolean;
    voice_transcript?: string;
    detected_language?: string;
    location_accuracy_meters?: number;
    is_location_verified?: boolean;
    evidence_urls?: any[];
    structured_extraction?: any;
    idempotency_key?: string;
  }) => {
    const res = await api.post('/incidents/report', data);
    return res.data;
  },
  create: async (data: {
    incident_type: string;
    description: string;
    severity: string;
    latitude: number;
    longitude: number;
    country?: string;
    state?: string;
    district?: string;
    city?: string;
    locality?: string;
    landmark?: string;
    location_name: string;
    estimated_patient_count: number;
  }) => {
    const res = await api.post('/incidents', data);
    return res.data;
  },
  transitionStatus: async (incidentId: string, newStatus: string) => {
    const res = await api.patch(`/incidents/${incidentId}/status`, null, { params: { new_status: newStatus } });
    return res.data;
  },
  update: async (incidentId: string, data: any) => {
    const res = await api.patch(`/incidents/${incidentId}`, data);
    return res.data;
  },
  trackByCode: async (trackingCode: string) => {
    const res = await api.get(`/incidents/track/${encodeURIComponent(trackingCode.trim())}`);
    return res.data;
  },
  linkDuplicate: async (incidentId: string, masterIncidentId: string) => {
    const res = await api.post(`/incidents/${incidentId}/link-duplicate`, null, { params: { master_incident_id: masterIncidentId } });
    return res.data;
  },
  delete: async (incidentId: string) => {
    const res = await api.delete(`/incidents/${incidentId}`);
    return res.data;
  },
  getPdfUrl: (incidentId: string, trackingToken?: string) => {
    const base = `/api/incidents/${encodeURIComponent(incidentId)}/pdf`;
    if (trackingToken) {
      return `${base}?tracking_token=${encodeURIComponent(trackingToken)}`;
    }
    return base;
  }
};


export const ambulancesApi = {
  getAll: async (params?: { status?: string; ambulance_type?: string; limit?: number }) => {
    const res = await api.get('/ambulances', { params });
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/ambulances', data);
    return res.data;
  },
  updateStatus: async (ambulanceId: string, status: string, reason?: string) => {
    const res = await api.patch(`/ambulances/${ambulanceId}/status`, null, { params: { status, reason } });
    return res.data;
  },
  delete: async (ambulanceId: string) => {
    const res = await api.delete(`/ambulances/${ambulanceId}`);
    return res.data;
  }
};

export const resourcesApi = {
  getAll: async (params?: { resource_type?: string; status?: string; hospital_id?: string; limit?: number }) => {
    const res = await api.get('/resources', { params });
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/resources', data);
    return res.data;
  },
  adjust: async (resourceId: string, delta: number, reason?: string) => {
    const res = await api.patch(`/resources/${resourceId}/adjust`, null, { params: { delta, reason } });
    return res.data;
  },
  delete: async (resourceId: string) => {
    const res = await api.delete(`/resources/${resourceId}`);
    return res.data;
  }
};

export const roadsApi = {
  getAll: async (params?: { blocked_only?: boolean; limit?: number }) => {
    const res = await api.get('/roads', { params });
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/roads', data);
    return res.data;
  },
  toggleBlock: async (roadId: string, blocked: boolean) => {
    const res = await api.patch(`/roads/${roadId}/block`, null, { params: { blocked } });
    return res.data;
  },
  delete: async (roadId: string) => {
    const res = await api.delete(`/roads/${roadId}`);
    return res.data;
  }
};

export const teamsApi = {
  getAll: async () => {
    const res = await api.get('/teams');
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/teams', data);
    return res.data;
  },
  updateStatus: async (teamId: string, status: string) => {
    const res = await api.patch(`/teams/${teamId}/status`, null, { params: { status } });
    return res.data;
  }
};

export const temporalApi = {
  reconstruct: async (timestamp: string) => {
    const res = await api.get('/temporal/reconstruct', { params: { timestamp } });
    return res.data;
  }
};

export const allocationApi = {
  solve: async (strategy: string = 'BALANCED_TIME_CAPACITY', incidentId?: string) => {
    const res = await api.post('/allocation/solve', null, { params: { strategy, incident_id: incidentId } });
    return res.data;
  },
  commit: async (planId: string, strategy: string = 'BALANCED_TIME_CAPACITY') => {
    const res = await api.post('/allocation/commit', { plan_id: planId, strategy });
    return res.data;
  }
};

export const simulationApi = {
  run: async (payload: any) => {
    const res = await api.post('/simulation/run', payload);
    return res.data;
  }
};

export const analyticsApi = {
  getTrends: async () => {
    const res = await api.get('/analytics/trends');
    return res.data;
  },
  getUtilization: async () => {
    const res = await api.get('/analytics/utilization');
    return res.data;
  }
};

export const performanceApi = {
  getBenchmarks: async () => {
    const res = await api.get('/performance/benchmarks');
    return res.data;
  },
  getExplain: async (queryName: string = 'ACTIVE_INCIDENTS_JOIN_PATIENTS') => {
    const res = await api.get('/performance/explain', { params: { query_name: queryName } });
    return res.data;
  }
};

export const explorerApi = {
  getTables: async () => {
    const res = await api.get('/explorer/tables');
    return res.data;
  },
  getTableData: async (tableName: string, params?: { limit?: number; offset?: number; search?: string }) => {
    const res = await api.get(`/explorer/table/${tableName}`, { params });
    return res.data;
  }
};

export const evidenceApi = {
  upload: async (file: File, mediaCategory: string = 'PHOTO', incidentId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_category', mediaCategory);
    if (incidentId) formData.append('incident_id', incidentId);
    const res = await api.post('/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export const coordinationApi = {
  getResponderAssignments: async () => {
    const res = await api.get('/coordination/responder/assignments');
    return res.data;
  },
  updateAssignmentStatus: async (assignmentId: string, statusUpdate: string, declineReason?: string, notes?: string) => {
    const res = await api.post(`/coordination/responder/assignments/${assignmentId}/update-status`, null, {
      params: { status_update: statusUpdate, decline_reason: declineReason, notes }
    });
    return res.data;
  },
  getHospitalProfile: async () => {
    const res = await api.get('/coordination/hospital/profile');
    return res.data;
  },
  updateHospitalCapacity: async (icu: number, er: number, gen: number, status?: string) => {
    const res = await api.post('/coordination/hospital/capacity', null, {
      params: { icu_available: icu, emergency_available: er, general_available: gen, hospital_status: status }
    });
    return res.data;
  },
  getHospitalReferrals: async () => {
    const res = await api.get('/coordination/hospital/referrals');
    return res.data;
  },
  respondReferral: async (assignmentId: string, action: string, reason?: string) => {
    const res = await api.post(`/coordination/hospital/referrals/${assignmentId}/respond`, null, {
      params: { action, reason }
    });
    return res.data;
  }
};


export const voiceApi = {
  transcribeAudio: async (audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    const res = await api.post('/voice/transcriptions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  extractEntities: async (transcript: string, userCorrected?: string) => {
    const res = await api.post('/voice/extract-entities', {
      transcript,
      user_corrected: userCorrected
    });
    return res.data;
  },
  correctTranscript: async (originalTranscript: string, userCorrectedTranscript: string, incidentId?: string) => {
    const res = await api.post('/voice/correct-transcript', {
      original_transcript: originalTranscript,
      user_corrected_transcript: userCorrectedTranscript,
      incident_id: incidentId
    });
    return res.data;
  },
  getHealth: async () => {
    const res = await api.get('/voice/health');
    return res.data;
  }
};

export const geocodingApi = {
  reverseGeocode: async (lat: number, lng: number) => {
    const res = await api.get('/geocoding/reverse', { params: { lat, lng } });
    return res.data;
  }
};

export interface StatisticsData {
  year_range: string;
  source: string;
  national_totals_2023: {
    total_accidents: number;
    fatalities: number;
    injuries: number;
    daily_average_fatalities: number;
    vulnerable_road_users_pct: number;
  };
  annual_trends: Array<{ year: string; accidents: number; fatalities: number; injuries: number }>;
  fatalities_by_road_user: Array<{ category: string; percentage: number; count: number }>;
  road_type_distribution: Array<{ type: string; fatal_pct: number; accidents_pct: number }>;
  contributing_factors: Array<{ factor: string; percentage: number; note: string }>;
  equipment_non_compliance: {
    two_wheeler_deaths_without_helmet_pct: number;
    four_wheeler_deaths_without_seatbelt_pct: number;
  };
}

export interface QuizQuestion {
  id: string;
  category: string;
  scenario?: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  citation: string;
  difficulty: string;
}

export interface FamilyStory {
  id: string;
  title: string;
  character: string;
  tagline: string;
  quote: string;
  story: string;
  safety_principle: string;
  takeaways: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface UserProgress {
  user_id: string;
  total_xp: number;
  level: number;
  level_title: string;
  quizzes_completed: number;
  quiz_accuracy_pct: number;
  games_completed: number;
  lessons_read: number;
  lessons_completed?: number;
  streak_days: number;
  earned_badges: string[];
  case_studies_completed?: number;
  family_pledge_signed?: boolean;
}

export interface AccidentCaseStudy {
  id: string;
  title: string;
  accident_type: string;
  accident_type_label: string;
  road_user_category: string;
  contributing_factors: string[];
  location: string;
  date: string;
  sensitivity_label: string;
  summary: string;
  image_url?: string;
  image_caption?: string;
  what_happened: string;
  what_do_we_know: {
    confirmed_facts: string[];
    preliminary_or_unconfirmed: string[];
    unknown_details: string[];
  };
  how_crash_occurred: {
    immediate_sequence: string;
    contributing_factors: string[];
    road_and_environment: string;
    vehicle_and_occupant_factors: string;
  };
  prevention_measures: string[];
  road_user_takeaways: {
    two_wheeler_riders: string;
    car_drivers_and_passengers: string;
    heavy_vehicle_drivers: string;
    road_authorities: string;
    pedestrians_and_cyclists?: string;
  };
  quiz: Array<{
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
  }>;
  sources: Array<{
    title: string;
    publisher: string;
    publication_date: string;
    url: string;
  }>;
}

export interface OfficialCampaignVideo {
  id: string;
  title: string;
  publisher: string;
  duration: string;
  topic: string;
  embed_url: string;
  external_url: string;
  thumbnail: string;
  description: string;
  key_takeaway: string;
}

export interface CampaignData {
  hero: {
    headline: string;
    subheadline: string;
    slogans: string[];
    hero_image: string;
    hero_image_caption: string;
    call_to_actions: Array<{
      id: string;
      title: string;
      description: string;
      target_tab: string;
      icon: string;
    }>;
  };
  stories: Array<FamilyStory & {
    story_theme?: string;
    practical_action?: string;
    related_activity_tab?: string;
    related_activity_title?: string;
    image_url?: string;
  }>;
  videos: OfficialCampaignVideo[];
}

export interface Badge {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  criteria: string;
  xp_reward: number;
  unlocked: boolean;
  earned_at: string | null;
  reason: string | null;
  current_progress: number;
  max_progress: number;
  progress_percentage: number;
}

export interface ActivityCompletionResponse {
  status: string;
  message: string;
  xp_awarded: number;
  current_total_xp: number;
  current_level: number;
  current_level_title: string;
  newly_unlocked_badges: Array<{
    id: string;
    title: string;
    category: string;
    description: string;
    icon: string;
    xp_reward: number;
    earned_at: string;
  }>;
  earned_badges: string[];
}

export const exploreApi = {
  getStatistics: async (): Promise<StatisticsData> => {
    const res = await api.get('/explore/statistics');
    const d = res.data;
    if (d.national_totals_2023) return d;
    return {
      year_range: '2018-2023',
      source: (d.sources && d.sources[0]?.title) || 'MoRTH Road Accidents in India 2023',
      national_totals_2023: {
        total_accidents: d.key_kpis?.total_accidents || 461312,
        fatalities: d.key_kpis?.total_fatalities || 168491,
        injuries: d.key_kpis?.total_injuries || 443366,
        daily_average_fatalities: d.key_kpis?.daily_fatalities_avg || 462,
        vulnerable_road_users_pct: 67.8
      },
      annual_trends: (d.annual_trends || []).map((t: any) => ({
        year: String(t.year),
        accidents: t.total_accidents || t.accidents,
        fatalities: t.fatalities,
        injuries: t.injuries
      })),
      fatalities_by_road_user: d.fatalities_by_road_user || [],
      road_type_distribution: d.road_type_distribution || [
        { type: 'National Highways (2.1% network)', fatal_pct: 36.4, accidents_pct: 32.9 },
        { type: 'State Highways (3.0% network)', fatal_pct: 24.1, accidents_pct: 23.1 },
        { type: 'Other District & City Roads (94.9%)', fatal_pct: 39.5, accidents_pct: 44.0 }
      ],
      contributing_factors: (d.contributing_factors || []).map((f: any) => ({
        factor: f.factor || f.name,
        percentage: f.percentage || f.share_pct,
        note: f.note || f.preventable_with || ''
      })),
      equipment_non_compliance: d.equipment_non_compliance || {
        two_wheeler_deaths_without_helmet_pct: 73.8,
        four_wheeler_deaths_without_seatbelt_pct: 83.2
      }
    };
  },
  getCampaign: async (): Promise<CampaignData> => {
    const res = await api.get('/explore/campaign');
    return res.data;
  },
  getCaseStudies: async (params?: { category?: string; road_user?: string; search?: string }): Promise<{
    total: number;
    categories: string[];
    case_studies: AccidentCaseStudy[];
  }> => {
    const res = await api.get('/explore/case-studies', { params });
    return res.data;
  },
  getCaseStudy: async (caseId: string): Promise<AccidentCaseStudy> => {
    const res = await api.get(`/explore/case-studies/${caseId}`);
    return res.data;
  },
  getBadges: async (sessionId?: string): Promise<{
    total_badges: number;
    earned_count: number;
    locked_count: number;
    badges: Badge[];
  }> => {
    const res = await api.get('/explore/badges', { params: { session_id: sessionId } });
    return res.data;
  },
  getScenarios: async () => {
    const res = await api.get('/explore/scenarios');
    return res.data?.scenarios || res.data;
  },
  getHazards: async () => {
    const res = await api.get('/explore/hazards');
    return res.data?.levels || res.data;
  },
  getQuizzes: async (params?: { category?: string; difficulty?: string }): Promise<QuizQuestion[]> => {
    const res = await api.get('/explore/quizzes', { params });
    return res.data?.questions || res.data;
  },
  getStories: async (): Promise<FamilyStory[]> => {
    const res = await api.get('/explore/stories');
    return res.data?.stories || res.data;
  },
  getAchievements: async (): Promise<Achievement[]> => {
    const res = await api.get('/explore/achievements');
    return res.data;
  },
  getProgress: async (sessionId?: string): Promise<UserProgress> => {
    const res = await api.get('/explore/progress', { params: { session_id: sessionId } });
    return res.data?.progress || res.data;
  },
  completeActivity: async (data: {
    session_id?: string;
    activity_type: string;
    activity_id: string;
    score?: number;
    passed?: boolean;
    metadata?: any;
  }): Promise<ActivityCompletionResponse> => {
    const res = await api.post('/explore/activity/complete', data);
    return res.data;
  },
  updateProgress: async (data: {
    session_id?: string;
    xp_earned: number;
    activity_type: string;
    activity_id: string;
    passed?: boolean;
    achievement_id?: string;
    pledge_name?: string;
  }) => {
    const res = await api.post('/explore/progress', data);
    return res.data;
  },
  signPledge: async (data: {
    pledge_name: string;
    family_members_count?: number;
    commitments: string[];
  }) => {
    const res = await api.post('/explore/pledge', data);
    return res.data;
  }
};

export default api;

