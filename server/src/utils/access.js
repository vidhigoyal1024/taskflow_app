const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiError = require('./ApiError');

// Loads a project and confirms the user belongs to it. Returns the project and the user's role.
async function getProjectForUser(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  const member = project.members.find((m) => m.user.equals(userId));
  if (!member) throw new ApiError(403, 'You are not a member of this project');
  return { project, role: member.role };
}

// Loads a task and confirms the user belongs to the task's project.
async function loadTask(taskId, userId) {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  const { project, role } = await getProjectForUser(task.project, userId);
  return { task, project, role };
}

function requireAdmin(role) {
  if (role !== 'admin') throw new ApiError(403, 'Only project admins can do this');
}

function isMember(project, userId) {
  return project.members.some((m) => m.user.equals(userId));
}

function assertAssignable(project, assigneeId) {
  if (!mongoose.isValidObjectId(assigneeId)) throw new ApiError(400, 'Invalid assignee');
  if (!isMember(project, assigneeId)) throw new ApiError(400, 'Assignee must be a member of the project');
}

// Admins can modify any task. Members can modify tasks they created or are assigned to.
function canModifyTask(task, userId, role) {
  return role === 'admin' || task.createdBy.equals(userId) || Boolean(task.assignee && task.assignee.equals(userId));
}

module.exports = { getProjectForUser, loadTask, requireAdmin, isMember, assertAssignable, canModifyTask };
