const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    err.statusCode = 400;
    err.status = 'fail';
    next(err);
  }
};

exports.updateOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  } catch (err) {
    err.statusCode = 400;
    err.status = 'fail';
    next(err);
    // res.status(400).json({
    //   status: 'fail',
    //   message: err,
    // });
  }
};

exports.createOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: doc,
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.getOne = (Model, popOptions) => async (req, res, next) => {
  try {
    let query = Model.findById(req.params.id);
    if (popOptions) {
      query = query.populate(popOptions);
    }
    const doc = await query;
    // Here populate brings the data which are referenced and we're filtering it in select. | Moved to Middleware

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  } catch (err) {
    err.statusCode = 400;
    err.status = 'fail';
    next(err);
  }
};

exports.getAll = (Model) => async (req, res, next) => {
  try {
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sorting()
      .limitFields()
      .paginate();
    const docs = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: docs,
    });
  } catch (err) {
    err.statusCode = 400;
    err.status = 'fail';
    next(err);
  }
};
