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

// Starter API friendly landing message
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Welcome to the 📡 EduBroadcast API",
    status: "Live & Broadcasting",
    version: "1.0.0",
    description: "A secure, subject-based Content Broadcasting System allowing Teachers to schedule educational content.",
    documentation: "Please refer to the enclosed README.md and Postman Collection in the /docs folder for full endpoint routing.",
    endpoints: {
      auth: "/api/auth",
      content: "/api/content",
      broadcast: "/content/live/:teacherId"
    }
  });
});

module.exports = app;