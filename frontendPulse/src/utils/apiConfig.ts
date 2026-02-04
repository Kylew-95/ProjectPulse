export const getApiUrl = () => {
    // If we are running on localhost, prioritize local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }

    // Otherwise use the environment variable (Production)
    return import.meta.env.VITE_API_URL || 'https://project-pulse-python-server.onrender.com';
};
