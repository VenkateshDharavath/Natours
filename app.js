const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const reviewRouter = require('./routes/reviewRoutes');

// CREATING EXPRESS APP
const app = express();

// ADDING GLOBAL MIDDLEWARE
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 100, // sodjflsdj
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser | Reading the data from body to req.body
app.use(express.json({ limit: '10kb' })); // accepts only 10kbs from the requests.
// app.use(express.json()); | Normal

// Data sanitization against NoSQL query injection.
app.use(mongoSanitize()); // Checks the body and filters out all the ($) dollar signs and (.) dots

// Data sanitization against XSS/Cross Site Scripting
app.use(xss()); // cleans user input from html code.

// Prevent prameter pollution
// app.use(hpp()); // it will only consider the last paramater in the query | duration=6,duration=9 -> only durations=9 will be allpied. To prevent such cases we need to pass options.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ], // multiple durations-price will be considered, only durations, not sort and all.
  })
);

// Serving static files
app.use(express.static(`${__dirname}`));

// custom test middleware
// app.use((req, res, next) => {
//   console.log('Hello from middleware!');
//   next();
// });

// ROUTES
app.use('/api/v1/tours', tourRouter); // Called Mouting a Router | tourRouter -> middleware function
app.use('/api/v1/users', userRouter); // Called Mouting a Router
app.use('/api/v1/reviews', reviewRouter); // Called Mouting a Router

// Handle endpoints not available
app.all('*', (req, res, next) => {
  //   const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  //   err.status = 'fail';
  //   err.statusCode = 400;
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
