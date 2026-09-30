const Comment = require('../models/Comment');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { loadTask, getProjectForUser } = require('../utils/access');

// GET /api/tasks/:id/comments
exports.listComments = asyncHandler(async (req, res) => {
  const { task } = await loadTask(req.params.id, req.user._id);
  const comments = await Comment.find({ task: task._id }).sort('createdAt').populate('author', 'name');
  res.json({ comments });
});

// POST /api/tasks/:id/comments
exports.createComment = asyncHandler(async (req, res) => {
  const { task } = await loadTask(req.params.id, req.user._id);
  const comment = await Comment.create({ task: task._id, author: req.user._id, text: req.body.text });
  await comment.populate('author', 'name');
  res.status(201).json({ comment });
});

// DELETE /api/comments/:id  (comment author or project admin)
exports.deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, 'Comment not found');

  const task = await Task.findById(comment.task);
  if (!task) {
    await comment.deleteOne();
    return res.json({ message: 'Comment deleted' });
  }

  const { role } = await getProjectForUser(task.project, req.user._id);
  if (!(role === 'admin' || comment.author.equals(req.user._id))) {
    throw new ApiError(403, 'You can only delete your own comments');
  }
  await comment.deleteOne();
  res.json({ message: 'Comment deleted' });
});
