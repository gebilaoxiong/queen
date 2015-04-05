define(function() {

  var cache = {};

  function register(storeId, store) {

    if (store == undefined) {
      store = storeId;
      storeId = store.storeId;
    } else {
      store.storeId = storeId;
    }

    if (store == undefined) {
      return;
    }

    cache[storeId] = store;
  }

  function unregister(store) {
    var storeId;
    if (Q.isString(store)) {
      storeId = store;
    } else if (store && store.storeId != undefined) {
      storeId = store.storeId
    }

    if (storeId != undefined) {
      cache[storeId] = null;
    }
  }

  function get(id) {
    if (!id) {
      return;
    }

    if (id.isXType && id.isXType('Store')) {
      return id;
    }

    return cache[id];
  }

  /*创建一个控件实例*/
  function create(config) {
    var xtype = config.xtype;
    return new xtype(config);
  }

  function lookup(id) {
    var ret;

    if (Q.isObject(id)) {
      ret = id.isXType && id.isXType('Store') ? id : create(id);
    } else {
      ret = get(id);
    }
    return ret;
  }

  return {
    register: register,
    unregister: unregister,
    get: get,
    create: create,
    lookup: lookup
  }
})