require('dotenv').config();
const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and store owner role check to all routes
router.use(authenticateToken);
router.use(authorizeRoles('STORE_OWNER'));

// Validation rules for store ID parameter
const storeIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Store ID must be a positive integer')
];

// Validation rules for updating store
const updateStoreValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Store ID must be a positive integer'),
  
  body('name')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Store name must be between 1 and 255 characters')
    .trim()
    .escape(),
  
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters')
    .trim()
    .escape()
];

// Simplified validation rules for ratings query parameters
const getRatingsValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Store ID must be a positive integer')
    .customSanitizer(value => parseInt(value)),
  
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000')
    .customSanitizer(value => parseInt(value)),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .customSanitizer(value => parseInt(value))
];

// GET /owner/stores - List stores owned by logged-in store owner
router.get('/stores', async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Get stores owned by the current user with rating statistics
    const query = `
      SELECT 
        s.id,
        s.name,
        s.address,
        COALESCE(AVG(r.score), 0) as average_rating,
        COUNT(r.id) as total_ratings,
        COUNT(CASE WHEN r.score = 5 THEN 1 END) as five_star_ratings,
        COUNT(CASE WHEN r.score = 4 THEN 1 END) as four_star_ratings,
        COUNT(CASE WHEN r.score = 3 THEN 1 END) as three_star_ratings,
        COUNT(CASE WHEN r.score = 2 THEN 1 END) as two_star_ratings,
        COUNT(CASE WHEN r.score = 1 THEN 1 END) as one_star_ratings
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE s.owner_id = ?
      GROUP BY s.id, s.name, s.address
      ORDER BY s.name ASC
    `;

    const [stores] = await db.execute(query, [ownerId]);

    // Get recent ratings for each store
    const storeIds = stores.map(store => store.id);
    let recentRatings = {};
    
    if (storeIds.length > 0) {
      const placeholders = storeIds.map(() => '?').join(',');
      const recentRatingsQuery = `
        SELECT 
          r.store_id,
          r.score,
          r.created_at,
          u.name as user_name
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.store_id IN (${placeholders})
        ORDER BY r.created_at DESC
      `;
      
      const [recentRatingsData] = await db.execute(recentRatingsQuery, storeIds);
      
      // Group ratings by store_id
      recentRatingsData.forEach(rating => {
        if (!recentRatings[rating.store_id]) {
          recentRatings[rating.store_id] = [];
        }
        if (recentRatings[rating.store_id].length < 5) { // Limit to 5 recent ratings per store
          recentRatings[rating.store_id].push({
            score: rating.score,
            user_name: rating.user_name,
            created_at: rating.created_at
          });
        }
      });
    }

    // Format the results
    const formattedStores = stores.map(store => ({
      id: store.id,
      name: store.name,
      address: store.address,
      rating: {
        average: parseFloat(store.average_rating).toFixed(2),
        total: store.total_ratings,
        breakdown: {
          five_star: store.five_star_ratings,
          four_star: store.four_star_ratings,
          three_star: store.three_star_ratings,
          two_star: store.two_star_ratings,
          one_star: store.one_star_ratings
        }
      },
      recentRatings: recentRatings[store.id] || []
    }));

    res.status(200).json({
      success: true,
      data: formattedStores,
      total: formattedStores.length
    });

  } catch (error) {
    console.error('Get owner stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching stores',
      error: error.message
    });
  }
});

// GET /owner/stores/:id/ratings - Get ratings for a specific store owned by the user (SIMPLIFIED)
router.get('/stores/:id/ratings', getRatingsValidation, async (req, res) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Ratings request started for store: ${req.params.id} by user: ${req.user?.id}`);
    console.log(`[${requestId}] Raw req.params:`, req.params);
    console.log(`[${requestId}] Raw req.query:`, req.query);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`[${requestId}] Validation errors:`, errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        requestId
      });
    }

    const storeId = parseInt(req.params.id);
    const ownerId = req.user.id;
    
    // Simple parameter validation
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    
    console.log(`[${requestId}] Query parameters:`, { page, limit });

    // Verify store ownership
    const [storeCheck] = await db.execute(
      'SELECT id, name, address FROM stores WHERE id = ? AND owner_id = ?',
      [parseInt(storeId), parseInt(ownerId)]
    );

    if (storeCheck.length === 0) {
      console.log(`[${requestId}] Store not found or not owned by user:`, { storeId, ownerId });
      return res.status(404).json({
        success: false,
        message: 'Store not found or you do not have permission to view its ratings',
        requestId
      });
    }

    const store = storeCheck[0];
    console.log(`[${requestId}] Store found:`, store.name);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM ratings r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ?
    `;

    const [countResult] = await db.execute(countQuery, [parseInt(storeId)]);
    const totalRatings = countResult[0].total;

    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalRatings / limit);

    // Get ratings with simple query (no sorting, no filtering)
    let ratings = [];
    if (totalRatings > 0) {
      const mainQuery = `
        SELECT 
          r.id as rating_id,
          r.score,
          r.created_at,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email
        FROM ratings r
        INNER JOIN users u ON r.user_id = u.id
        WHERE r.store_id = ?
        ORDER BY r.created_at DESC
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const finalParams = [parseInt(storeId)];
      console.log(`[${requestId}] Executing main query with params:`, finalParams);
      console.log(`[${requestId}] Main query:`, mainQuery);
      console.log(`[${requestId}] Debug - Final offset: ${parseInt(offset)}, Final limit: ${parseInt(limit)}`);

      [ratings] = await db.execute(mainQuery, finalParams);
      console.log(`[${requestId}] SQL execution successful, ratings count:`, ratings.length);
    }

    // Get rating statistics
    const statsQuery = `
      SELECT 
        COALESCE(AVG(score), 0) as average_rating,
        COUNT(*) as total_ratings,
        COUNT(CASE WHEN score = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN score = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN score = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN score = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN score = 1 THEN 1 END) as one_star
      FROM ratings 
      WHERE store_id = ?
    `;

    const [statsResult] = await db.execute(statsQuery, [parseInt(storeId)]);
    const stats = statsResult[0];

    // Format the results
    const formattedRatings = ratings.map(rating => ({
      id: rating.rating_id,
      score: rating.score,
      created_at: rating.created_at,
      user: {
        id: rating.user_id,
        name: rating.user_name,
        email: rating.user_email
      }
    }));

    // Calculate response time
    const responseTime = Date.now() - startTime;

    const response = {
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          address: store.address
        },
        ratings: formattedRatings,
        statistics: {
          average: parseFloat(stats.average_rating).toFixed(2),
          total: stats.total_ratings,
          breakdown: {
            five_star: stats.five_star,
            four_star: stats.four_star,
            three_star: stats.three_star,
            two_star: stats.two_star,
            one_star: stats.one_star
          }
        }
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalRatings,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      meta: {
        requestId,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`[${requestId}] Ratings request completed successfully in ${responseTime}ms`);
    res.status(200).json(response);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${requestId}] Get store ratings error:`, {
      error: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`,
      storeId: req.params.id,
      userId: req.user?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching store ratings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      requestId,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  }
});

// PATCH /owner/stores/:id - Update store information
router.patch('/stores/:id', updateStoreValidation, async (req, res) => {
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

    const storeId = req.params.id;
    const ownerId = req.user.id;
    const { name, address } = req.body;

    // Check if at least one field is provided for update
    if (!name && !address) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name or address) must be provided for update'
      });
    }

    // First, verify that the store belongs to the current user
    const [storeCheck] = await db.execute(
      'SELECT id, name, address FROM stores WHERE id = ? AND owner_id = ?',
      [storeId, ownerId]
    );

    if (storeCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found or you do not have permission to update it'
      });
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }

    // Add store ID for WHERE clause
    updateValues.push(storeId);

    const updateQuery = `
      UPDATE stores 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await db.execute(updateQuery, updateValues);

    // Get updated store information
    const [updatedStore] = await db.execute(
      'SELECT id, name, address, created_at FROM stores WHERE id = ?',
      [storeId]
    );

    res.status(200).json({
      success: true,
      message: 'Store updated successfully',
      data: updatedStore[0]
    });

  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating store',
      error: error.message
    });
  }
});

module.exports = router;
