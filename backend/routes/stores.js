require('dotenv').config();
const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules for query parameters
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
    .isIn(['id', 'name', 'address', 'average_rating', 'total_ratings'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC'),
  
  query('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name search term too long'),
  
  query('address')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Address search term too long'),
  
  query('minRating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5')
];

// Validation rules for rating
const rateStoreValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Store ID must be a positive integer'),
  
  body('score')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating score must be between 1 and 5')
];

// Validation rules for store ID parameter
const storeIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Store ID must be a positive integer')
];

// GET /stores - List stores with search, sort, and pagination
router.get('/', getStoresValidation, async (req, res) => {
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
      page = 1,
      limit = 10,
      sortBy: rawSortBy,
      sortOrder: rawSortOrder,
      name,
      address,
      minRating
    } = req.query;

    // Sanitize sortBy - validate against allowed columns
    const allowedSortColumns = ['id', 'name', 'address', 'average_rating', 'total_ratings'];
    const sortBy = allowedSortColumns.includes(rawSortBy) ? rawSortBy : 'name';

    // Sanitize sortOrder - only allow ASC or DESC
    const sortOrder = (rawSortOrder && rawSortOrder.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    // Build WHERE clause for search (name and address)
    const whereConditions = [];
    const baseParams = [];

    if (name) {
      whereConditions.push('s.name LIKE ?');
      baseParams.push(`%${name}%`);
    }

    if (address) {
      whereConditions.push('s.address LIKE ?');
      baseParams.push(`%${address}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count for pagination
    let countQuery;
    let countParams = [...baseParams];
    
    if (minRating) {
      countQuery = `
        SELECT COUNT(*) as total FROM (
          SELECT s.id
          FROM stores s
          LEFT JOIN ratings r ON s.id = r.store_id
          ${whereClause}
          GROUP BY s.id, s.name, s.address
          HAVING COALESCE(AVG(r.score), 0) >= ?
        ) as filtered_stores
      `;
      countParams.push(parseFloat(minRating));
    } else {
      countQuery = `
        SELECT COUNT(DISTINCT s.id) as total 
        FROM stores s
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
    } else {
      orderClause = `ORDER BY s.${sortBy} ${sortOrder}`;
    }

    const mainQuery = `
      SELECT 
        s.id,
        s.name,
        s.address,
        COALESCE(AVG(r.score), 0) as average_rating,
        COUNT(r.id) as total_ratings
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      ${whereClause}
      GROUP BY s.id, s.name, s.address
      ${minRating ? 'HAVING COALESCE(AVG(r.score), 0) >= ?' : ''}
      ${orderClause}
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    // Build main query parameters
    const mainParams = [...baseParams];
    
    // Add minRating parameter if it exists
    if (minRating) {
      mainParams.push(parseFloat(minRating));
    }

    const [stores] = await db.execute(mainQuery, mainParams);

    // Get current user's rating for each store if authenticated
    let userRatings = {};
    const token = req.cookies.token;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (stores.length > 0) {
          const storeIds = stores.map(store => store.id);
          const placeholders = storeIds.map(() => '?').join(',');
          
          const [userRatingsData] = await db.execute(
            `SELECT store_id, score FROM ratings WHERE user_id = ? AND store_id IN (${placeholders})`,
            [decoded.userId, ...storeIds]
          );
          
          userRatingsData.forEach(rating => {
            userRatings[rating.store_id] = rating.score;
          });
        }
      } catch (jwtError) {
        // Token is invalid or expired, but we still return store details
        console.log('JWT verification failed for user ratings:', jwtError.message);
      }
    }

    // Format the results
    const formattedStores = stores.map(store => ({
      id: store.id,
      name: store.name,
      address: store.address,
      rating: {
        average: parseFloat(store.average_rating).toFixed(2),
        total: store.total_ratings
      },
      userRating: userRatings[store.id] ? {
        score: userRatings[store.id]
      } : null
    }));

    res.status(200).json({
      success: true,
      data: formattedStores,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalStores,
        limit: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        name: name || null,
        address: address || null,
        minRating: minRating || null
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

// GET /stores/:id - Get store details with average rating and current user's rating
router.get('/:id', storeIdValidation, async (req, res) => {
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

    // Get store details with owner info and rating statistics
    const storeQuery = `
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
      WHERE s.id = ?
      GROUP BY s.id, s.name, s.address, u.name, u.email
    `;

    const [stores] = await db.execute(storeQuery, [storeId]);

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const store = stores[0];

    // Get current user's rating if authenticated
    let userRating = null;
    const token = req.cookies.token;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const [userRatings] = await db.execute(
          'SELECT score, created_at FROM ratings WHERE user_id = ? AND store_id = ?',
          [decoded.userId, storeId]
        );
        
        if (userRatings.length > 0) {
          userRating = {
            score: userRatings[0].score,
            created_at: userRatings[0].created_at
          };
        }
      } catch (jwtError) {
        // Token is invalid or expired, but we still return store details
        console.log('JWT verification failed for user rating:', jwtError.message);
      }
    }

    // Get recent ratings for this store
    const recentRatingsQuery = `
      SELECT 
        r.score,
        r.created_at,
        u.name as user_name
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `;

    const [recentRatings] = await db.execute(recentRatingsQuery, [storeId]);

    // Format the response
    const formattedStore = {
      id: store.id,
      name: store.name,
      address: store.address,
      created_at: store.created_at,
      owner: {
        name: store.owner_name,
        email: store.owner_email
      },
      rating: {
        average: parseFloat(store.average_rating).toFixed(2),
        total: store.total_ratings
      },
      userRating,
      recentRatings: recentRatings.map(rating => ({
        score: rating.score,
        user_name: rating.user_name,
        created_at: rating.created_at
      }))
    };

    res.status(200).json({
      success: true,
      data: formattedStore
    });

  } catch (error) {
    console.error('Get store details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching store details',
      error: error.message
    });
  }
});

// POST /stores/:id/rate - Rate a store (insert or update rating)
router.post('/:id/rate', authenticateToken, rateStoreValidation, async (req, res) => {
  const connection = await db.getConnection();
  
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
    const { score } = req.body;
    const userId = req.user.id;

    // Start transaction
    await connection.beginTransaction();

    // Check if store exists
    const [stores] = await connection.execute(
      'SELECT id, name FROM stores WHERE id = ?',
      [storeId]
    );

    if (stores.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if user already rated this store
    const [existingRatings] = await connection.execute(
      'SELECT id, score FROM ratings WHERE user_id = ? AND store_id = ?',
      [userId, storeId]
    );

    let result;
    let isUpdate = false;

    if (existingRatings.length > 0) {
      // Update existing rating
      result = await connection.execute(
        'UPDATE ratings SET score = ?, created_at = CURRENT_TIMESTAMP WHERE user_id = ? AND store_id = ?',
        [score, userId, storeId]
      );
      isUpdate = true;
    } else {
      // Insert new rating
      result = await connection.execute(
        'INSERT INTO ratings (user_id, store_id, score) VALUES (?, ?, ?)',
        [userId, storeId, score]
      );
    }

    // Get updated rating statistics
    const [ratingStats] = await connection.execute(`
      SELECT 
        COALESCE(AVG(score), 0) as average_rating,
        COUNT(*) as total_ratings
      FROM ratings 
      WHERE store_id = ?
    `, [storeId]);

    // Commit transaction
    await connection.commit();

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Rating updated successfully' : 'Rating added successfully',
      data: {
        storeId: parseInt(storeId),
        userId,
        score: parseInt(score),
        isUpdate,
        ratingStats: {
          average: parseFloat(ratingStats[0].average_rating).toFixed(2),
          total: ratingStats[0].total_ratings
        }
      }
    });

  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    console.error('Rate store error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while rating store',
      error: error.message
    });
  } finally {
    // Release connection
    connection.release();
  }
});

module.exports = router;
