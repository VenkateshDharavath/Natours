const mongoose = require('mongoose');
const Tour = require('./TourModel');
// const User = require('./UserModel');

const ReviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be emplty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Avoiding duplicate reviews from a same user
// { user: 1, tour: 1 }, { unique: true } | Means that user and tour combination should be unique
ReviewSchema.index({ user: 1, tour: 1 }, { unique: true });

ReviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  }); // We only need user to be populated in the review
  // this.populate({
  //   path: 'user',
  //   select: 'name photo',
  // }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });
  next();
});

// Updating the averageRatings and quantity when a new review is added.
ReviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // Handling if there is no documents case.
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

ReviewSchema.post('save', function () {
  // await this.findOne() doesn't work here, query has already executed.
  this.constructor.calcAverageRatings(this.tour);
});

// Updating the averageRatings and quantity when review is updated or deleted.
// Matches FindOneAndDelete | FindOneAndUpdate | It's a query middleware
ReviewSchema.pre(/^findOneAnd/, async function (next) {
  // Getting the userId from the database to update averageRatings and quantity, and passing it to next middleware | can also be accessed in the post middlware.
  this.review = await this.findOne();
  next();
});

ReviewSchema.post(/^findOneAnd/, async function () {
  await this.review.constructor.calcAverageRatings(this.review.tour);
});
module.exports = mongoose.model('Review', ReviewSchema);
