const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getProjectForUser, requireAdmin } = require('../utils/access');

const emptyStats = () => ({ todo: 0, 'in-progress': 0, done: 0, total: 0, overdue: 0 });

const startOfTodayUTC = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Task counts per status (and overdue count) for one or many projects, in a single aggregation
async function statsFor(projectIds) {
  const today = startOfTodayUTC();
  const rows = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    {
      $group: {
        _id: { project: '$project', status: '$status' },
        count: { $sum: 1 },
        overdue: {
          $sum: {
            $cond: [
              { $and: [{ $ne: ['$dueDate', null] }, { $lt: ['$dueDate', today] }, { $ne: ['$status', 'done'] }] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const map = {};
  projectIds.forEach((id) => (map[id.toString()] = emptyStats()));
  rows.forEach((r) => {
    const s = map[r._id.project.toString()];
    s[r._id.status] += r.count;
    s.total += r.count;
    s.overdue += r.overdue;
  });
  return map;
}

// POST /api/projects
exports.createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const project = await Project.create({
    name,
    description,
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'admin' }],
  });
  res.status(201).json({ project });
});

// GET /api/projects  (all projects the user belongs to, with progress stats)
exports.listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ 'members.user': req.user._id })
    .sort('-updatedAt')
    .populate('owner', 'name')
    .lean();
  const stats = await statsFor(projects.map((p) => p._id));

  res.json({
    projects: projects.map((p) => ({
      ...p,
      myRole: p.members.find((m) => m.user.equals(req.user._id)).role,
      memberCount: p.members.length,
      members: undefined,
      stats: stats[p._id.toString()],
    })),
  });
});

// GET /api/projects/:id
exports.getProject = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectForUser(req.params.id, req.user._id);
  await project.populate('members.user', 'name email');
  res.json({ project, myRole: role });
});

// PUT /api/projects/:id  (admin)
exports.updateProject = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectForUser(req.params.id, req.user._id);
  requireAdmin(role);
  if (req.body.name !== undefined) project.name = req.body.name;
  if (req.body.description !== undefined) project.description = req.body.description;
  await project.save();
  res.json({ project });
});

// DELETE /api/projects/:id  (admin) - also removes the project's tasks and comments
exports.deleteProject = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectForUser(req.params.id, req.user._id);
  requireAdmin(role);
  const taskIds = (await Task.find({ project: project._id }).select('_id')).map((t) => t._id);
  await Comment.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ project: project._id });
  await project.deleteOne();
  res.json({ message: 'Project deleted' });
});

// GET /api/projects/:id/stats
exports.projectStats = asyncHandler(async (req, res) => {
  const { project } = await getProjectForUser(req.params.id, req.user._id);
  const stats = await statsFor([project._id]);
  res.json({ stats: stats[project._id.toString()] });
});

// POST /api/projects/:id/members  (admin) body: { email, role }
exports.addMember = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectForUser(req.params.id, req.user._id);
  requireAdmin(role);

  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (!user) throw new ApiError(404, 'No TaskFlow account uses that email. Ask them to register first');
  if (project.members.some((m) => m.user.equals(user._id))) {
    throw new ApiError(409, 'That person is already in this project');
  }

  project.members.push({ user: user._id, role: req.body.role || 'member' });
  await project.save();
  await project.populate('members.user', 'name email');
  res.status(201).json({ project });
});

// PATCH /api/projects/:id/members/:userId  (admin) body: { role }
exports.updateMemberRole = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectForUser(req.params.id, req.user._id);
  requireAdmin(role);

  const member = project.members.find((m) => m.user.equals(req.params.userId));
  if (!member) throw new ApiError(404, 'Member not found in this project');

  const adminCount = project.members.filter((m) => m.role === 'admin').length;
  if (member.role === 'admin' && req.body.role === 'member' && adminCount === 1) {
    throw new ApiError(400, 'A project needs at least one admin');
  }

  member.role = req.body.role;
  await project.save();
  await project.populate('members.user', 'name email');
  res.json({ project });
});

// DELETE /api/projects/:id/members/:userId  (admin removes anyone; any member can remove themselves)
exports.removeMember = asyncHandler(async (req, res) => {
  const { project, role } = await getProjectForUser(req.params.id, req.user._id);
  const isSelf = req.params.userId === req.user._id.toString();
  if (!isSelf) requireAdmin(role);

  const member = project.members.find((m) => m.user.equals(req.params.userId));
  if (!member) throw new ApiError(404, 'Member not found in this project');

  const adminCount = project.members.filter((m) => m.role === 'admin').length;
  if (member.role === 'admin' && adminCount === 1) {
    throw new ApiError(400, 'A project needs at least one admin. Make someone else admin first');
  }

  project.members = project.members.filter((m) => !m.user.equals(req.params.userId));
  await project.save();
  await Task.updateMany({ project: project._id, assignee: member.user }, { assignee: null });

  await project.populate('members.user', 'name email');
  res.json({ project });
});

exports.statsFor = statsFor;
