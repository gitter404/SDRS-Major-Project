require('dotenv').config();
const express = require('express'), http = require('http'), cors = require('cors'), morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize'), { Server } = require('socket.io');
const connectDB = require('./config/db'), errorHandler = require('./middleware/error');
for (const k of ['MONGO_URI', 'JWT_SECRET']) if (!process.env[k]) { console.error(`Missing ${k} in .env`); process.exit(1); }
const app = express(), server = http.createServer(app);
const origin = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, { cors: { origin } });
app.set('io', io);
app.use(cors({ origin })); app.use(express.json({ limit: '100kb' })); app.use(mongoSanitize()); app.use(morgan('dev'));
app.get('/api/health', (q, r) => r.json({ success: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/incidents', require('./routes/incident'));
app.use('/api/resources', require('./routes/resource'));
app.use((q, r) => r.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);
connectDB().then(() => server.listen(process.env.PORT || 5000, () => console.log('Server on', process.env.PORT || 5000)))
  .catch(e => { console.error('DB error:', e.message); process.exit(1); });
