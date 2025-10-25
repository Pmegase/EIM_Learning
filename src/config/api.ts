// src/config/api.ts (DEV)
export const API_BASE_URL = ''; // important: empty string
export const API_ENDPOINTS = {
    CONTENT: { BASE: '/api/content', UPLOAD: '/api/content/upload' },
    AUTH: {
        LOGIN: '/api/auth/login',
        SIGNUP: '/api/auth/signup',
        ADMIN_SIGNUP: '/api/auth/admin-signup',
        ME: '/api/auth/me',
        RESET_PASSWORD: '/api/auth/reset-password',
    },
    EMAIL: '/send-email',
};
