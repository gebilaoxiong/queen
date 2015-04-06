define(function() {
  var recordTypeCache = {};

  /*注册 Record*/
  function regist(name, type) {
    recordTypeCache[name] = type;
  }

  function get(name) {
    return recordTypeCache[name];
  }

  function exsist(name) {
    return !!recordTypeCache[name];
  }

  function create(config, name, id) {
    var klass = typeof name == 'function' ? name : recordTypeCache[name];

    return new klass(config, id)
  }

  return {
    regist: regist,
    get: get,
    create: create,
    exsist: exsist
  };
})