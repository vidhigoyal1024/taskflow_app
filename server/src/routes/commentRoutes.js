const router = require('express').Router();
const { deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.delete('/:id', protect, deleteComment);

module.exports = router;
