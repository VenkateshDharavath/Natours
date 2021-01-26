const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('../models/TourModel');
const Review = require('../models/ReviewModel');
const User = require('../models/UserModel');

dotenv.config({ path: './config.env' });

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Database Connection Successful'));

// Reading Tours file

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/data/tours.json`, 'utf8')
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/data/users.json`, 'utf8')
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/data/reviews.json`, 'utf8')
);

const importData = async () => {
  try {
    await Tour.create(tours);
    await Review.create(reviews);
    await User.create(users, { validateBeforeSave: false });
    console.log('Data successfully imported');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete All
const deleteAll = async () => {
  try {
    await Tour.deleteMany();
    await Review.deleteMany();
    await User.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

setInterval(() => {
  if (process.argv[2] === '--import') {
    importData();
  } else if (process.argv[2] === '--delete') {
    deleteAll();
  }
}, 8000);
