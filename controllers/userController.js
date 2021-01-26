const User = require('../models/UserModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (body, ...fields) => {
  const newObj = {};
  Object.keys(body).forEach((el) => {
    if (fields.includes(el)) newObj[el] = body[el];
  });
  return newObj;
};

// Users
exports.updateMe = async (req, res, next) => {
  try {
    // 1) Create an error if user tries to change password
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates, please hit /updateMyPassword',
          400
        )
      );
    }
    // 2) Filtered out unwanted fields that are not allowed to update.
    const filteredObj = filterObj(req.body, 'name', 'email');

    // 3) Update the user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredObj, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: updatedUser,
    });
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
};

exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    return next(new AppError(err.message, 400));
  }
};

exports.createUser = (req, res) => {
  res.status(400).json({
    message: 'This route is not yet defined, Please use /signup instead.',
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

// exports.getAllUsers = async (req, res, next) => {
//   try {
//     const users = await User.find();
//     res.status(200).json({
//       status: 'success',
//       data: users,
//     });
//   } catch (err) {
//     return next(new AppError(err.message, 400));
//   }
// };
