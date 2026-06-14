import type {
  AuthResponse,
  AuthUser,
  BikeModelDto,
  BikeModelInput,
  LoginInput,
  RecommendRequest,
  RecommendResponse,
  SignupInput,
  TenantDto,
  TenantSettingsInput,
} from '@fitwerx/shared';

const TOKEN_KEY = 'fitwerx.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiClientError(
      res.status,
      err.code ?? 'error',
      err.message ?? `Request failed (${res.status})`,
      err.details,
    );
  }
  return data as T;
}

export interface SessionSummary {
  id: string;
  source: string;
  customerName: string | null;
  customerEmail: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface SessionDetail extends SessionSummary {
  rider: RecommendRequest['rider'];
  fit: RecommendResponse['fit'];
  recommendations: RecommendResponse['recommendations'];
  estimatedFields: string[];
}

export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  maskedKey: string;
}

export const api = {
  login: (input: LoginInput) =>
    request<AuthResponse>('/v1/auth/login', { method: 'POST', body: input, auth: false }),
  signup: (input: SignupInput) =>
    request<AuthResponse>('/v1/auth/signup', { method: 'POST', body: input, auth: false }),
  me: () => request<AuthUser>('/v1/auth/me'),

  getTenant: () => request<TenantDto>('/v1/tenant'),
  updateTenant: (input: TenantSettingsInput) =>
    request<TenantDto>('/v1/tenant', { method: 'PATCH', body: input }),

  listModels: () => request<BikeModelDto[]>('/v1/catalog/models'),
  getModel: (id: string) => request<BikeModelDto>(`/v1/catalog/models/${id}`),
  createModel: (input: BikeModelInput) =>
    request<BikeModelDto>('/v1/catalog/models', { method: 'POST', body: input }),
  updateModel: (id: string, input: BikeModelInput) =>
    request<BikeModelDto>(`/v1/catalog/models/${id}`, { method: 'PUT', body: input }),
  deleteModel: (id: string) =>
    request<{ deleted: boolean }>(`/v1/catalog/models/${id}`, { method: 'DELETE' }),

  recommend: (input: RecommendRequest) =>
    request<RecommendResponse>('/v1/fit/recommend', { method: 'POST', body: input }),

  listSessions: () => request<SessionSummary[]>('/v1/fit/sessions'),
  getSession: (id: string) => request<SessionDetail>(`/v1/fit/sessions/${id}`),

  listApiKeys: () => request<ApiKeySummary[]>('/v1/tenant/api-keys'),
  createApiKey: (name: string) =>
    request<{ id: string; name: string; prefix: string; key: string; createdAt: string }>(
      '/v1/tenant/api-keys',
      { method: 'POST', body: { name } },
    ),
  revokeApiKey: (id: string) =>
    request<{ revoked: boolean }>(`/v1/tenant/api-keys/${id}`, { method: 'DELETE' }),
};
