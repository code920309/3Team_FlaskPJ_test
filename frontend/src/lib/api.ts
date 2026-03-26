import axios, { type AxiosInstance } from 'axios';

/**
 * 전역 API 설정
 * 개발 모드(DEV)일 때는 Vite Proxy를 호출하고,
 * 빌드된 운영 모드일 때만 환경 변수의 주소를 사용합니다.
 */
const API_URL: string = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
