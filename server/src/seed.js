// Fills the database with demo data. DEVELOPMENT ONLY: this wipes users, projects, tasks and comments.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Comment = require('./models/Comment');

const daysFromNow = (n) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({}), Comment.deleteMany({})]);

  const [asha, rohan, meera] = await User.create([
    { name: 'Asha Verma', email: 'asha@taskflow.dev', password: 'password123' },
    { name: 'Rohan Mehta', email: 'rohan@taskflow.dev', password: 'password123' },
    { name: 'Meera Singh', email: 'meera@taskflow.dev', password: 'password123' },
  ]);

  const project = await Project.create({
    name: 'Website Redesign',
    description: 'Ship the new marketing site before the product launch.',
    owner: asha._id,
    members: [
      { user: asha._id, role: 'admin' },
      { user: rohan._id, role: 'member' },
      { user: meera._id, role: 'member' },
    ],
  });

  const rows = [
    ['Audit current site pages', 'done', 'low', rohan, -6],
    ['Write new homepage copy', 'done', 'medium', meera, -3],
    ['Design homepage wireframes', 'in-progress', 'high', meera, 2],
    ['Build responsive navigation', 'in-progress', 'medium', rohan, 4],
    ['Set up staging environment', 'in-progress', 'medium', asha, -1],
    ['Create pricing page layout', 'todo', 'high', meera, 6],
    ['Integrate contact form API', 'todo', 'high', rohan, 5],
    ['Compress and optimise images', 'todo', 'low', null, null],
    ['Add analytics tracking', 'todo', 'medium', asha, 9],
    ['Write accessibility checklist', 'todo', 'medium', null, 12],
    ['Cross-browser testing', 'todo', 'high', rohan, 14],
    ['Prepare launch announcement', 'todo', 'low', meera, 16],
    ['Set up 301 redirects', 'todo', 'medium', asha, 10],
    ['Final content review', 'todo', 'high', asha, 18],
  ];

  const tasks = await Task.create(
    rows.map(([title, status, priority, who, due]) => ({
      title,
      status,
      priority,
      project: project._id,
      assignee: who ? who._id : null,
      createdBy: asha._id,
      dueDate: due === null ? null : daysFromNow(due),
      description: '',
    }))
  );

  await Comment.create([
    { task: tasks[2]._id, author: asha._id, text: 'Please keep the hero section under one screen height on mobile.' },
    { task: tasks[2]._id, author: meera._id, text: 'Got it. First draft goes up tomorrow.' },
  ]);

  console.log('Seeded. Log in with asha@taskflow.dev / password123 (project admin)');
  console.log('Other demo users: rohan@taskflow.dev, meera@taskflow.dev (same password)');
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
