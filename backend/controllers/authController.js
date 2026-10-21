const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check existing email
    const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    await query(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), email.toLowerCase().trim(), passwordHash, 'user']
    );

    const user = { id: userId, name: name.trim(), email: email.toLowerCase().trim(), role: 'user' };
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const users = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = generateToken(userData);

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred during login.' });
  }
};

exports.demoLogin = async (req, res) => {
  try {
    const demoEmail = 'demo@abhiikarkede.hu';
    let users = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [demoEmail]);

    let user;
    if (users.length === 0) {
      const userId = 'demo-user-001';
      const hash = await bcrypt.hash('Demo@1234', 10);
      await query(
        'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Abhii Demo User', demoEmail, hash, 'admin']
      );
      user = { id: userId, name: 'Abhii Demo User', email: demoEmail, role: 'admin' };
    } else {
      user = { id: users[0].id, name: users[0].name, email: users[0].email, role: users[0].role };
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      message: 'Logged in as Demo User!',
      token,
      user,
    });
  } catch (error) {
    console.error('Demo Login Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const users = await query('SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user: users[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
