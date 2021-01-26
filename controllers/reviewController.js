const Review = require('../models/ReviewModel');
// const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes | if we create a review with tour route, we dont have to specify the user and tour now.
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);

// exports.getAllReviews = async (req, res, next) => {
//   try {
//     let filter = {};
//     if (req.params.tourId) filter = { tour: req.params.tourId };
//     const reviews = await Review.find(filter);

//     res.status(200).json({
//       status: 'success',
//       data: reviews,
//     });
//   } catch (err) {
//     next(new AppError(err.message, 400));
//   }
// };

// exports.createReview = async (req, res, next) => {
//   try {
//     // Allow nested routes | if we create a review with tour route, we dont have to specify the user and tour now.
//     if (!req.body.tour) req.body.tour = req.params.tourId;
//     if (!req.body.user) req.body.user = req.user.id;

//     const newReview = await Review.create(req.body);
//     res.status(201).json({
//       status: 'success',
//       data: newReview,
//     });
//   } catch (err) {
//     next(new AppError(err.message, 400));
//   }
// };
