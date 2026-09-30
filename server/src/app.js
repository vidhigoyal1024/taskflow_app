const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

const origins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((o) => o.trim()) : true;
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
