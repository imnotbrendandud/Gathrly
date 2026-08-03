class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'internal_error';
  const message = err.statusCode ? err.message : 'Something went wrong';

  if (!err.statusCode) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: { code, message, details: err.details },
  });
}

module.exports = { AppError, errorHandler };
