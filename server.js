const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

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
  .then(() => console.log('Connected to Database'));

// console.log(process.env);

// CREATING SERVER AND ADDING LISTENER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
// const server =

// // Handling Unhandled Rejections
// process.on('unhandledRejection', (err) => {
//   console.log(`${err.name}: ${err.message}`);
//   console.log('Unhandled Rejection Occured. Shutting down...');
//   server.close(() => {
//     process.exit(1);
//   });
// });

// Handling Uncaught exceptions
// process.on('uncaughtException', (err) => {
//   console.log(`${err.name}: ${err.message}`);
//   console.log('Uncaught Exception Occured. Shutting down...');
//   server.close(() => {
//     process.exit(1);
//   });
// });
