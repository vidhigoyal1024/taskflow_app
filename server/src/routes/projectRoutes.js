const router = require('express').Router();
const project = require('../controllers/projectController');
const task = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const ROLES = ['admin', 'member'];
const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

router.use(protect);

// Projects
router.route('/')
  .get(project.listProjects)
  .post(validate({ name: { required: true, max: 80 }, description: { max: 500 } }), project.createProject);

router.route('/:id')
  .get(project.getProject)
  .put(validate({ name: { max: 80 }, description: { max: 500 } }), project.updateProject)
  .delete(project.deleteProject);

router.get('/:id/stats', project.projectStats);

// Members
router.post('/:id/members', validate({ email: { required: true, email: true }, role: { enum: ROLES } }), project.addMember);
router.patch('/:id/members/:userId', validate({ role: { required: true, enum: ROLES } }), project.updateMemberRole);
router.delete('/:id/members/:userId', project.removeMember);

// Tasks inside a project
router.route('/:projectId/tasks')
  .get(task.listTasks)
  .post(
    validate({
      title: { required: true, max: 120 },
      description: { max: 2000 },
      status: { enum: STATUSES },
      priority: { enum: PRIORITIES },
      dueDate: { date: true },
    }),
    task.createTask
  );

module.exports = router;
