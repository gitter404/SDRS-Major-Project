const r = require('express').Router();
const c = require('../controllers/auth'); const { protect } = require('../middleware/auth');
r.post('/register', c.register); r.post('/login', c.login); r.get('/me', protect, c.me);
module.exports = r;
