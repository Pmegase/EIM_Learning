// src/services/apiClient.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/config/api';

class ApiClient {
    private axios: AxiosInstance;

    constructor(baseURL: string) {
        this.axios = axios.create({
            baseURL,
            withCredentials: false,
            timeout: 20000,
            // ❌ do NOT set Content-Type globally here
        });

        this.axios.interceptors.request.use((config) => {
            const token = localStorage.getItem('authToken');
            config.headers = config.headers ?? {};
            if (token) {
                (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
            }

            // ✅ IMPORTANT: if sending FormData, remove Content-Type and let the browser set it
            const isFormData =
                typeof FormData !== 'undefined' &&
                (config.data instanceof FormData ||
                    (config.data && typeof config.data === 'object' && config.data.constructor?.name === 'FormData'));

            if (isFormData) {
                if (config.headers && 'Content-Type' in config.headers) {
                    delete (config.headers as Record<string, any>)['Content-Type'];
                }
            }

            if (import.meta.env.DEV) {
                console.log('🔄 Axios Request:', {
                    method: config.method?.toUpperCase(),
                    url: `${config.baseURL || ''}${config.url}`,
                    withCredentials: config.withCredentials,
                    headers: config.headers,
                });
            }
            return config;
        });

        this.axios.interceptors.response.use(
            (res) => {
                if (import.meta.env.DEV) {
                    console.log('✅ Axios Response:', { url: res.config.url, status: res.status, data: res.data });
                }
                return res;
            },
            (error: AxiosError) => Promise.reject(this.normalizeError(error))
        );

        if (import.meta.env.DEV) console.log('🔧 Axios client initialized with baseURL:', baseURL);
    }

    get<T = any>(url: string, config?: AxiosRequestConfig) {
        return this.axios.get<T>(url, config).then((r) => r.data);
    }
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
        return this.axios.post<T>(url, data, config).then((r) => r.data);
    }
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
        return this.axios.put<T>(url, data, config).then((r) => r.data);
    }
    delete<T = any>(url: string, config?: AxiosRequestConfig) {
        return this.axios.delete<T>(url, config).then((r) => r.data);
    }
    upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig) {
        // No Content-Type here; interceptor will keep it clean for FormData
        return this.axios.post<T>(url, formData, { ...(config || {}), withCredentials: false }).then((r) => r.data);
    }

    private normalizeError(err: AxiosError) {
        const status = err.response?.status;
        const url = err.config?.url;
        let message = 'Network error';
        if (err.response?.data && typeof err.response.data === 'object') {
            const d = err.response.data as any;
            message = d?.message || d?.error || err.message || `HTTP ${status}`;
        } else if (status) {
            message = err.message || `HTTP ${status}`;
        }
        return { status, url, message, raw: err };
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
