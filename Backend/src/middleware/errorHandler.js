const notFound = (req, res, next) => {
    res.status(404);
  
    next(new Error(`Not Found - ${req.originalUrl}`));
  };
  
  const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    const statusCode =
      res.statusCode !== 200 ? res.statusCode : 500;
  
    res.status(statusCode).json({
      error: err.message || 'Internal Server Error',
    });
  };
  
  module.exports = {
    notFound,
    errorHandler,
  };