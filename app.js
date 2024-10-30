const express = require('express');
const axios = require('axios');
const redis = require('redis');

const redisClient = redis.createClient(); // default port 6379
const BASE_URL = 'https://api.github.com/users';

const app = express();

// Connect to Redis with error handling
(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Error connecting to Redis:', err);
    }
})();

// Define route
app.get('/', async (req, res) => {
    const username = req.query.username || 'Zelmo4';

    try {
        // Check Redis cache for data
        const cachedData = await redisClient.get(username);
        
        if (cachedData) {
            console.log(`Cache hit for ${username}`);
            return res.json(JSON.parse(cachedData));
        }

        console.log(`Cache miss for ${username}, fetching from GitHub API`);
        // Data not in cache, fetch from GitHub API
        const url = `${BASE_URL}/${username}`;
        const response = await axios.get(url);

        // Cache the response with a 60-second expiration
        await redisClient.setEx(username, 60, JSON.stringify(response.data));
        
        console.log(`Data cached for ${username}`);
        res.json(response.data);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            message: 'Error fetching data',
            error: error.message,
        });
    }
});

// Start the server
app.listen(9000, () => {
    console.log('App is running on port 9000');
});

// Close the Redis client on process exit
process.on('exit', () => {
    redisClient.quit();
});
