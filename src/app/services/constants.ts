// Central API configuration. Set VITE_API_URL (e.g. in .env.local) to point the app at a
// different backend, such as the Java backend at http://localhost:8080/api.
// Defaults to the Node backend so existing `npm run dev` keeps working.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
