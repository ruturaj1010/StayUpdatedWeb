require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin role check to all routes
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

// Validation rules for creating users
const createUserValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8, max: 16 })
    .withMessage('Password must be between 8 and 16 characters')
    .matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/)
    .withMessage('Password must contain at least one uppercase letter and one special character'),
  
  body('name')
    .isLength({ min: 20, max: 60 })
    .withMessage('Name must be between 20 and 60 characters')
    .trim()
    .escape(),
  
  body('address')
    .isLength({ max: 400 })
    .withMessage('Address must not exceed 400 characters')
    .trim()
    .escape(),
  
  body('role')
    .isIn(['USER', 'STORE_OWNER'])
    .withMessage('Role must be USER or STORE_OWNER')
];

// Validation rules for query parameters
const getUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['email', 'name', 'address', 'role', 'average_rating'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Sort order must be ASC or DESC'),
  
  query('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name filter too long'),
  
  query('email')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Email filter too long'),
  
  query('address')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Address filter too long'),
  
  query('role')
    .optional()
    .isIn(['USER', 'STORE_OWNER'])
    .withMessage('Invalid role')
];

// POST /admin/users - Create new user
router.post('/users', createUserValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, name, address, role } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await db.execute(
      'INSERT INTO users (email, name, address, password, role) VALUES (?, ?, ?, ?, ?)',
      [email, name, address, hashedPassword, role]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: result.insertId,
        email,
        name,
        address,
        role
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during user creation'
    });
  }
});

// GET /admin/users - Get users with filters, pagination, and sorting
router.get('/users', getUsersValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page: rawPage = 1,
      limit: rawLimit = 10,
      sortBy: rawSortBy,
      sortOrder: rawSortOrder,
      name,
      email,
      address,
      role
    } = req.query;

    // Parse pagination numbers with defaults
    const page = parseInt(rawPage) || 1;
    const limit = parseInt(rawLimit) || 10;

    // Sanitize sortBy - validate against allowed columns
    const allowedSortColumns = ['name', 'email', 'address', 'role', 'average_rating'];
    const sortBy = allowedSortColumns.includes(rawSortBy) ? rawSortBy : 'name';

    // Normalize sortOrder - convert to uppercase and only allow ASC or DESC, default to DESC
    const normalizedSortOrder = rawSortOrder ? rawSortOrder.toUpperCase() : 'DESC';
    const sortOrder = (normalizedSortOrder === 'ASC' || normalizedSortOrder === 'DESC') 
      ? normalizedSortOrder 
      : 'DESC';

    // Build WHERE clause
    const whereConditions = [];
    const queryParams = [];

    if (name) {
      whereConditions.push('u.name LIKE ?');
      queryParams.push(`%${name}%`);
    }

    if (email) {
      whereConditions.push('u.email LIKE ?');
      queryParams.push(`%${email}%`);
    }

    if (address) {
      whereConditions.push('u.address LIKE ?');
      queryParams.push(`%${address}%`);
    }

    if (role) {
      whereConditions.push('u.role = ?');
      queryParams.push(role);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total 
      FROM users u
      LEFT JOIN stores s ON u.id = s.owner_id AND u.role = 'STORE_OWNER'
      LEFT JOIN ratings r ON s.id = r.store_id
      ${whereClause ? ' ' + whereClause : ''}
    `;
    const [countResult] = await db.execute(countQuery, whereConditions.length > 0 ? queryParams : []);
    const totalUsers = countResult[0].total;

    // Calculate pagination using parsed values
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalUsers / limit);

    // Build main query with average rating for STORE_OWNER users
    const mainQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.address,
        u.role,
        COALESCE(AVG(r.score), 0) as average_rating
      FROM users u
      LEFT JOIN stores s ON u.id = s.owner_id AND u.role = 'STORE_OWNER'
      LEFT JOIN ratings r ON s.id = r.store_id
      ${whereClause ? ' ' + whereClause : ''}
      GROUP BY u.id, u.name, u.email, u.address, u.role
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const [users] = await db.execute(mainQuery, whereConditions.length > 0 ? queryParams : []);

    // Format the results to match requirements
    const formattedUsers = users.map(user => {
      const result = {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role
      };
      
      // Add average rating only for STORE_OWNER users
      if (user.role === 'STORE_OWNER') {
        result.average_rating = parseFloat(user.average_rating).toFixed(2);
      }
      
      return result;
    });

    res.status(200).json({
      success: true,
      data: formattedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        name: name || null,
        email: email || null,
        address: address || null,
        role: role || null
      },
      sorting: {
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
      error: error.message
    });
  }
});

// POST /admin/stores - Create new store
router.post('/stores', [
  body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Store name must be between 1 and 255 characters')
    .trim()
    .escape(),
  
  body('address')
    .isLength({ max: 500 })
    .withMessage('Store address must not exceed 500 characters')
    .trim()
    .escape(),
  
  body('owner_id')
    .isInt({ min: 1 })
    .withMessage('Owner ID must be a positive integer')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, address, owner_id } = req.body;

    // Verify that the owner exists and has STORE_OWNER role
    const [owners] = await db.execute(
      'SELECT id, role FROM users WHERE id = ? AND role = ?',
      [owner_id, 'STORE_OWNER']
    );

    if (owners.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid owner ID or owner is not a store owner'
      });
    }

    // Create the store
    const [result] = await db.execute(
      'INSERT INTO stores (name, address, owner_id) VALUES (?, ?, ?)',
      [name, address, owner_id]
    );

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: {
        id: result.insertId,
        name,
        address,
        owner_id,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating store',
      error: error.message
    });
  }
});

// Validation rules for store query parameters
const getStoresValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['id', 'name', 'address', 'average_rating', 'total_ratings', 'owner_name'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Sort order must be ASC or DESC'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term too long'),
  
  query('minRating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  
  query('owner')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Owner search term too long')
];

// GET /admin/stores - Get stores with filters, sorting, and pagination
router.get('/stores', getStoresValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page: rawPage = 1,
      limit: rawLimit = 10,
      sortBy: rawSortBy,
      sortOrder: rawSortOrder,
      search,
      minRating,
      owner
    } = req.query;

    // Parse pagination numbers with defaults
    const page = parseInt(rawPage) || 1;
    const limit = parseInt(rawLimit) || 10;

    // Sanitize sortBy - validate against allowed columns
    const allowedSortColumns = ['id', 'name', 'address', 'average_rating', 'total_ratings', 'owner_name'];
    const sortBy = allowedSortColumns.includes(rawSortBy) ? rawSortBy : 'name';

    // Normalize sortOrder - convert to uppercase and only allow ASC or DESC, default to DESC
    const normalizedSortOrder = rawSortOrder ? rawSortOrder.toUpperCase() : 'DESC';
    const sortOrder = (normalizedSortOrder === 'ASC' || normalizedSortOrder === 'DESC') 
      ? normalizedSortOrder 
      : 'DESC';

    // Build WHERE clause
    const whereConditions = [];
    const queryParams = [];

    if (search) {
      whereConditions.push('(s.name LIKE ? OR s.address LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (owner) {
      whereConditions.push('u.name LIKE ?');
      queryParams.push(`%${owner}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count for pagination
    let countQuery;
    let countParams = [...queryParams];
    
    if (minRating) {
      countQuery = `
        SELECT COUNT(*) as total FROM (
          SELECT s.id
          FROM stores s
          LEFT JOIN users u ON s.owner_id = u.id
          LEFT JOIN ratings r ON s.id = r.store_id
          ${whereClause}
          GROUP BY s.id, s.name, s.address, u.name, u.email
          HAVING COALESCE(AVG(r.score), 0) >= ?
        ) as filtered_stores
      `;
      countParams.push(parseFloat(minRating));
    } else {
      countQuery = `
        SELECT COUNT(DISTINCT s.id) as total 
        FROM stores s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN ratings r ON s.id = r.store_id
        ${whereClause}
      `;
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const totalStores = countResult[0].total;

    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalStores / limit);

    // Build main query with proper sorting
    let orderClause = '';
    if (sortBy === 'average_rating' || sortBy === 'total_ratings') {
      orderClause = `ORDER BY ${sortBy} ${sortOrder}`;
    } else if (sortBy === 'owner_name') {
      orderClause = `ORDER BY u.name ${sortOrder}`;
    } else {
      orderClause = `ORDER BY s.${sortBy} ${sortOrder}`;
    }

    const mainQuery = `
      SELECT 
        s.id,
        s.name,
        s.address,
        u.name as owner_name,
        u.email as owner_email,
        COALESCE(AVG(r.score), 0) as average_rating,
        COUNT(r.id) as total_ratings
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON s.id = r.store_id
      ${whereClause}
      GROUP BY s.id, s.name, s.address, u.name, u.email
      ${minRating ? 'HAVING COALESCE(AVG(r.score), 0) >= ?' : ''}
      ${orderClause}
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    // Build main query parameters
    const mainParams = [...queryParams];
    
    // Add minRating parameter if it exists
    if (minRating) {
      mainParams.push(parseFloat(minRating));
    }

    const [stores] = await db.execute(mainQuery, mainParams);

    // Format the results to match requirements
    const formattedStores = stores.map(store => ({
      id: store.id,
      name: store.name,
      email: store.owner_email,
      owner: store.owner_name,
      address: store.address,
      average_rating: parseFloat(store.average_rating).toFixed(2),
      total_ratings: store.total_ratings
    }));

    res.status(200).json({
      success: true,
      data: formattedStores,
      pagination: {
        currentPage: page,
        totalPages,
        totalStores,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        search: search || null,
        minRating: minRating || null,
        owner: owner || null
      },
      sorting: {
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching stores',
      error: error.message
    });
  }
});

// GET /admin/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get total users count
    const [userCountResult] = await db.execute('SELECT COUNT(*) as total FROM users');
    const totalUsers = userCountResult[0].total;

    // Get total stores count
    const [storeCountResult] = await db.execute('SELECT COUNT(*) as total FROM stores');
    const totalStores = storeCountResult[0].total;

    // Get total ratings count
    const [ratingCountResult] = await db.execute('SELECT COUNT(*) as total FROM ratings');
    const totalRatings = ratingCountResult[0].total;

    // Get users by role
    const [roleStats] = await db.execute(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

    // Get average rating across all stores
    const [avgRatingResult] = await db.execute('SELECT AVG(score) as average FROM ratings');
    const averageRating = avgRatingResult[0].average || 0;

    // Get recent activity (last 7 days)
    const [recentUsers] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    const [recentStores] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM stores 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    const [recentRatings] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM ratings 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    res.status(200).json({
      success: true,
      data: {
        totals: {
          totalUsers,
          totalStores,
          totalRatings
        },
        averages: {
          averageRating: parseFloat(averageRating).toFixed(2)
        },
        userStats: {
          byRole: roleStats.reduce((acc, stat) => {
            acc[stat.role] = stat.count;
            return acc;
          }, {})
        },
        recentActivity: {
          last7Days: {
            newUsers: recentUsers[0].count,
            newStores: recentStores[0].count,
            newRatings: recentRatings[0].count
          }
        }
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching dashboard data'
    });
  }
});


// Validation rules for admin password update
const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8, max: 16 })
    .withMessage('New password must be between 8 and 16 characters')
    .matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/)
    .withMessage('New password must contain at least one uppercase letter and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

// PUT /admin/update-password - Update admin password
router.put('/update-password', updatePasswordValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.id;

    // Get admin from database
    const [users] = await db.execute(
      'SELECT id, password FROM users WHERE id = ? AND role = "ADMIN"',
      [adminId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    const user = users[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, adminId]
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Admin password update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /admin/users/:id - Delete user by ID
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const adminId = req.user.id;

    // Validate that the ID is a positive integer
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Check if user exists
    const [users] = await db.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deletion of self
    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete the user (CASCADE will handle related data)
    await db.execute(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting user',
      error: error.message
    });
  }
});

// DELETE /admin/stores/:id - Delete store by ID
router.delete('/stores/:id', async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);

    // Validate that the ID is a positive integer
    if (isNaN(storeId) || storeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID'
      });
    }

    // Check if store exists
    const [stores] = await db.execute(
      'SELECT id FROM stores WHERE id = ?',
      [storeId]
    );

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Delete related ratings first (explicit deletion for better control)
    await db.execute(
      'DELETE FROM ratings WHERE store_id = ?',
      [storeId]
    );

    // Delete the store
    await db.execute(
      'DELETE FROM stores WHERE id = ?',
      [storeId]
    );

    res.status(200).json({
      success: true,
      message: 'Store deleted successfully'
    });

  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting store',
      error: error.message
    });
  }
});

module.exports = router;
