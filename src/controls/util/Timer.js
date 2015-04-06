define(function() {
  /*
		延迟执行任务
	*/
  var Timer = function(fn, context, paramArray) {
    var me = this,
      id,
      call = function() {
        me.cancel();
        fn.apply(context, paramArray || []);
      };

    me.delay = function(timeout, newFn, newContext, newParamArray) {
      me.cancel();

      fn = newFn || fn;
      context = newContext || context;
      paramArray = newParamArray || paramArray;
      id = setTimeout(call, timeout);
    }

    /*取消延迟执行*/
    me.cancel = function() {
      if (id) {
        clearTimeout(id);
        id = null;
      }
    }

    me.destroy = function() {
      me.cancel();
      fn = context = paramArray = call = null;
    }
  }

  return Timer;
})