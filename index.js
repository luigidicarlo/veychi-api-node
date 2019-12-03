const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');

// Get configuration files
require('./api/config/app.config');

// Express initialization
const app = express();

// Morgan to log HTTP requests (dev only)
app.use(morgan('dev'));

// Parse body requests
app.use(bodyParser.json())

// Routes
app.use(require('./api/routes/index'));

// socket.io initialization
const server = http.createServer(app);
module.exports.io = socketIO(server);

// Set the application port
const port = process.env.PORT || 3535;

// Serve the application
server.listen(port, (err) => {
    if (err) throw new Error(err);
    console.log(`Listening on port ${port}`);
});