//wrapper for async middleware. Eliminates need to catch errors

const catchError = handler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = catchError;

//func takes handler (async middleware) as an arg
//func returns new middleware 
// when called, the returned middleware:
  //invokes originaal handler
  //creates a resolved promise that has the value returned by the h func
  // if h func raises exception, gets caued by catch call