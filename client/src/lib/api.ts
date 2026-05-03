export type Hint = {
  id: number;
  sessionId: number;
  content: string;
  hintNumber: number;
  createdAt: string;
};

export type Attempt = {
  id: number;
  sessionId: number;
  content: string;
  feedback: string;
  attemptNumber: number;
  isCorrect: boolean;
  isGaveUp?: boolean;
  createdAt: string;
};

export type Session = {
  id: number;
  userId: number;
  question: string;
  currentStep: number;
  hintCount: number;
  attemptCount: number;
  realAttemptCount: number;
  isRevealed: boolean;
  finalAnswer: string | null;
  explanation: string | null;
  createdAt: string;
  hints: Hint[];
  attempts: Attempt[];
};

export type Stats = {
  totalSessions: number;
  revealedSessions: number;
  averageHintsUsed: number;
  averageAttemptsUsed: number;
  completionRate: number;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("midmind_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const text = await res.text();

    if (res.status === 401) {
      localStorage.removeItem("midmind_token");
    }

    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

export function login(email: string, password: string) {
  return request<{ token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function register(name: string, email: string, password: string) {
  return request<{ token: string; user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  });
}

export function getMe() {
  return request<User>("/auth/me");
}

export function startSession(question: string) {
  return request<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify({ question })
  });
}

export function getSession(id: number) {
  return request<Session>(`/sessions/${id}`);
}

export function submitAttempt(id: number, attempt: string) {
  return request<Session>(`/sessions/${id}/attempt`, {
    method: "POST",
    body: JSON.stringify({ attempt })
  });
}

export function requestHint(id: number) {
  return request<Session>(`/sessions/${id}/hint`, {
    method: "POST"
  });
}

export function giveUp(id: number) {
  return request<Session>(`/sessions/${id}/giveup`, {
    method: "POST"
  });
}

export function listSessions() {
  return request<Session[]>("/sessions");
}

export function getSessionStats() {
  return request<Stats>("/sessions/stats");
}

export function getAdminUsers() {
  return request<User[]>("/admin/users");
}

export function getAdminSessions() {
  return request<Session[]>("/admin/sessions");
}

export type AdminStats = {
  totalUsers: number;
  totalSessions: number;
  revealedSessions: number;
  completionRate: number;
  averageHintsUsed: number;
  averageAttemptsUsed: number;
};

export function getAdminStats() {
  return request<AdminStats>("/admin/stats");
}
