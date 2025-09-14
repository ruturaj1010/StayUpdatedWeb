const db = require('../config/database');

const userModel = {
  // Find user by email
  findByEmail: async (email) => {
    try {
      const [users] = await db.execute(
        'SELECT id, email, name, address, password, role FROM users WHERE email = ?',
        [email]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },

  // Find user by ID
  findById: async (id) => {
    try {
      const [users] = await db.execute(
        'SELECT id, email, name, address, role FROM users WHERE id = ?',
        [id]
      );
      return users[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  },

  // Create new user
  create: async (userData) => {
    try {
      const { email, name, address, password, role = 'USER' } = userData;
      const [result] = await db.execute(
        'INSERT INTO users (email, name, address, password, role) VALUES (?, ?, ?, ?, ?)',
        [email, name, address, password, role]
      );
      return {
        id: result.insertId,
        email,
        name,
        address,
        role
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  update: async (id, userData) => {
    try {
      const { name, address, role } = userData;
      const fields = [];
      const values = [];

      if (name !== undefined) {
        fields.push('name = ?');
        values.push(name);
      }
      if (address !== undefined) {
        fields.push('address = ?');
        values.push(address);
      }
      if (role !== undefined) {
        fields.push('role = ?');
        values.push(role);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      await db.execute(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return await userModel.findById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Update user password
  updatePassword: async (id, hashedPassword) => {
    try {
      await db.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );
      return true;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  },

  // Delete user
  delete: async (id) => {
    try {
      const [result] = await db.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Get all users with pagination
  findAll: async (page = 1, limit = 10, filters = {}) => {
    try {
      const offset = (page - 1) * limit;
      let query = 'SELECT id, email, name, address, role FROM users';
      let countQuery = 'SELECT COUNT(*) as total FROM users';
      const conditions = [];
      const values = [];

      // Apply filters
      if (filters.role) {
        conditions.push('role = ?');
        values.push(filters.role);
      }
      if (filters.search) {
        conditions.push('(name LIKE ? OR email LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        values.push(searchTerm, searchTerm);
      }

      if (conditions.length > 0) {
        const whereClause = ' WHERE ' + conditions.join(' AND ');
        query += whereClause;
        countQuery += whereClause;
      }

      query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [users] = await db.execute(query, values);
      const [countResult] = await db.execute(countQuery, values.slice(0, -2));
      const total = countResult[0].total;

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  },

  // Check if email exists
  emailExists: async (email, excludeId = null) => {
    try {
      let query = 'SELECT id FROM users WHERE email = ?';
      const values = [email];

      if (excludeId) {
        query += ' AND id != ?';
        values.push(excludeId);
      }

      const [users] = await db.execute(query, values);
      return users.length > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  }
};

module.exports = userModel;
