const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError } = require('./errorHandler');

function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'unauthorized', 'Missing or malformed Authorization header');
  }

  const token = header.slice('Bearer '.length);

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch (err) {
    throw new AppError(401, 'unauthorized', 'Invalid or expired token');
  }
}

module.exports = authenticate;
