const router = require('express').Router();
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post(
  '/register',
  validate({
    name: { required: true, max: 50 },
    email: { required: true, email: true },
    password: { required: true, min: 6, max: 72 },
  }),
  register
);
router.post('/login', validate({ email: { required: true, email: true }, password: { required: true } }), login);
router.get('/me', protect, me);

module.exports = router;
