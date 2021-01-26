const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/UserModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove the password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};

exports.protect = async (req, res, next) => {
  // 1) Get token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError("oops, You're not logged in.", 401));
  }
  // 2) Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('The user belonging to this token no longer exist', 401)
    );

  // 4) check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Password has been changed since the token issued. Please log in again',
        401
      )
    );
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
};

// ROUTE HANDLERS
// Signup and Authentication
exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      role: req.body.role,
    });

    createAndSendToken(newUser, 201, res);
    // const token = signToken(newUser._id);
    // res.status(201).json({
    //   status: 'success',
    //   token,
    //   data: newUser,
    // });
  } catch (err) {
    err.statusCode = 400;
    err.status = 'fail';
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check if email and password exist.
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  try {
    // 2) check if user exist and password is correct.
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.verify(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3) if everything is okay, send the token to client.
    createAndSendToken(user, 200, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //   status: 'success',
    //   token,
    // });
  } catch (err) {
    err.statusCode = 400;
    err.status = 'fail';
    next(err);
  }
};

exports.accessOnlyTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    next(
      new AppError('You do not have permission to perform this action', 403)
    );
  }
  next();
};

exports.forgotPassword = async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    next(new AppError('No user found with that email Id'), 404);
  }

  // 2) Generate the random reset token.
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send the token to user's email.
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn'tforget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password reset token (valid for 10 mins)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token send to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('Failed to send the mail, please try again later', 500)
    );
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is a user, set the new password
    if (!user) {
      next(new AppError('Token is invalid or has expired', 400));
    }

    // 3) Update passwordChangedAt property of the user
    // Done right in the UserModel.js as Document Middleware
    // 4) Log the user in, send JWT token
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createAndSendToken(user, 200, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //   status: 'success',
    //   token,
    // });
  } catch (err) {
    next(new AppError(err.message, err.statusCode));
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    // 0) Check if old and new passwords are same
    if (req.body.passwordCurrent === req.body.password) {
      return next(
        new AppError(
          'Trying to put same old password again. Please update with new password',
          403
        )
      );
    }

    // 1) Get User from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.verify(req.body.passwordCurrent, user.password))) {
      return next(new AppError('Invalid password', 401));
    }

    // 3) If so, Update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate() -> we cant use it as middlewares and this keyword wont work.

    // Log the user in | send jwt token
    createAndSendToken(user, 200, res);
    // const token = signToken(user._id);
    //   res.status(200).json({
    //     status: 'success',
    //     token,
    //   });
  } catch (err) {
    return next(new AppError(err.message, err.statusCode));
  }
};
