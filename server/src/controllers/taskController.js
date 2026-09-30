const mongoose = require('mongoose');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getProjectForUser, loadTask, assertAssignable, canModifyTask } = require('../utils/access');

const POPULATE = [
  { path: 'assignee', select: 'name email' },
  { path: 'createdBy', select: 'name' },
];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  'due-soon': { _due: 1, _id: 1 },
  'due-late': { _due: -1, _id: 1 },
  priority: { _prio: 1, createdAt: -1 },
  title: { title: 1, _id: 1 },
};

// POST /api/projects/:projectId/tasks
exports.createTask = asyncHandler(async (req, res) => {
  const { project } = await getProjectForUser(req.params.projectId, req.user._id);
  const { title, description, status, priority, assignee, dueDate } = req.body;
  if (assignee) assertAssignable(project, assignee);

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    assignee: assignee || null,
    dueDate: dueDate ? new Date(dueDate) : null,
    project: project._id,
    createdBy: req.user._id,
  });
  await task.populate(POPULATE);
  res.status(201).json({ task });
});

// GET /api/projects/:projectId/tasks
// Query: q, status, priority, assignee (me | unassigned | <userId>), overdue=true,
//        sort (newest | oldest | due-soon | due-late | priority | title), page, limit
exports.listTasks = asyncHandler(async (req, res) => {
  const { project } = await getProjectForUser(req.params.projectId, req.user._id);
  const { q, status, priority, assignee, overdue } = req.query;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
  const sortKey = SORTS[req.query.sort] ? req.query.sort : 'newest';

  const match = { project: project._id };
  if (q && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    match.$or = [{ title: rx }, { description: rx }];
  }
  if (Task.STATUSES.includes(status)) match.status = status;
  if (Task.PRIORITIES.includes(priority)) match.priority = priority;

  if (assignee === 'me') match.assignee = req.user._id;
  else if (assignee === 'unassigned') match.assignee = null;
  else if (mongoose.isValidObjectId(assignee)) match.assignee = new mongoose.Types.ObjectId(assignee);

  if (overdue === 'true') {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    match.dueDate = { $lt: today };
    if (!match.status) match.status = { $ne: 'done' };
  }

  // Tasks without a due date always sort last when sorting by due date
  const noDueFallback = sortKey === 'due-late' ? new Date(0) : new Date('9999-12-31T00:00:00Z');

  const [tasks, total] = await Promise.all([
    Task.aggregate([
      { $match: match },
      {
        $addFields: {
          _due: { $ifNull: ['$dueDate', noDueFallback] },
          _prio: {
            $switch: {
              branches: [
                { case: { $eq: ['$priority', 'high'] }, then: 0 },
                { case: { $eq: ['$priority', 'medium'] }, then: 1 },
              ],
              default: 2,
            },
          },
        },
      },
      { $sort: SORTS[sortKey] },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $project: { _due: 0, _prio: 0 } },
    ]).collation({ locale: 'en', strength: 2 }),
    Task.countDocuments(match),
  ]);

  await Task.populate(tasks, POPULATE);

  res.json({
    tasks,
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  });
});

// GET /api/tasks/mine  (open tasks assigned to the current user, across all projects)
exports.myTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ assignee: req.user._id, status: { $ne: 'done' } })
    .sort('-updatedAt')
    .limit(15)
    .populate('project', 'name');
  res.json({ tasks });
});

// GET /api/tasks/:id
exports.getTask = asyncHandler(async (req, res) => {
  const { task, role } = await loadTask(req.params.id, req.user._id);
  await task.populate(POPULATE);
  res.json({ task, canEdit: canModifyTask(task, req.user._id, role) });
});

// PUT /api/tasks/:id
exports.updateTask = asyncHandler(async (req, res) => {
  const { task, project, role } = await loadTask(req.params.id, req.user._id);
  if (!canModifyTask(task, req.user._id, role)) {
    throw new ApiError(403, 'Only admins, the creator, or the assignee can edit this task');
  }

  ['title', 'description', 'status', 'priority'].forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });
  if (req.body.assignee !== undefined) {
    if (req.body.assignee) assertAssignable(project, req.body.assignee);
    task.assignee = req.body.assignee || null;
  }
  if (req.body.dueDate !== undefined) {
    task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
  }

  await task.save();
  await task.populate(POPULATE);
  res.json({ task });
});

// PATCH /api/tasks/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  const { task, role } = await loadTask(req.params.id, req.user._id);
  if (!canModifyTask(task, req.user._id, role)) {
    throw new ApiError(403, 'Only admins, the creator, or the assignee can move this task');
  }
  task.status = req.body.status;
  await task.save();
  await task.populate(POPULATE);
  res.json({ task });
});

// DELETE /api/tasks/:id  (admin or the task's creator)
exports.deleteTask = asyncHandler(async (req, res) => {
  const { task, role } = await loadTask(req.params.id, req.user._id);
  if (!(role === 'admin' || task.createdBy.equals(req.user._id))) {
    throw new ApiError(403, 'Only admins or the creator can delete this task');
  }
  await Comment.deleteMany({ task: task._id });
  await task.deleteOne();
  res.json({ message: 'Task deleted' });
});
