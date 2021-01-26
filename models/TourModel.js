const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./UserModel');
// const validator = require('validator');

const TourSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      unique: true,
      trim: true,
      maxlength: [40, 'Less than 40 characters required for name'],
      minlength: [10, 'More than 10 characters required for name'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Group size is required'],
    },
    difficulty: {
      type: String,
      required: [true, 'difficulty size is required'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings must be above 1.0'],
      max: [5, 'Ratings must be above 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.6666, 46.666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation and unavailable while updating
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'summary size is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'imageCover is required'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.Now,
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number, // we can also delete startLocation and put day as 0
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexing
TourSchema.index({ startLocation: '2dsphere' });
TourSchema.index({ price: 1, ratingsAverage: -1 }); // 1 ascending, -1 descending
TourSchema.index({ slug: 1 });

TourSchema.virtual('durationWeeks').get(function () {
  return Math.round(this.duration / 7);
});

TourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Mongoose Middleware | Document Middleware -> .save() and .create()
TourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Get all guide users with their Id's and embedd into TourModel | This is how we can embedd
// TourSchema.pre('save', async function (next) {
//   const guidePromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidePromises);
//   next();
// });

// TourSchema.pre('save', function (next) {
//   console.log('Will save document..');
//   next();
// });

// TourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// Query Middleware
// This keyword points to the query .find()
// TourSchema.pre('find', function (next) {
TourSchema.pre(/^find/, function (next) {
  // matches all that starts with find -> findOne, findMany?
  this.find({ secretTour: { $ne: true } });
  this.start = Date.Now;
  next();
});

TourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// TourSchema.post(/^find/, function (docs, next) {
//   // matches all that starts with find -> findOne, findMany?
//   console.log(`The query took ${Date.Now - this.start}`);
//   next();
// });

// Aggregation Middleware
// TourSchema.pre('aggregate', function (next) {
//   // this.pipeline() =>  the pipeline we put in aggregate function
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

module.exports = mongoose.model('Tour', TourSchema);
