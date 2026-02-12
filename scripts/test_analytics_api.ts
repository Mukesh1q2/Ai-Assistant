import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function test() {
    try {
        const email = `test-analytics-${Date.now()}@example.com`;
        const password = 'password123';
        const name = 'Test User';

        // 1. Register
        console.log(`Registering user ${email}...`);
        try {
            await axios.post(`${API_URL}/auth/signup`, { email, password, name });
        } catch (e: any) {
            if (e.response?.status === 409) {
                console.log('User exists, logging in...');
            } else {
                throw e;
            }
        }

        // 2. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        const token = loginRes.data.data.token;
        console.log('Got token:', token ? 'Yes' : 'No');

        // 3. Get Analytics
        console.log('Fetching analytics...');
        const analyticsRes = await axios.get(`${API_URL}/analytics?period=30d`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Analytics Response:', JSON.stringify(analyticsRes.data, null, 2));

        if (analyticsRes.data.executions) {
            console.log('✅ Analytics API is working!');
        } else {
            console.error('❌ Analytics API returned unexpected format');
        }

    } catch (error: any) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

test();
