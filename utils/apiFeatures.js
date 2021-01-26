class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sorting() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      // sort('price ratingsAverage')
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields); // Select -> Called Projecting | Only those fields are returned.
    } else {
      this.query = this.query.select('-__v'); // Excluding __v
    }
    return this;
  }

  paginate() {
    const page = this.query.page * 1 || 1;
    const limit = this.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    // page=3&limit=10 -> 21 - 30 => (page - 1) * limit;
    return this;
  }
}

module.exports = APIFeatures;

// BUILD THE QUERY
// 1A) Filtering
// const queryObj = { ...req.query };
// const excludedFields = ['page', 'sort', 'limit', 'fields'];
// excludedFields.forEach((el) => delete queryObj[el]);

// // 1B) Advanced Filtering
// let queryStr = JSON.stringify(queryObj);
// queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
// let query = Tour.find(JSON.parse(queryStr));

// 2) Sorting
// if (req.query.sort) {
//   const sortBy = req.query.sort.split(',').join(' ');
//   query = query.sort(sortBy);
//   // sort('price ratingsAverage')
// } else {
//   query = query.sort('-createdAt');
// }

// 3) Field Limiting
// if (req.query.fields) {
//   const fields = req.query.fields.split(',').join(' ');
//   query = query.select(fields); // Select -> Called Projecting | Only those fields are returned.
// } else {
//   query = query.select('-__v'); // Excluding __v
// }

// 4) Pagination
// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit;
// query = query.skip(skip).limit(limit);
// // page=3&limit=10 -> 21 - 30 => (page - 1) * limit;
// if (req.query.page) {
//   const docDount = await Tour.countDocuments();
//   if (skip >= docDount) throw new Error("This page doesn't exist");
// }

// EXECUTE THE QUERY
// so the query is like query.sort().select().skip().limit()

// Method 2 | Chaining
// const tours = await Tour.find()
//   .where('duration')
//   .equals(params.duration)
//   .where('difficulty')
//   .equals(params.difficulty);
