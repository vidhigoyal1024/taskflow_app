const ApiError = require('../utils/ApiError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Server-side request body validation.
 * rules = { field: { required, min, max, email, enum, date } }
 * Empty optional values are skipped so clients can send "" or null to clear a field.
 */
const validate = (rules) => (req, res, next) => {
  const errors = [];
  const body = req.body || {};

  for (const [field, rule] of Object.entries(rules)) {
    let value = body[field];
    const isEmpty = value === undefined || value === null || value === '';

    if (isEmpty) {
      if (rule.required) errors.push(`${field} is required`);
      continue;
    }

    if (typeof value !== 'string') {
      errors.push(`${field} must be text`);
      continue;
    }

    value = value.trim();
    body[field] = value;

    if (rule.required && !value) errors.push(`${field} is required`);
    if (rule.min && value.length < rule.min) errors.push(`${field} must be at least ${rule.min} characters`);
    if (rule.max && value.length > rule.max) errors.push(`${field} must be at most ${rule.max} characters`);
    if (rule.email && !EMAIL_RE.test(value)) errors.push(`${field} must be a valid email address`);
    if (rule.enum && !rule.enum.includes(value)) errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
    if (rule.date && Number.isNaN(Date.parse(value))) errors.push(`${field} must be a valid date`);
  }

  if (errors.length) return next(new ApiError(400, errors.join('. ')));
  next();
};

module.exports = validate;
