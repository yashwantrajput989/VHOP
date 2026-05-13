const BACKEND_URL = 'http://localhost:5000/api/log';

export const logToBackend = async (type: string, user: any, details: any = {}) => {
    try {
        await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                user: user ? (user.email || user.id || user.full_name) : 'anonymous',
                details
            }),
        });
    } catch (error) {
        console.error('Failed to log to backend:', error);
    }
};
