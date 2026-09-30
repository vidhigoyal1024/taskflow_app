const router = require('express').Router();
const task = require('../controllers/taskController');
const comment = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

router.use(protect);

router.get('/mine', task.myTasks); // must stay above '/:id'

router.route('/:id')
  .get(task.getTask)
  .put(
    validate({
      title: { max: 120 },
      description: { max: 2000 },
      status: { enum: STATUSES },
      priority: { enum: PRIORITIES },
      dueDate: { date: true },
    }),
    task.updateTask
  )
  .delete(task.deleteTask);

router.patch('/:id/status', validate({ status: { required: true, enum: STATUSES } }), task.updateStatus);

router.route('/:id/comments')
  .get(comment.listComments)
  .post(validate({ text: { required: true, max: 1000 } }), comment.createComment);

module.exports = router;
