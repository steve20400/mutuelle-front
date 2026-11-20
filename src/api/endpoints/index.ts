export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },

  CONTEXT: '/api/context',

  MEMBERS: {
    BASE: '/api/members',
    REGISTER: '/api/members/register',
    ME: '/api/members/me',
    ME_PASSWORD: '/api/members/me/password',
    ME_EMAIL: '/api/members/me/email',
    BY_ID: (id: number) => `/api/members/${id}`,
    STATUS: (id: number) => `/api/members/${id}/status`,
    MUTUELLE_STATUS: (id: number) => `/api/members/${id}/mutuelle-status`,
  },

  SESSIONS: {
    BASE: '/api/sessions',
    CURRENT: '/api/sessions/current',
    BY_ID: (id: number) => `/api/sessions/${id}`,
    START: (id: number) => `/api/sessions/${id}/start`,
    CLOSE: (id: number) => `/api/sessions/${id}/close`,
    HISTORY: '/api/sessions/history',
    HISTORY_BY_SESSION: (sessionId: number) => `/api/sessions/history/by-session/${sessionId}`,
    HISTORY_BY_EXERCICE: (exerciceId: number) => `/api/sessions/history/by-exercice/${exerciceId}`,
  },

  EXERCICES: {
    BASE: '/api/exercices',
    CURRENT: '/api/exercices/current',
    BY_ID: (id: number) => `/api/exercices/${id}`,
    START: (id: number) => `/api/exercices/${id}/start`,
    CLOSE: (id: number) => `/api/exercices/${id}/close`,
  },

  TRANSACTIONS: {
    BASE: '/api/transactions',
    BY_ID: (id: number) => `/api/transactions/${id}`,
  },

  EPARGNE: '/api/epargne',

  EMPRUNTS: {
    EMPRUNT: '/api/emprunts/emprunt',
    REMBOURSEMENT: '/api/emprunts/remboursement',
  },

  SOLIDARITE: {
    PAYER: '/api/solidarite/payer',
    MEMBRE_TOTAL: (id: number) => `/api/solidarite/membre/${id}/total`,
    MEMBRE_HISTORIQUE: (id: number) => `/api/solidarite/membre/${id}/historique`,
  },

  CONTRIBUTIONS: {
    PAY: '/api/contributions/pay',
  },

  ASSISTANCES: {
    BASE: '/api/assistances',
    TYPES: '/api/assistances/types',
    TYPE_BY_ID: (id: number) => `/api/assistances/types/${id}`,
  },

  RENFOULEMENT: '/api/renfoulements',

  BILAN: {
    SESSION_MEMBERS: (sessionId: number) => `/api/bilan/session/${sessionId}/membres`,
    MUTUELLE_SESSION: (sessionId: number) => `/api/bilan/mutuelle/session/${sessionId}`,
    MUTUELLE_SESSION_PDF: (sessionId: number) => `/api/bilan/mutuelle/session/${sessionId}/pdf`,
    MUTUELLE_EXERCICE: (exerciceId: number) => `/api/bilan/mutuelle/exercice/${exerciceId}`,
    MUTUELLE_EXERCICE_PDF: (exerciceId: number) => `/api/bilan/mutuelle/exercice/${exerciceId}/pdf`,
    MEMBER_SESSIONS: (memberId: number) => `/api/bilan/membre/${memberId}/sessions`,
    MEMBER_SESSION: (memberId: number, sessionId: number) =>
      `/api/bilan/membre/${memberId}/session/${sessionId}`,
    MEMBER_SESSION_PDF: (memberId: number, sessionId: number) =>
      `/api/bilan/membre/${memberId}/session/${sessionId}/pdf`,
    MEMBER_EXERCICES: (memberId: number) => `/api/bilan/membre/${memberId}/exercices`,
    MEMBER_EXERCICE: (memberId: number, exerciceId: number) =>
      `/api/bilan/membre/${memberId}/exercice/${exerciceId}`,
    MEMBER_EXERCICE_PDF: (memberId: number, exerciceId: number) =>
      `/api/bilan/membre/${memberId}/exercice/${exerciceId}/pdf`,
    EXERCICE_MEMBERS: (exerciceId: number) => `/api/bilan/exercice/${exerciceId}/membres`,
    EXERCICE_MEMBERS_PDF: (exerciceId: number) => `/api/bilan/exercice/${exerciceId}/membres/pdf`,
  },

  ACCOUNTS: {
    MUTUELLE: '/api/accounts/mutuelle',
    MEMBERS: '/api/accounts/members',
    MEMBER_BY_ID: (id: number) => `/api/accounts/members/${id}`,
    MEMBER_BY_MEMBER_ID: (memberId: number) => `/api/accounts/members/by-member/${memberId}`,
  },

  CONFIG: {
    CURRENT: '/api/config/current',
    UPDATE: '/api/config/current/update',
    RECALCULATE: '/api/config/admin/recalculate-statuses',
  },

  ADMINS: {
    ME: '/api/admins/me',
    ME_PASSWORD: '/api/admins/me/password',
    ME_EMAIL: '/api/admins/me/email',
  },

  NOTIFICATIONS: {
    PUSH_TOKEN: '/api/notifications/push/token',
    TEST: '/api/notifications/push/test',
  },
} as const;
