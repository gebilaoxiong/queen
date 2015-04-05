define(function() {

  var Response = function(params, response) {
    Q.applyIf(this, params, {
      raw: response
    });
  }

  Response.prototype = {

    action: undefined,

    success: undefined,

    message: undefined,

    data: undefined,

    raw: undefined,

    records: undefined
  };

  return Response;
});