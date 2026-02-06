export const getApiUrl = () => {
    return process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
};
