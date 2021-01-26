const AppError = require('../utils/appError');

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. please log in', 401);

const handleJWTExpiredToken = () =>
  new AppError('Token expired. Please log in again', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // We dont not want to send any programming or third-party package error to the client so we check for the operational error or not. If yes we send the error otherwise we send a generic message to the client.
  // Operational, trusted error: send message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // programming or other unknown error: don't leak error details
  } else {
    // 1) Log the error
    console.error('ERROR ', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'something went very wrong!',
    });
  }
};

const error = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let eror = { ...err };

    if (eror.code === 11000) eror = handleDuplicateFieldsDB(error);
    if (eror.name === 'JsonWebTokenError') eror = handleJWTError();
    if (eror.name === 'TokenExpiredError') eror = handleJWTExpiredToken();
    // To loop on object containing objects Object.values.map(obj => console.log(ob))
    sendErrorProd(eror, res);
  }
};

module.exports = error;
