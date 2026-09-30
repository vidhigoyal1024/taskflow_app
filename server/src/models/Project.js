const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Project name is required'], trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
  },
  { timestamps: true }
);

// Fast lookup of "all projects for this user", newest activity first
projectSchema.index({ 'members.user': 1, updatedAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
