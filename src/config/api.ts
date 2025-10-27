// src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://eim-learning-backend.onrender.com';
export const API_ENDPOINTS = {
    CONTENT: { BASE: '/api/content', UPLOAD: '/api/content/upload' },
    SERVICES: { BASE: '/api/services' },            // 👈 add this
    AUTH: {
        LOGIN: '/api/auth/login',
        SIGNUP: '/api/auth/signup',
        ADMIN_SIGNUP: '/api/auth/admin-signup',
        ME: '/api/auth/me',
        RESET_PASSWORD: '/api/auth/reset-password',
    },
    EMAIL: '/send-email',
};
