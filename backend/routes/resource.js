const r = require('express').Router();
const c = require('../controllers/resource'); const { protect, authorize } = require('../middleware/auth');
r.use(protect);
r.get('/nearby', authorize('authority'), c.nearby);
r.get('/', c.list);
r.post('/', authorize('authority'), c.create);
r.patch('/:id', authorize('authority'), c.update);
module.exports = r;
