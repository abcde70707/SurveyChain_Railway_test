/**
 * REST API 客戶端
 * 對應 Go 後端（Gin）提供的 /api/* 路由
 * 開發環境：透過 Vite proxy 將 /api/* 轉發到 Go 後端（port 8080）
 * 生產環境：透過 VITE_API_BASE_URL 環境變數指定後端完整網址
 */

// ★ 修改：支援生產環境的後端 URL（Railway 部署必須設定 VITE_API_BASE_URL）
const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "/api";

// ─── JWT Token 管理 ──────────────────────────────────────────────────────────

export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

export function clearAuthToken(): void {
  localStorage.removeItem("auth_token");
}

// ─── 通用 fetch 包裝 ──────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options?: RequestInit,
  requiresAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthToken();
    }
    let errMsg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      errMsg = body.error || body.message || errMsg;
    } catch {
      // ignore parse error
    }
    throw new Error(errMsg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── 型別定義（與 Go models 對應） ───────────────────────────────────────────

export interface QuestionOption {
  id: number;
  questionId: number;
  optionText: string;
  orderIndex: number;
}

export interface SurveyQuestion {
  id: number;
  surveyId: number;
  questionText: string;
  questionType: "single" | "multiple" | "text";
  orderIndex: number;
  isRequired: boolean;
  createdAt: string;
  options?: QuestionOption[];
  qualifiedAddresses?: string[] | null;
}

export interface Survey {
  id: number;
  title: string;
  description: string;
  creatorAddress: string;
  rewardAmount: string;
  rewardToken: string;
  winnerCount: number;
  deadline: string;
  status: "draft" | "active" | "ended" | "drawn";
  contractAddress?: string | null;
  transactionHash?: string | null;
  winnerAddresses?: string | null;
  drawTransactionHash?: string | null;
  qualifiedAddresses?: string | string[] | null;
  entryFee: string;
  entryFeeCollected: string;
  contractPoolId?: number | null;
  poolType?: "A" | "B" | null;
  createdAt: string;
  updatedAt: string;
  questions?: SurveyQuestion[];
  participantCount?: number;
}

export interface RevealAnswersResponse {
  success: boolean;
  qualifiedCount: number;
  totalParticipants: number;
  gradedQuestionCount: number;
  qualifiedAddresses: string[];
}

export interface SurveyWithCount extends Survey {
  participantCount: number;
}

export interface Participant {
  id: number;
  surveyId: number;
  walletAddress: string;
  isWinner: boolean;
  submittedAt: string;
}

// ─── 認證 API ─────────────────────────────────────────────────────────────────

export const authApi = {
  getNonce: (wallet: string): Promise<{ nonce: string }> =>
    request(`/auth/nonce?wallet=${wallet.toLowerCase()}`),

  verify: (wallet: string, signature: string): Promise<{ success: boolean; token: string; wallet: string }> =>
    request("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ wallet, signature }),
    }),
};

// ─── 問卷 API ─────────────────────────────────────────────────────────────────

export const surveyApi = {
  list: (
    status?: string,
    creator?: string,
    participant?: string,
    poolType?: "A" | "B"
  ): Promise<SurveyWithCount[]> => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (creator) qs.set("creator", creator);
    if (participant) qs.set("participant", participant);
    if (poolType) qs.set("poolType", poolType);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<SurveyWithCount[]>(`/surveys${suffix}`);
  },

  get: (id: number): Promise<Survey> => request<Survey>(`/surveys/${id}`),

  create: (data: {
    title: string;
    description?: string;
    creatorAddress: string;
    rewardAmount: string;
    rewardToken?: string;
    winnerCount?: number;
    deadline: number;
    contractAddress?: string;
    transactionHash?: string;
    entryFee?: string;
    questions: {
      questionText: string;
      questionType: "single" | "multiple" | "text";
      isRequired?: boolean;
      options?: string[];
    }[];
  }): Promise<{ success: boolean; surveyId: number }> =>
    request("/surveys", { method: "POST", body: JSON.stringify(data) }, true),

  updateStatus: (
    id: number,
    data: {
      status: "draft" | "active" | "ended" | "drawn";
      contractAddress?: string;
      transactionHash?: string;
      winnerAddresses?: string[];
      drawTransactionHash?: string;
    }
  ): Promise<{ success: boolean }> =>
    request(`/surveys/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }, true),

  updateContract: (
    id: number,
    data: {
      contractAddress: string;
      transactionHash?: string;
      contractPoolId?: number;
      poolType?: "A" | "B";
    }
  ): Promise<{ success: boolean }> =>
    request(`/surveys/${id}/contract`, { method: "PATCH", body: JSON.stringify(data) }, true),

  draw: (
    id: number,
    data: {
      callerAddress: string;
      drawTransactionHash?: string;
      winnerAddresses?: string[];
    }
  ): Promise<{ success: boolean; winners: string[] }> =>
    request(`/surveys/${id}/draw`, { method: "POST", body: JSON.stringify(data) }, true),

  revealAnswers: (
    id: number,
    data: {
      callerAddress: string;
      answers: {
        questionId: number;
        correctOptionIds: number[];
      }[];
    }
  ): Promise<RevealAnswersResponse> =>
    request(`/surveys/${id}/answers`, { method: "POST", body: JSON.stringify(data) }, true),

  getQualified: (id: number): Promise<{
    success: boolean;
    qualifiedCount: number;
    qualifiedAddresses: string[];
  }> => request(`/surveys/${id}/qualified`),
};

// ─── 參與者 API ───────────────────────────────────────────────────────────────

export const participantApi = {
  submit: (data: {
    surveyId: number;
    walletAddress: string;
    entryFeePaid?: string;
    entryFeeTransactionHash?: string;
    answers: {
      questionId: number;
      answerText?: string;
      selectedOptionIds?: number[];
    }[];
  }): Promise<{ success: boolean; participantId: number }> =>
    request(
      `/surveys/${data.surveyId}/participate`,
      {
        method: "POST",
        body: JSON.stringify({
          walletAddress: data.walletAddress,
          entryFeePaid: data.entryFeePaid ?? "",
          entryFeeTransactionHash: data.entryFeeTransactionHash ?? "",
          answers: data.answers,
        }),
      },
      true
    ),

  checkParticipation: (
    surveyId: number,
    wallet: string
  ): Promise<{ participated: boolean; isWinner: boolean; participantId?: number }> =>
    request(`/surveys/${surveyId}/check-participation?wallet=${wallet.toLowerCase()}`),

  list: (surveyId: number): Promise<Participant[]> =>
    request(`/surveys/${surveyId}/participants`),
};
