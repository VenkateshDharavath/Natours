const Tour = require('../models/TourModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
// const APIFeatures = require('../utils/apiFeatures');

// Middleware 1
// router.param('id', (req, res, next, val) => {
//   console.log(`the param id is: ${val}`);
//   // You can check and do any validations here
//   // if anything is wrong you can send the response back res.send(500)
//   next();
// });

// Middleware 2
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// ROUTE HANDLERS
// Tours

exports.getTourStats = async (req, res, next) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          // _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      // {
      //   $match: { _id: { $ne: 'EASY' } },
      // },
    ]);
    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (err) {
    err.statusCode = 400;
    err.status = 'fail';
    next(err);
  }
};

exports.getMonthlyPlan = async (req, res, next) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: plan,
    });
  } catch (err) {
    err.statusCode = 400;
    err.status = 'fail';
    next(err);
  }
};

// '/tours-within/:distance/center/:latlng/unit/:unit'
// '/tours-within/233/center/-40,45/unit/mi'
exports.getToursWithin = async (req, res, next) => {
  try {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(','); // Destructuring from an array
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitude and longitude in the format lat,lng.',
          400
        )
      );
    }

    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: tours,
    });
  } catch (err) {
    next(new AppError(err.message, err.statusCode));
  }
};

exports.getDistances = async (req, res, next) => {
  try {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(','); // Destructuring from an array

    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitude and longitude in the format lat,lng.',
          400
        )
      );
    }
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng * 1, lat * 1],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: distances,
    });
  } catch (err) {
    next(new AppError(err.message, err.statusCode));
  }
};

exports.createTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
exports.getAllTours = factory.getAll(Tour);

// exports.getAllTours = async (req, res, next) => {
//   try {
//     const features = new APIFeatures(Tour.find(), req.query)
//       .filter()
//       .sorting()
//       .limitFields()
//       .paginate();
//     const tours = await features.query;

//     // SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       results: tours.length,
//       data: tours,
//     });
//   } catch (err) {
//     err.statusCode = 400;
//     err.status = 'fail';
//     next(err);
//   }
// };

// const catchAsync = (fn) => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next);
//   };
// };

// exports.createTour = async (req, res, next) => {
//   try {
//     // const tour = new Tour(req.body);
//     // tour.save();
//     // Tour.findByIdAndUpdate
//     const tour = await Tour.create(req.body);
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: tour,
//       },
//     });
//   } catch (err) {
//     err.statusCode = 400;
//     err.status = 'fail';
//     next(err);
//   }
// };

// exports.getTour = async (req, res, next) => {
//   try {
//     const tour = await Tour.findById(req.params.id).populate('reviews'); // Here populate brings the data which are referenced and we're filtering it in select. | Moved to Middleware

//     if (!tour) {
//       return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour: tour,
//       },
//     });
//   } catch (err) {
//     err.statusCode = 400;
//     err.status = 'fail';
//     next(err);
//   }
// };

// exports.updateTour = async (req, res, next) => {
//   try {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     if (!tour) {
//       return next(new AppError('No tour found with that ID', 404));
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour: tour,
//       },
//     });
//   } catch (err) {
//     err.statusCode = 400;
//     err.status = 'fail';
//     next(err);
//     // res.status(400).json({
//     //   status: 'fail',
//     //   message: err,
//     // });
//   }
// };

// exports.deleteTour = async (req, res, next) => {
//   try {
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     if (!tour) {
//       return next(new AppError('No tour found with that ID', 404));
//     }
//     res.status(204).json({
//       status: 'success',
//       data: null,
//     });
//   } catch (err) {
//     err.statusCode = 400;
//     err.status = 'fail';
//     next(err);
//   }
// };
