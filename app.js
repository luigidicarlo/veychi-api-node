const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const { allowCors } = require('./api/middlewares/web-security.middleware');

// Get configuration files
require('./api/config/app.config');

// Express initialization
const app = express();

// Sets the connection with the database
const connectionString = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
};

mongoose.connect(
    connectionString,
    options,
    (err) => {
        if (err) throw err;
        console.log(`Database online on port ${process.env.DB_PORT}`);
    }
);

// Morgan to log HTTP requests (dev only)
app.use(morgan('dev'));

// Parse body requests
app.use(bodyParser.json())

// CORS Policy
app.use(allowCors);

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