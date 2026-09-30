const mongoose = require('mongoose');

const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Task title is required'], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, enum: STATUSES, default: 'todo' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes that back the project board queries (filter by status / assignee / due date)
taskSchema.index({ project: 1, status: 1, createdAt: -1 });
taskSchema.index({ project: 1, assignee: 1 });
taskSchema.index({ project: 1, dueDate: 1 });
taskSchema.index({ assignee: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);
Task.STATUSES = STATUSES;
Task.PRIORITIES = PRIORITIES;

module.exports = Task;
