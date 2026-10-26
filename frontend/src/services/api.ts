import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
  logout: () => {
    localStorage.removeItem('tera_token');
    localStorage.removeItem('tera_user');
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

export default api;

