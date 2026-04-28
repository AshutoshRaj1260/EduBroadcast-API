const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use(cookieParser());
app.use(cors());
app.use(morgan('dev'));

// Routes
const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const broadcastRoutes = require('./routes/broadcast.routes');

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/content/live', broadcastRoutes);

module.exports = app;