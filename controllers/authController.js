const { User } = require('../models');
const { emitNotification } = require('../utils/socketManager');

// Register a new user
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user (password will be hashed by model hook)
    const user = await User.create({
      email,
      password,
      firstName,
      lastName
    });

    // Create session
    req.session.userId = user.id;
    req.session.userEmail = user.email;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Create session
    req.session.userId = user.id;
    req.session.userEmail = user.email;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
const logout = async (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid');
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    });
  } catch (error) {
    next(error);
  }
};

// Get current user info
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.session.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};

