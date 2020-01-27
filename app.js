const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { allowCors } = require('./api/middlewares/web-security.middleware');

// Get configuration files
require('./api/config/app.config');

// Express initialization
const app = express();

// Sets the connection with the database
let connectionString = '';

if (process.env.NODE_ENV === 'dev') {
    connectionString = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
} else {
    connectionString = `${process.env.DB_PROD_URL}`;
}
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
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// CORS Policy
app.use(allowCors);

// Make uploads folder public
app.use('/uploads', express.static("uploads"));

// Routes
app.use(require('./api/routes/index'));

// Set the application port
const port = process.env.PORT || 3535;

// Serve the application
app.listen(port, (err) => {
    if (err) throw new Error(err);
    console.log(`Listening on port ${port}`);
});