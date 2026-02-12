
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function test() {
    try {
        console.log('Starting Bot Flow Integration Test...');

        // 1. Register/Login
        const email = `test.botflow.${Date.now()}@example.com`;
        const password = 'password123';
        const name = 'BotFlow Tester';

        console.log(`Registering user ${email}...`);
        await axios.post(`${API_URL}/auth/signup`, { email, password, name });

        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('Got token.');

        // 2. Create Bot
        console.log('Creating Bot...');
        const botData = {
            name: 'Integration Test Bot',
            description: 'Created by test script',
            type: 'coding',
            config: {
                personality: 'Robot',
                systemPrompt: 'You are a test bot.'
            }
        };
        const createRes = await axios.post(`${API_URL}/bots`, botData, { headers });
        const botId = createRes.data.data.id;
        console.log(`Bot created. ID: ${botId}`);

        // 3. Verify in List
        console.log('Fetching Bot List...');
        const listRes = await axios.get(`${API_URL}/bots`, { headers });
        const found = listRes.data.data.data.find((b: any) => b.id === botId);
        if (!found) throw new Error('Bot not found in list!');
        console.log('Bot found in list.');

        // 4. Update Bot
        console.log('Updating Bot...');
        await axios.put(`${API_URL}/bots/${botId}`, { description: 'Updated desc' }, { headers });
        const updatedRes = await axios.get(`${API_URL}/bots/${botId}`, { headers });
        if (updatedRes.data.data.description !== 'Updated desc') throw new Error('Update failed!');
        console.log('Bot updated.');

        // 5. Deploy Bot
        console.log('Deploying Bot...');
        await axios.post(`${API_URL}/bots/${botId}/deploy`, {}, { headers });
        const deployedRes = await axios.get(`${API_URL}/bots/${botId}`, { headers });
        if (deployedRes.data.data.status !== 'active') throw new Error('Deployment failed! Status: ' + deployedRes.data.data.status);
        console.log('Bot deployed (active).');

        // 6. Delete Bot
        console.log('Deleting Bot...');
        await axios.delete(`${API_URL}/bots/${botId}`, { headers });
        try {
            await axios.get(`${API_URL}/bots/${botId}`, { headers });
            throw new Error('Bot still exists after delete!');
        } catch (e: any) {
            if (e.response && e.response.status === 404) {
                console.log('Bot deleted successfully (404 confirmed).');
            } else {
                throw e;
            }
        }

        console.log('✅ Bot Flow Test PASSED!');

    } catch (error: any) {
        console.error('❌ Test failed:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

test();
