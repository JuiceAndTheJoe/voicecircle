import { body, param, query, validationResult } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
}

// User validation rules
export const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name must be under 50 characters')
];

export const loginRules = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const updateProfileRules = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name must be under 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be under 500 characters'),
  body('avatarUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Invalid avatar URL')
];

// Post validation rules
export const createPostRules = [
  body('type')
    .isIn(['voice', 'video', 'text'])
    .withMessage('Invalid post type'),
  body('content')
    .optional()
    .trim()
    .isLength({ max: 280 })
    .withMessage('Content must be under 280 characters'),
  body('mediaUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Invalid media URL')
];

// Room validation rules
export const createRoomRules = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be 1-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be under 500 characters'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  body('enableVideo')
    .optional()
    .isBoolean()
    .withMessage('enableVideo must be a boolean')
];

// Comment validation rules
export const commentRules = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 280 })
    .withMessage('Comment must be 1-280 characters')
];

// Pagination rules
export const paginationRules = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100'),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be non-negative')
];

// ID parameter validation
export const idParamRule = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
];
