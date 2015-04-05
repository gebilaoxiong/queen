/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @description Queen核心 版本号0.1Bate
 *
 */
+ function() {

  var objectProto = Object.prototype,

    arrayProto = Array.prototype,

    core_toString = objectProto.toString,

    core_hasOwnProperty = objectProto.hasOwnProperty,

    core_shift = arrayProto.shift,

    core_slice = arrayProto.slice,

    core_splice = arrayProto.splice,

    class2type = {},

    guid = 0,

    version = '0.1Bate',

    Q = {
      name: 'Queen',

      version: version,

      Browser: {
        opera: 0,
        safari: 0,
        chrome: 0,
        firfox: 0,
        ie: 0,
        ver: 0 //内核版本
      },

      guid: guid,

      mix: function() {
        var self = this,
          params = toArray(arguments);

        if (typeof params[0] == 'string') {
          self = self[params.shift()] = {}
        }

        params.unshift(self);
        extend.apply(null, params);
      }
    };


  /*-----------------------------domReady-----------------------------------*/


  ! function() {

    var readyList = [],
      doc = document;

    Q.ready = function(fn) {
      readyList ? readyList.push(fn) : fn();
    };

    function fireReady() {
      var handler;

      if (readyList) {
        while (handler = readyList.shift()) {
          handler();
        }
        readyList = null;
      }
    }

    if (doc.body) { //如果此时页面载入完毕

      setTimeout(fireReady, 0);

    } else {
      if ('readyState' in doc) { //ie

        doc.attachEvent('onreadystatechange', function() {
          var readyState = doc.readyState;

          if (readyState == 'interactive' || readyState == 'complete') {
            fireReady();
            doc.detachEvent('onreadystatechange', arguments.callee)
          }

        });

      } else {

        doc.addEventListener('DOMContentLoaded', function() {

          fireReady();
          doc.removeEventListener('DOMContentLoaded', arguments.callee, false);

        }, false);
      }
    }
  }();

  /*---------------------------浏览器特性探嗅------------------------*/
  ! function(window, document) {

    var documentMode = document.documentMode,
      div = document.createElement('div'),
      style,
      a;

    div.innerHTML = "<a href='/a'>a</a>";
    div.setAttribute('className', 'q-test');
    div.style.cssText = "width:6px;border:1px solid red;boxSizing:border-box;";

    style = div.style;

    a = div.getElementsByTagName('a')[0];
    a.style.cssText = "opacity:.5;float:left";

    Q.support = {
      cssFloat: !!a.style.cssFloat,

      //获取链接的href是否为正确的字符串 IE67
      isGetHrefNormal: (a.getAttribute('href') === '/a'),

      opacity: /^0.5/.test(a.style.opacity),

      //在IE67中 通过getAttribute获取的style为一个对象 非字符串
      style: /float/.test(a.getAttribute('style')),

      //在IE67中 get/setAttribute时 需要转换 如class=>className for=>htmlFor
      getSetAttribute: div.className != 'q-test',

      //ie67没有提供JSON的反序及序列化
      JSON: !!(window.JSON && typeof window.JSON.stringify === 'function'),

      //判断浏览器是否实现了hashchange事件 IE67木有。。
      hashChange: ('onhashchange' in window) && (documentMode == undefined || documentMode > 7),

      pushState: (typeof window.history.pushState === 'function'),

      replaceState: (typeof window.history.replaceState === 'function')
    };


    //判断是否支持boxSizing;
    Q.ready(function() {
      var body = document.body;
      body.appendChild(div);
      Q.support.boxSizing = div.offsetWidth == 6;
      body.removeChild(div);
    });

    //判断是否支持css3渐变
    ! function() {
      var attrName = 'transition',
        capAttrName = attrName.charAt(0).toUpperCase() + attrName.slice(1),
        vendorAttrName;

      each(['Webkit', 'Moz', 'O', 'ms', ''], function(index, preFix) {

        vendorAttrName = preFix.length ? preFix + capAttrName : attrName;

        if (vendorAttrName in style) {
          Q.support.transition = true;
          return false;
        }
      })
    }();

  }(window, document);

  /*---------------------------浏览器检查---------------------------------------*/
  ! function() {
    var ua = window.navigator.userAgent;

    if (window.opera) { //Opera浏览器
      Q.Browser.ver = window.opera.version();
      Q.broser.opera = parseFloat(Q.Browser.ver);

    } else if (ua.indexOf('AppleWebKit') > -1) { //Webkit

      if (/Chrome\/([0-9.]*)/.test(ua)) { //chorme
        Q.Browser.chrome = parseFloat(RegExp['$1']);
      } else {
        /version\/([0-9.]*)/.test(ua); //safari
        Q.Browser.safari = parseFloat(RegExp['$1']);
      }

      /AppleWebKit\/([0-9.]*)/.test(ua);
      Q.Browser.ver = RegExp['$1'];

    } else if (/Firefox\/([0-9.]*)$/.test(ua)) { //firfox
      Q.Browser.firfox = parseFloat(RegExp['$1']);

      /Gecko\/([0-9]*)/.test(ua);
      Q.Browser.ver = RegExp['$1'];

    } else if (/MSIE\s([^;]+)/.test(ua)) { //ie
      Q.Browser.ie = parseFloat(RegExp['$1']);

      /Trident\/([0-9.]*)/.test(ua);
      Q.Browser.ver = RegExp['$1'];
    }
  }();

  /*-----------------------------类型定义模块-----------------------------------*/


  function proto() {}; //所有类型的方法所在实例（prototype）的类型

  function noop() {}; //空函数

  var Class = {
    /*定义类型*/
    define: function() {
      var parent, params = core_slice.call(arguments),
        klass,
        i, len, partial;

      //基类
      if (params.length > 0 && core_toString.apply(params[0]) == "[object Function]") {
        parent = core_shift.call(params);
      }

      klass = function() {
        this.init.apply(this, arguments);
      }

      //klass.subclasses = [];
      klass.superclass = parent;

      if (parent) {
        proto.prototype = parent.prototype;
        klass.prototype = new proto();
        klass.prototype.constructor = klass;
        /*if (parent.subTypes) {
          parent.subTypes.push(klass);
        }*/
      }

      for (i = 0, len = params.length; i < len; i++) {
        if (partial = params[i]) {
          this.addMember(klass, partial);
        }
      }

      return klass;
    },

    addMember: function(target, source) {
      var i, member, method, memberType;

      for (i in source) {

        if (i == "prototype" || i == "constructor" || i == 'subTypes' || i == 'superclass' || !source.hasOwnProperty(i)) {
          continue;
        }

        member = source[i];
        memberType = core_toString.apply(member);

        //静态方法
        if (i == 'statics' && memberType == '[object Object]') {
          extend(target, member);
          continue;
        }

        //实例方法
        if (memberType == "[object Function]") {

          //返回的新函数用于添加$name及$owner 实现 callParent方法
          method = (function(m) {
            return function() {
              return m.apply(this, arguments);
            };
          })(member);

          method.$name = i;
          method.$owner = target;

          target.prototype[i] = method;
          continue;
        };

        //属性
        target.prototype[i] = member;
      }
    }
  };

  /*抽象类型*/
  var Abstract = Class.define({

    type: 'Abstract',

    /*获取继承路径*/
    getXTypes: function() {
      var path = [],
        type = this.constructor.prototype.type,
        curConstructor = this.constructor;

      while (type) {
        path.unshift(type);

        curConstructor = curConstructor.superclass;
        type = curConstructor && curConstructor.prototype.type;
      }

      return path.join('/');
    },

    isXType: function(type) {
      var xtypes = this.getXTypes();

      if (Q.String.isEmpty(xtypes)) {
        return;
      }

      return ('/' + xtypes + '/').indexOf('/' + type + '/') >= 0;
    },

    statics: {
      destroy: destroy
    }
  });

  /**
   * 调用父类中的方法
   * @param  {String}     method      方法名
   * @param  {Array}      args        参数列表
   *
   *
   * 1.调用当前方法的父类版本
   * this.callParent(arguments);
   *
   * 2.调用父类中的render方法
   * this.callParent('render',[container,position]);
   *
   */
  Abstract.prototype.callParent = function(method, args) {
    var methodName = isString(method) ? method : false,
      caller,
      superPorto;

    //没有提供方法名
    if (!methodName) {
      args = method;
      caller = method.callee.caller;

      methodName = caller.$name;
      superPorto = caller.$owner.superclass.prototype;
    }

    //没有找到方法名直接返回
    if (!methodName) {
      return;
    }

    if (!superPorto) {
      caller = arguments.callee.caller.caller;
      superPorto = caller.$owner.superclass.prototype;

      //没有找到 直接gohome
      if (!superPorto) {
        return;
      }
    }

    return methodName in superPorto ?
      superPorto[methodName].apply(this, args || []) : null;
  };

  each('String Array Number Boolean Date Function RegExp Object'.split(' '), function(index, item) {
    class2type['[object ' + item + ']'] = item.toLowerCase();
  });

  function getType(obj) {
    return obj != undefined ? class2type[core_toString.apply(obj)] || 'object' : String(obj);
  }

  function isFunction(obj) {
    return obj && getType(obj) == 'function';
  }

  function isRegExp(obj) {
    return obj && getType(obj) == 'RegExp';
  }

  function isArray(obj) {
    return obj && getType(obj) == 'array';
  }

  function isBool(obj) {
    return getType(obj) == 'boolean';
  }

  function isNumber(obj) {
    return !isNaN(parseFloat(obj)) && isFinite(obj); //是否无穷大
  }

  function isObject(obj) {
    return obj && getType(obj) == 'object';
  }

  function isDate(val) {
    return val && getType(val) == 'date';
  }

  function isUndefined(val, allowBlank) {
    return val == undefined || ((Q.isArray(val) && !val.length)) || (!allowBlank ? val === '' : false);
  }

  function isDefined(val, allowBlank) {
    return !isUndefined(val, allowBlank);
  }

  function isElement(obj) {
    return obj != null && obj.ownerDocument && (typeof obj.nodeType == 'number');
  }

  function isWindow(obj) {
    return obj != null && obj == obj.window;
  }

  function isHash(obj) {
    return obj instanceof Q.Hash;
  }

  function isString(obj) {
    return getType(obj) == "string";
  }

  function isXML(el) {
    var docElemnt = (el.ownerDocument || el).documentElement;

    return docElemnt ? docElemnt.nodeName !== 'HTML' : false;
  }

  /*检查对象是否为一个纯粹的对象*/
  function isPlainObject(obj) {
    var key;

    if (!obj || Q.type(obj) !== 'object' || obj.nodeType || Q.isWindow(obj)) {
      return false;
    }

    //ie8中
    //迭代属性的时候 不是像标准浏览器一样（先迭代自身属性 再迭代原型链上的）
    //而是先迭代原型链上的属性（按赋值先后顺序 PS这TM高科技是怎么做到的？）
    //最后再迭代自身属性
    //所以我们用isPrototypeOf检测构造函数的原型链
    //如果原型链没有isPrototypeOf 那么就不是一个纯粹的对象
    try {
      if (obj.constructor &&
        !core_hasOwnProperty.call(obj, "constructor") &&
        !core_hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
        return false;
      }
    } catch (e) {
      return false;
    }

    for (key in obj) {}

    //迭代的时候原型链上的属性出现的顺序总是在当前属性的后面
    //所以我们只需要检测key是否是自身属性
    return key == undefined || core_hasOwnProperty.call(obj, key);
  }


  function isEmptyObject(obj) {
    var name;
    for (name in obj) {
      return false;
    }
    return true;
  }


  function inArray(obj, array) {
    var ret = -1;
    each(array, function(i, item) {
      if (obj === item) {
        ret = i;
        return false;
      }
    });
    return ret;
  }

  var cmpUId = 0;

  function id(el, prefix) {
    el = Q.dom.get(el) || {};

    if (!el.id) {
      el.id = (prefix || 'x-cmp-') + (++cmpUId)
    }

    return el.id;
  }

  function destroy() {
    Q.each(arguments, function(_, arg) {
      if (arg) {
        if (Q.isArray(arg)) {
          this.destroy.apply(this, arg);
        } else if (arg.destroy) {
          arg.destroy();
        } else if (arg.dom) {
          arg.remove();
        }
      }
    }, this);
  }

  Q.mix({
    Class: Class,
    Abstract: Abstract,
    type: getType,
    isObject: isObject,
    isRegExp: isRegExp,
    isFunction: isFunction,
    isArray: isArray,
    isBool: isBool,
    isNumber: isNumber,
    isDefined: isDefined,
    isUndefined: isUndefined,
    isElement: isElement,
    isHash: isHash,
    isString: isString,
    isWindow: isWindow,
    isDate: isDate,
    noop: noop,
    isPlainObject: isPlainObject,
    isEmptyObject: isEmptyObject,
    isXML: isXML,
    inArray: inArray,
    id: id,
    destroy: destroy
  });


  /*-----------------------------工具函数模块-----------------------------------*/

  /*
        将类数组转换为数组
    */
  function toArray(iterable) {
    if (!iterable) return;

    var arr,
      len, i;

    try { //IE67中NodeList为COM对象 抛出异常
      arr = core_slice.call(iterable, 0)
    } catch (e) {
      arr = [];
      len = iterable.length;

      for (i = 0; i < len; i++) {
        arr.push(iterable[i]);
      }
    }
    return arr;
  }

  /*
        拓展对象
        1.extend(target,src1...)

        2.extend(true,target,src1...)
    */
  function extend() {
    var target = arguments[0] || {},
      i = 1,
      len = arguments.length,
      deep = false,
      option, src, copy, name, isArray, clone;

    //深度/浅度复制
    if (typeof target === 'boolean') {
      deep = target;
      target = arguments[1];
      i = 2;
    }

    for (; i < len; i++) {
      if ((option = arguments[i]) != null) {
        for (name in option) {
          src = target[name];
          copy = option[name];

          //同一引用对象
          if (src === copy) {
            continue;
          }

          //深度复制
          if (deep && copy && (Q.isObject(copy) || (isArray = Q.isArray(copy)))) {

            if (isArray) {
              isArray = false;
              clone = src && Q.isArray(src) ? src : [];
            } else {
              clone = src && Q.isObject(src) ? src : {};
            }

            target[name] = arguments.callee(deep, clone, copy);

          }
          //浅度复制
          else if (option.hasOwnProperty(name)) {
            target[name] = copy;
          }
        }
      }
    }
    return target;
  }

  function applyIf(target, source) {
    var params, source, i;

    if (arguments.length < 2) {
      return clone(target);
    }

    target = target || {};
    params = core_slice.call(arguments, 1);

    while (source = params.shift()) {
      for (i in source) {
        target[i] === undefined && (target[i] = source[i]);
      }
    }

    return target;
  }


  function each(iterable, fn, context) {
    var i, item;

    if (!iterable || !fn) {
      return;
    }

    //数组 类数组
    if (iterable.length && core_toString.call(iterable) != '[object String]') {
      for (i = 0; i < iterable.length; i++) {
        item = iterable[i];
        if (fn.call(context || item, i, item, iterable) === false) break; //返回false中断迭代
      };
    } else { //对象
      for (i in iterable) {
        if (!core_hasOwnProperty.call(iterable, i)) continue;
        item = iterable[i];
        if (fn.call(context || item, i, item, iterable) === false) break;
      }
    }
  }

  /*
        返回一个上下文指向context的代理函数
    */
  function proxy(fn, context) {
    if (!isFunction(fn)) {
      return undefined;
    }

    var params = core_slice.call(arguments, 2),
      proxy = function() {
        return fn.apply(context || this, params.concat(core_slice.call(arguments, 0)));
      };

    if (!fn.guid) {
      // 给函数添加唯一标签 在解除匿名代理事件时使用
      fn.guid = guid++;
    }

    proxy.guid = fn.guid;

    return proxy;
  }

  function delay(fn, context, millis) {
    var scope, params, timerId;

    if (Q.isNumber(context)) { //如果没有上下文
      core_splice.call(arguments, 1, undefined);
      scope = undefined;
    } else {
      scope = context;
    }

    //第3个参数后的所有参数为函数参数
    params = core_slice.call(arguments, 3);
    fn = proxy.apply(null, [fn, scope].concat(params));

    if (millis > 0) {
      timerId = setTimeout(fn, millis);
    } else {
      fn();
      timerId = 0;
    }
    return timerId;
  }

  function wrap(context) {
    var scope, fnQueue = core_slice.call(arguments, 0);

    scope = Q.isFunction(context) ?
      undefined : fnQueue.shift();

    return function() {
      var i, len,
        fn, ret;

      for (i = 0, len = fnQueue.length; i < len; i++) {
        fn = fnQueue[i];

        //如果前置方法返回false终止执行
        if (Q.isFunction(fn) && (ret = fn.apply(scope || this, arguments)) === false) {
          break;
        }
      }
      return ret;
    }
  }


  function globalEval(data) {
    var ret;
    if (data && Q.String.trim(data)) {
      //window.execScript IE及早期Chrome支持
      //因为IE的eval和ff的区别为window.eval在FF中作用域为全局
      //而IE则为当前作用域 解决方法就是用execScript
      (window.execScript || function(data) {
        ret = window["eval"].call(window, data);
      })(data);

      return ret;
    }
  }

  /**
   * 生成一个命名空间
   */
  function namespace(ns, root) {
    var nsArray = ns.split('.'),
      current = root || window,
      i, len, current_ns;

    for (i = 0, len = nsArray.length; i < len; i++) {
      current_ns = nsArray[i];

      //如果该层不存在 
      if (!current[current_ns]) {
        current[current_ns] = {};
      }

      current = current[current_ns];
    }

    return current;
  }

  Q.mix({
    extend: extend,
    applyIf: applyIf,
    each: each,
    proxy: proxy,
    wrap: wrap,
    delay: delay,
    toArray: toArray,
    globalEval: globalEval,
    ns: namespace
  });

  window.Q = Q;
}();

/*-----------------------------缓存模块-----------------------------------*/

Q.mix('cache', {

  _cache: {},

  expando: Q.name + '_' + (Q.version + Math.random()).replace(/\D/g, ''),

  uuid: 0, //缓存ID

  deleteIdArray: [], //删除的ID

  hasData: function(el) {
    var cache = el.nodeType ? Q.cache._cache[el[Q.cache.expando]] : el[Q.cache.expando];
    return cache && !Q.cache._isEmptyCache(cache);
  },

  _isEmptyCache: function(cache) {
    var name;

    for (name in cache) {
      if (name == 'data' && isEmptyObject(cache[name])) {
        continue;
      }
      return false;
    }
    return true;
  },

  _data: function(el, key, val) {
    return this.data(el, key, val, true);
  },

  data: function(el, key, val, _prv /*内部调用*/ ) {
    var isNode = el.nodeType,

      innerKey = this.expando,

      getByName = typeof key == 'string', //为undefined时为获取元素对应的缓存对象

      cache = isNode ? this._cache : el,

      id = isNode ? el[innerKey] : el[innerKey] && innerKey,

      thisCache;

    //在外部调用取值的时候 如果没有缓存 就直接返回
    if ((!id || !cache[id] || (!_prv && !cache[id].data)) && getByName && val === undefined) {
      return;
    }

    if (!id) {
      //获取缓存对象
      if (isNode) {
        //如果为HTML元素 在HTML标记一个uuid 将缓存添加到cache.data中
        //元素的缓存ID为废弃的ID或者新建一个ID
        id = el[innerKey] == undefined ?
          (el[innerKey] = this.deleteIdArray.shift() || ++this.uuid) : el[innerKey];

      } else {
        id = innerKey;
      }
    }

    thisCache = cache[id] || (cache[id] = {});

    !_prv && (thisCache = thisCache.data || (thisCache.data = {}));

    if (getByName) {
      val !== undefined && (thisCache[key] = val);
      thisCache = thisCache[key];
    }

    return thisCache;
  },

  remove: function(el, key, _prv /*内部调用*/ ) {
    //判断元素是否有缓存
    if (!this.hasData(el)) {
      return;
    }

    var thisCache, isNode = el.nodeType,
      id = isNode ? el[this.expando] : this.expando,
      cache = isNode ? this._cache[id] : el[id];

    //如果缓存为空 返回
    if (!cache) {
      return;
    }

    if (key) {
      thisCache = _prv ? cache : cache.data;

      if (thisCache) {
        delete thisCache[key];
      }

      if (!_prv) { //如果是访问外部缓存
        delete cache.data[key];
        if (isEmptyObject(cache.data)) {
          delete cache.data;
        }
      } else {
        delete cache[key];
      }
    }

    if (this._isEmptyCache(cache)) {
      if (Q.inArray(id, this.deleteIdArray) < 0 && isNode) {
        this.deleteIdArray.push(id);
      }

      delete this._cache[id];

      if (isNode) {
        el[this.expando] = null;
      } else {
        delete el[this.expando];
      }
    }
  }
});


/*------------------------------------事件模块-----------------------------------*/
+ function(window, Q) {
  var rmouseEvent = /^(?:mouse|contextmenu)|click/,

    rneedContext = new RegExp('\s*([+>~ ])\s*', 'g'),

    rkeyEvent = /^key/,

    props = "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

    fixHooks = {}, //修复事件

    keyHooks = { //键盘事件
      props: "char charCode key keyCode".split(" "),

      fix: function(event, original) {

        if (event.which == null) {
          event.which = original.charCode != null ? original.charCode : original.keyCode;
        }

        event.isNavKey = this.isNavKey;
        event.isSpecialKey = this.isSpecialKey;

        return event;
      },

      isNavKey: function() {
        var me = this,
          key = me.which;
        // Page Up/Down, End, Home, Left, Up, Right, Down
        return (key >= 33 && key <= 40) ||
          key == 13 || //RETURN
          key == 9 || //Tab
          key == 27; //ESC
      },

      isSpecialKey: function() {
        var k = this.which;
        return (this.type == 'keypress' && this.ctrlKey) ||
          this.isNavKey() ||
          (k == 8) || // Backspace
          (k >= 16 && k <= 20) || // Shift, Ctrl, Alt, Pause, Caps Lock
          (k >= 44 && k <= 46); // Print Screen, Insert, Delete
      }
    },

    mouseHooks = { //鼠标事件修复
      props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),

      fix: function(event, original) {
        var eventDoc, doc, body,
          fromElement = original.fromElement,
          button = original.button;

        if (event.pageX == undefined && original.clientX != undefined) {
          eventDoc = event.target.ownerDocument;
          doc = eventDoc.documentElement;
          body = eventDoc.body;

          event.pageX = original.clientX + (doc.scrollLeft || body.scrollLeft);
          event.pageY = original.clientY + (doc.scrollTop || body.scrollTop);
        }

        //相关元素
        if (!event.relatedTarget && fromElement) {
          event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
        }

        if (!event.which && button !== undefined) {
          event.which = (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
        }

        return event;
      }
    };

  Q.each(("blur focus focusin focusout load resize scroll unload click dblclick " +
    "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
    "change select submit keydown keypress keyup error contextmenu").split(" "), function(i, key) {

    if (rkeyEvent.test(key)) {
      fixHooks[key] = keyHooks;
    }

    if (rmouseEvent.test(key)) {
      fixHooks[key] = mouseHooks;
    }
  });


  /*事件对象*/
  Q.Event = function(event) {
    if (event && event.type) { //event object
      this.original = event;
      this.type = event.type;

      //是否事件已被组织默认动作
      this.defaultPrevented = (event.defaultPrevented || event.returnValue === false ||
        event.getPreventDefault && event.getPreventDefault());

    } else { //event name
      this.type = event;
    }
  };

  Q.Event.fix = function(event) {

    if (event instanceof Q.Event) {
      return event;
    }

    var original, hook, copy, prop, i;

    event = new Q.Event(event);
    original = event.original; //原始事件对象
    hook = fixHooks[event.type] || {},
      copy = hook.props ? props.concat(hook.props) : props;

    for (i = copy.length; i;) {
      prop = copy[--i];
      event[prop] = original[prop];
    }

    //事件源
    if (!event.target) {
      event.target = original.srcElement || document;
    }

    //修复文本触发事件
    if (event.target.nodeType == 3) {
      event.target = event.target.parentNode;
    }

    return (hook && hook.fix) ? hook.fix(event, event.original) : event;
  };

  Q.Event.prototype = {

    //是否默认动作被阻止
    defaultPrevented: false,

    //是否停止冒泡
    isPropagationStopped: false,

    stopPropagation: function() {
      var src = this.original;

      this.isPropagationStopped = true;

      if (!src) {
        return;
      }

      if (src.stopPropagation && Q.isFunction(src.stopPropagation)) {
        src.stopPropagation();
      } else {
        src.cancelBubble = true;
      }
    },

    preventDefault: function() {
      var src = this.original;

      this.defaultPrevented = true;

      if (!src) {
        return;
      }

      if (src.preventDefault && Q.isFunction(src.preventDefault)) {
        src.preventDefault();
      } else {
        src.returnValue = false;
      }
    }
  };

  Q.mix('events', {
    add: function(el, types, handler, data, selector) {
      var elData, types, i, type,
        special, elEvents, eventHandler, handlerInfo, handlers, isStrSelect;

      if (!el || el.nodeType == 3 || el.nodeType == 8 || !types || !types.length || !handler || !(elData = Q.cache._data(el))) {
        return;
      }

      types = Q.String.trim(types).split(/\s+/);
      elEvents = elData.events;

      if (!elEvents) {
        elEvents = elData.events = {}; //事件信息存放的地方
      }

      if (!handler.guid) {
        handler.guid = Q.guid++; //给handler添加guid便于删除
      }

      eventHandler = elData.handler;
      isStrSelect = Q.isString(selector); //可能为一个对象


      if (!eventHandler) { //事件代理函数
        eventHandler = elData.handler = function(e) {
          return typeof Q !== undefined && (!e || e.type !== Q.events.triggered) ?
            Q.events.dispatch.apply(arguments.callee.sender, arguments) :
            undefined;
        }
        eventHandler.sender = el;
      }

      for (i = 0; i < types.length; i++) {

        type = types[i];

        handlerInfo = {
          type: type,
          handler: handler,
          data: data,
          guid: handler.guid
        };

        if (isStrSelect) { //上下文为选择符
          handlerInfo.selector = selector;
          handlerInfo.needContext = selector && rneedContext.test(selector);
        } else { //上下文为对象
          handlerInfo.context = selector;
        }

        selector = handlerInfo.selector;

        handlers = elEvents[type];

        special = Q.events.special[type] || {};
        type = (selector ? special.delegateType : special.bindType) || type;

        if (!handlers) {
          handlers = elEvents[type] = [];
          handlers.delegateCount = 0;

          if (el.attachEvent) {
            el.attachEvent('on' + type, eventHandler);
          } else if (el.addEventListener) {
            el.addEventListener(type, eventHandler, false);
          }
        }

        //如果为子元素的代理
        if (selector) {
          handlers.splice(handlers.delegateCount++, 0, handlerInfo);
        } else {
          handlers.push(handlerInfo);
        }
      }
    },

    //事件派发
    dispatch: function(event) {
      event = Q.Event.fix(event || window.event);

      var handlers = ((Q.cache._data(this, 'events') || {})[event.type]) || [],
        delegateCount = handlers.delegateCount,
        handlerQueue = [],
        args = arguments,
        cur, i, handlerObj, selector,
        selMatch, matches, j, sender;

      event.delegateTarget = this;

      if (delegateCount) {
        //从事件源一直迭代到当前代理元素
        for (cur = event.target; cur != this; cur = cur.parentNode || this) {

          if (cur.disabled !== true) {
            selMatch = {};
            matches = [];

            for (i = 0; i < delegateCount; i++) {
              handlerObj = handlers[i]; //委托事件处理函数对象
              selector = handlerObj.selector; //委托事件源选择符

              if (selMatch[selector] === undefined) {
                //检查当前元素是否匹配选择器
                selMatch[selector] = handlerObj.needContext ?
                  Q.dom.find(selector, this).indexOf(cur) >= 0 :
                  Q.dom.find(selector, this, null, [cur]).data.length;

              }
              //如果当前元素为事件代理元素加入匹配数组
              if (selMatch[selector]) {
                matches.push(handlerObj);
              }

            }

            //加入执行队列
            if (matches.length) {
              handlerQueue.push({
                sender: cur,
                matches: matches
              });
            }
          }


        }
      }

      if (handlers.length > delegateCount) {
        handlerQueue.push({
          sender: this,
          matches: handlers.slice(delegateCount) //除开委托事件
        });
      }
      //调用相关事件处理函数
      for (i = 0; i < handlerQueue.length; i++) {
        sender = event.currentTarget = handlerQueue[i].sender;
        matches = handlerQueue[i].matches;

        for (j = 0; j < matches.length; j++) {
          if (!event.isPropagationStopped) { //如果事件没有停止冒泡
            event.handlerObj = handlerObj = matches[j];
            event.data = handlerObj.data;
            event.result = handlerObj.handler.apply(handlerObj.context || sender, args);
          }
        }
      }

      return event.result;
    },

    //触发事件
    trigger: function(el, type, data, noBubble) {

      if (!el && el.nodeType == 3 || el.nodeType == 8) {
        return;
      }

      var event, eventPath, /*事件触发路径*/
        special, /*特殊事件处理*/ bubbleType, /*冒泡事件类型 */
        cur, /*当前元素*/ i, handler, ontype, old, ontype;

      if (!(type instanceof Q.Event)) {
        event = new Q.Event(type); //事件对象
        event.target = el;
      } else {
        event = type;
        type = event.type;
      }

      special = Q.events.special[type] || {};

      eventPath = [
        [el, special.bindType || type]
      ];

      //如果不冒泡 就不加载其祖先元素
      if (!noBubble) {
        bubbleType = special.delegateType || type;

        //将el的所有祖先元素添加到事件路径中（模拟冒泡）
        for (cur = el; cur; cur = cur.parentNode) {
          eventPath.push([cur, bubbleType]);
        }
      }

      //转换为数组
      if (!Q.isArray(data)) {
        data = [data];
      }

      data.unshift(event);

      for (i = 0; i < eventPath.length && !event.isPropagationStopped; i++) {
        cur = eventPath[i][0];
        handler = Q.cache._data(cur, 'events') && Q.cache._data(cur, 'handler');

        if (handler) {
          event.type = eventPath[i][1];
          handler.apply(cur, data);
        }
      }

      ontype = 'on' + type;

      //执行默认动作
      //焦点、失去焦点
      if (!noBubble && !event.defaultPrevented && Q.isElement(el) && el[type] && !Q.isWindow(el)) {
        old = el[ontype];

        if (old) {
          el[ontype] = null;
        }

        //阻止事件再次执行 因为我们已经执行过了一次
        Q.events.triggered = type;
        el[type]();
        Q.events.triggered = undefined;

        if (old) {
          el[ontype] = old;
        }
      }

      return event.result;
    },

    /*移除事件绑定*/
    remove: function(el, type, handler, selector) {
      if (!Q.cache.hasData(el)) {
        return;
      }

      var elData = Q.cache._data(el),
        context,
        events, special, handlers, handlerCount,
        i, handlerObj, delegateHandler, unbindTypes;

      if (!elData || !(events = elData.events)) {
        return;
      }

      //如果没有指定事件类型 则移除该元素上的所有事件
      if (!type) {
        for (type in events) {
          Q.events.remove(el, type);
        }
        return;
      }

      if (!Q.isString(selector)) {
        context = selector;
        selector = undefined;
      }


      special = Q.events.special[type]; //特殊事件处理
      type = special && (selector ? special.delegateType : special.bindType) || type; //事件类型
      handlers = events[type] || []; //事件处理函数
      handlerCount = handlers.length;

      //如果指定了需要解除绑定的事件处理函数 就只删除该事件处理对象
      if (handler) {
        for (i = 0; i < handlerCount; i++) {

          handlerObj = handlers[i];

          if ((!handler || handlerObj.handler.guid == handler.guid) &&
            (!context || handlers[i].context == context) &&
            (!selector || handlers[i].selector == selector)) {

            if (handlers[i].selector) { //如果是代理事件
              handlers.delegateCount--;
            }

            handlers.splice(i, 1); //从缓存中删除事件对象

            break;
          }

        }
      } else {
        //清空该事件代理
        handlers.length = 0;
        handlers.delegateCount = 0;
      }

      //事件处理函数数量为0，移除当前事件绑定函数
      if (!handlers.length) {
        Q.events.removeEvent(el, type, elData.handler); //移除事件绑定

        delete events[type]; //删除相应的对象
      }


      if (Q.isEmptyObject(events)) {
        delete elData.events;
        elData.handler.sender = null;
        Q.cache.remove(el, 'handler', true);
      }
    },

    //移除事件绑定
    removeEvent: document.removeEventListener ? function(el, type, handler) {
      el.removeEventListener(type, handler, false);
    } : function(el, type, handler) {
      type = 'on' + type;
      if (el.detachEvent) {
        el.detachEvent(type, handler);
      }
    },

    /*特殊处理 如focus的冒泡类型为focusin*/
    special: {
      focus: {
        delegateType: 'focusin'
      },
      blur: {
        delegateType: 'focusout'
      }
    }
  });

}(window, Q)



/*------------------------------------选择器模块-----------------------------------*/
Q.mix((function(window, Q) {
  var Token = String,

    doc = document,

    expando = 'queryCache' + (Q.version + Math.random()).replace('\D', ''),

    //空白
    rwitespace = '\\s',

    //字符
    rcharset = '[A-Za-z0-9-]+',

    //操作符
    roperator = "([*^$!~]?=)",

    //匹配表达式
    matchExpr = {
      ID: new RegExp('^#(' + rcharset + ')'),
      CLASS: new RegExp('^\\.(' + rcharset + ')'),
      TAG: new RegExp('^(' + rcharset + '|\\*)'),
      ATTR: new RegExp('^\\[(' + rcharset + ')' + roperator + '(?:\\x22|\\x27)?(' + rcharset + ')(?:\\x22|\\x27)?\\]'), //\x22\x27为冒号引号的unicode码
      CHILD: new RegExp('^:(nth|first|last|only)-child(?:\\((\\d*)\\))?')
    },

    //关系表达式
    rcombinators = new RegExp('^' + rwitespace + '*([+>~ ])' + rwitespace + '*'),

    //查询分隔符
    rselectorSeparator = new RegExp('^' + rwitespace + '*,' + rwitespace + '*'),

    //关系
    relative = {
      '>': {
        dir: 'parentNode',
        first: true
      },
      ' ': {
        dir: 'parentNode'
      },
      '~': {
        dir: 'previousSibling',
        first: true
      },
      '+': {
        dir: 'previousSibling'
      }
    },

    //用value标记fn
    markFunction = function(fn, value) {
      fn[expando] = value;
      return fn;
    },

    //缓存工厂
    createCache = function() {
      var val = {};
      return markFunction(function(key, value) {
        if (value != null) {
          val[key] = value;
        }
        return val[key];
      }, val);
    },
    //class正则缓存
    classExpCache = createCache(),

    //用来存放选择表达式对应的超级匹配器
    completeCache = createCache(),

    //返回一个HTML元素的匹配函数
    elementMatcher = function(matches) {
      return matches.length > 1 ?
        function(el, context, isXML) {
          var len = matches.length;
          while (len--) {
            if (!matches[len].call(null, el, context, isXML)) {
              return false;
            }
          }
          return true;
        } : matches[0];
    },

    //连接符匹配函数
    combinatorMatcher = function(matcher, combinator) {
      var dir = combinator.dir;

      return combinator.first ?
        function(el, context, isXML) {
          while (el = el[dir]) {
            if (el.nodeType == 1) {
              return matcher(el, context, isXML);
            }
          }
        } :
        function(el, context, isXML) {
          while (el = el[dir]) {
            if (el.nodeType == 1 && matcher(el, context, isXML)) {
              return true;
            }
          }
        };
    },

    //判定函数
    judge = function(fn) {
      var div = doc.createElement('div');
      return fn(div);
    },

    //判定在getById的时候 是否会获取到name为id的元素
    judgeGetIdNotName,

    //判定getElementsByTagName的时候 返回的HTMLCllection中没有comment
    judgeTagNameNoComments = judge(function(div) {
      var comments = doc.createComment('');
      div.appendChild(comments);
      return !div.getElementsByTagName('*').length;
    }),

    //判定浏览器是否支持getElementsByName
    judgeSupportGetByName = judge(function(div) {
      div.innerHTML = '<a name="' + expando + '"></a>';
      doc.documentElement.insertBefore(div, doc.documentElement.firstChild);

      var isSupport = doc.getElementsByName && doc.getElementsByName(expando) == 1;

      judgeGetIdNotName = !doc.getElementById(expando);

      doc.documentElement.removeChild(div);
      return isSupport;
    }),

    //判定浏览器是否支持getElementsByClassName IE9+
    judgeSupportGetByClass = judge(function(div) {
      div.innerHTML = '<span class="' + expando + '"></span>'
      return !!(div.getElementsByClassName && div.getElementsByClassName(expando).length);
    }),

    //过滤器
    filter = {
      ID: judgeGetIdNotName ? function(id) {
        return function(el) {
          return el.getAttribute('id') == id;
        };
      } : function(id) {
        return function(el) {
          var attrNode = el.getAttributeNode('id');
          return attrNode && attrNode.nodeValue;
        }
      },
      CLASS: function(className) {
        var exp = classExpCache[expando][className];

        if (!exp) {
          exp = classExpCache(className, new RegExp('(^|' + rwitespace + ')' + className + '(' + rwitespace + '|$)'));
        }

        return function(el) {
          return exp.test(el.className);
        };
      },
      TAG: function(tag) {
        if (tag == '*') {
          return function(el) {
            var nodeType = el.nodeType;
            return nodeType != 3 && e.nodeType != 8;
          }
        }
        return function(el) {
          return el.nodeName && el.nodeName.toLowerCase() === tag;
        };
      },
      ATTR: function(attrName, operator, value) {
        return function(el) {
          var attrVal = Q.Element.attr(el, attrName);

          return operator == '=' ? attrVal === value :
            operator == '!=' ? attrVal !== value :
            operator == '~=' ? attrVal.indexOf(' ' + value + ' ') > 0 :
            operator == '*=' ? attrVal.indexOf(value) > 0 :
            operator == '^=' ? attrVal.indexOf(value) == 0 :
            operator == '=$' ? attrVal.subString(attrVal.length - value.length) == value :
            false;
        };
      },
      CHILD: function(type, arg) {
        if (type == 'nth') {
          return function(el) {
            var index = 0,
              parent = el.parentNode,
              node;

            if (parent) {
              for (node = el.firstChild; node; node = node.nextSibling) {
                if (node.nodeType == 1) {
                  index++;
                  if (node == el)
                    break;
                }
              }
            }

            return index == arg;
          };
        }

        return function(el) {
          var node = el;
          switch (type) {
            case 'only': //only-child
            case 'first': //first-child
              while (node = node.previousSibling) {
                if (node.nodeType == 1) {
                  return false;
                }
              }

              if (type == 'first') {
                return true;
              }

              node = el;
            case 'last': //last-child
              while (node = node.nextSibling) {
                if (node.nodeType == 1) {
                  return false;
                }
              }
              return true;
          }
        }
      }
    },

    //HTML查找器
    find = {

      ID: function(id) {
        var el = doc.getElementById(id);
        return el ? [el] : [];
      },

      NAME: judgeSupportGetByName && function(name) {
        var result = doc.getElementsByName(name);
        return result ? result : [];
      },

      CLASS: judgeSupportGetByClass && function(className, context, isXML) {
        if (context.getElementsByClassName && !isXML) {
          return context.getElementsByClassName(className);
        }
      },

      TAG: judgeTagNameNoComments ? function(tag, context) {
        return context.getElementsByTagName(tag);
      } : function(tag, context) {
        var elArray = context.getElementsByTagName(tag),
          len = elArray.length,
          result, el;

        if (tag == '*') {
          result = [];
          while ((el = elArray[--len])) {
            if (el.nodeType == 1) {
              result.unshift(el);
            }
          }
          return result;
        }

        return elArray;
      }
    };


  //将查询表达式转换为标记数组

  function toTokenArray(selector) {
    var tokens, token /*匹配的结果*/ , match /*是否有匹配*/ , type,
      soFar = selector,
      groups = [];

    while (soFar) {
      //分隔符
      if (!token || (match = rselectorSeparator.exec(soFar))) {
        if (match) {
          soFar = soFar.slice(match[0].length);
        }
        groups.push(tokens = []);
      }

      token = false;

      //关系符
      if (match = rcombinators.exec(soFar)) {
        tokens.push(token = new Token(match.shift()));
        token.type = match[0];
        soFar = soFar.slice(token.length);
      }

      //属性符 ID选择符 类选择符 等
      for (type in matchExpr) {
        if (match = matchExpr[type].exec(soFar)) {
          tokens.push(token = new Token(match.shift()));
          token.type = type;
          token.matches = match;
          soFar = soFar.slice(token.length);
        }
      }

      if (!token) {
        break;
      }
    }

    return groups;
  }


  //将标记转换为匹配器

  function matchFromToken(tokenArray) {
    var len = tokenArray.length,
      match, i,
      matches = [];

    if (tokenArray.length && relative[tokenArray[0].type]) {

      //如果开始是关系符则添加一个默认元素匹配器
      matches.push(function(el, context, xml) {
        return el == context;
      });
    }


    for (i = 0; i < len; i++) {
      if (match = relative[tokenArray[i].type]) {

        matches = [combinatorMatcher(elementMatcher(matches), match)];
      } else {
        match = filter[tokenArray[i].type];
        matches.push(match.apply(null, tokenArray[i].matches));
      }
    }

    return elementMatcher(matches);
  }

  function select(selector, context, results, seed, isXML) {
    var group = toTokenArray(selector),
      tokens, token, i, type, _find,
      results = results || [],
      len = group.length;

    context = context || document;

    if (!seed) {
      if (len == 1) { //只有一个选择表达式
        tokens = group[0] = group[0].slice(0);

        //如果表达式中有多个选择符 且第一个为ID类型 上下文为document,则将上下文设置为此标签
        if (tokens.length > 2 && (token = tokens[0]) && token.type == 'ID' &&
          context.nodeType == 9 && !isXML && relative[tokens[1].type]) {

          context = find['ID'](token.matches[0])[0];

          selector = selector.slice(tokens.shift().length);
        }

        for (i = tokens.length - 1; i >= 0; i--) {
          token = tokens[i];
          type = token.type;

          //如果遇到连接符 终止
          if (relative[type]) {
            break;
          }

          //如果遇到选择符 获取相应的查找器 获取候选集
          if (!seed && (_find = find[type])) {
            seed = _find(token.matches[0], context, isXML);
            selector = tokens.join("");
            tokens.splice(i, 1);

            //如果标识符已解析完毕
            if (!tokens.length) {
              results = seed
              return results;
            }

            break;
          }
        }
      }
    }

    complete(selector, group)(
      seed,
      context,
      isXML,
      results
    );

    return results;
  }

  function complete(selector, group) {
    var i,
      matchers = [],
      cache = completeCache[expando][selector];


    if (!cache) {
      if (!group) {
        group = toTokenArray(selector);
      }

      i = group.length;

      while (i--) {
        matchers.push(matchFromToken(group[i]));
      }

      //缓存超级匹配器
      cache = completeCache(selector, generateSuperMatch(matchers));
    }

    return cache;
  }

  //生成一个终极匹配器

  function generateSuperMatch(matcherArray) {
    var superMatch = function(seed, context, isXML, results) {
      var i, j, node, matcher,

        elArray = Q.toArray(seed || find['TAG']('*', context));

      for (i = 0; node = elArray[i]; i++) {
        for (j = 0; matcher = matcherArray[j]; j++) {
          if (matcher(node, context, isXML)) {
            Array.prototype.push.call(results, node);
            break;
          }
        }
      }
    }

    return superMatch;
  }

  Q.extend(Q.support, {
    getIdNotName: judgeGetIdNotName,
    getTagNameNoComments: judgeTagNameNoComments,
    getByName: judgeSupportGetByName,
    getByClass: judgeSupportGetByClass
  })

  return {
    dom: {
      find: function() {
        var ret = select.apply(null, arguments);
        return new Q.List(ret);
      },
      get: function(selector, context) {

        if (Q.isElement(selector)) {
          return selector;
        } else if (selector instanceof Q.Element) {
          return selector.dom;
        }

        var params = Array.prototype.slice.call(arguments, 0),
          elArray = select.apply(null, params),
          len = elArray.length;

        return len ? elArray[len - 1] : undefined;
      }
    },
    find: function(selector, context) {
      var elArray = select(selector, context || document),
        array = Q.toArray(elArray);

      return new Q.List(array);
    },
    get: function(selector, context) {
      var params, el;

      if (selector == undefined) {
        return;
      }

      if (selector instanceof Q.Element) {
        return selector;
      }

      if (typeof selector == 'string' && !selector.nodeType) { //如果是选择符
        el = this.dom.get(selector, context);
        return el !== undefined ? new Q.Element(el) : el;
      } else {
        el = selector;
      }

      return new Q.Element(el);
    }
  }

})(window, Q));

+ function(window, Q, undefined) {

  /*-----------------------------集合类型------------------------------------*/

  var REG_STR_TRIM = new RegExp('(?:^\s*)|(?:\s*$)', 'g'),

    core_shift = Array.prototype.shift,

    core_slice = Array.prototype.slice;


  function _iterator(item) { //默认迭代函数
    return item;
  };

  function _sort(left, right) {
    return left - right;
  }

  /*虚拟类 提供基本的迭代方法*/
  var Enumerable = Q.Class.define(Q.Abstract, {

    type: 'Enumerable',

    each: function(iterator, context) {
      this._each(iterator, context);
      return this;
    },
    some: function(iterator, context) {
      var ret = false;

      iterator = iterator || _iterator;

      this.each(function(i, item) {
        if (ret = !!iterator.call(context || item, i, item, this)) {
          return false;
        }
      }, this);

      return ret;
    },
    every: function(iterator, context) {
      var ret = false;

      iterator = iterator || _iterator;

      this.each(function(i, item) {
        if (!(ret = iterator.call(context || item, i, item, this))) {
          return false;
        };
      }, this);

      return ret;
    },
    /*
            invert为 true 返回不满足条件的结果
        */
    grep: function(iterator, context, invert) {
      iterator = iterator || _iterator;

      var ret = [],
        ismatch = false;

      this.each(function(i, item) {
        ismatch = iterator.call(context || item, i, item, this);

        if (invert) {
          ismatch = !ismatch;
        }

        if (ismatch) {
          ret.push(item);
        }

      }, this);

      return this.newSelf(ret);
    },
    map: function(iterator, context) {
      iterator = iterator || _iterator;
      var ret = [];

      this.each(function(i, item) {
        ret.push(iterator.call(context || item, i, item, this));
      }, this);

      return this.newSelf(ret);
    },
    /*
            累计值 常用于统计
            参数：
                memo: 初始值
                iterator: 计算函数，在每一个元素上执行
                context: iterator中的上下文(this);
            返回值：最后迭代生成的结果
        */
    inject: function(memo, iterator, context) {
      this.each(function(i, item) {
        memo = iterator.call(this, memo, i, item, this);
      }, context);
      return memo;
    },

    contains: function(obj) {
      var result = false;

      this.each(function(i, item) {
        if (item === obj) {
          result = true;
          return false;
        }
      });

      return result;
    },
    /*
            获取集合中的最大值
            参数：
            iterator:计算元素值的函数
        */
    max: function(iterator, context) {
      var result = null;

      iterator = iterator || _iterator;

      this.each(function(i, item) {
        item = iterator.call(this, item);

        if (result == null || item >= result) {
          result = item;
        }
      }, context);

      return result;
    },
    min: function(iterator, context) {
      var result = null;

      iterator = iterator || _iterator;

      this.each(function(i, item) {
        item = iterator.call(this, item);

        if (result == null || item < result) {
          result = item;
        }
      }, context);

      return result;
    },
    /*
            获取集合中每个元素中的同一属性
        */
    pluck: function(prop) {
      var ret = [],
        extrac;

      //xxx.oo
      if (prop.indexOf('.')) {
        extrac = new Function('o', 'return o.' + prop + ';');
      }

      this.each(function(index, item) {
        ret.push(extrac ?
          extrac(item) :
          item[prop]);
      });

      return ret;
    },
    invoke: function() {
      var params = arguments,
        mName = core_shift.call(params),
        ret = [];

      this.each(function(_, item) {
        if (Q.isFunction(item[mName])) {
          ret.push(item[mName].apply(item, params));
        }
      });

      return ret;
    },
    newSelf: Q.noop
  });

  Enumerable.prototype.filter = Enumerable.prototype.grep;
  Enumerable.prototype.clone = Enumerable.prototype.newSelf;

  var List = Q.Class.define(Enumerable, {

    type: 'List',

    init: function(obj) {
      this.data = obj ? Q.toArray(obj) : [];
    },

    count: function(fn) {
      var ret;

      if (fn === undefined) {
        ret = this.data.length;
      } else {
        ret = this.grep(fn).length;
      }

      return ret;
    },

    _each: function(iterator, context) {
      var index, data, len;

      for (index = 0, data = this.data.slice(0), len = data.length; index < len; index++) {
        if (iterator.call(context || data[index], index, data[index], data) === false) {
          break;
        }
      }
    },

    get: function(index) {
      if (!Q.isNumber(index) || this.data.length <= index) {
        return undefined;
      }
      return this.data[index];
    },

    getBy: function(filter) {
      var ret;
      this.each(function(index, item) {
        if (filter(index, item) === true) {
          ret = item;
          return false;
        }
      });

      return ret;
    },

    first: function() {
      return this.data[0];
    },

    add: function(item) {
      if (item == undefined) {
        return;
      }

      if (Q.isArray(item)) {
        this.data = this.data.concat(item);
      } else {
        this.data.push(item);
      }
    },

    indexOf: function(obj) {
      return Q.inArray(obj, this.data);
    },

    getIndex: function(fn, context) {
      var result = -1;

      this.each(function(index, item) {
        if (fn.call(context || item, index, item) === true) {
          result = index;
          return false;
        }
      });

      return result;
    },

    splice: function() {
      return this.newSelf(this.data.slice.apply(arguments));
    },

    removeAll: function(condition) {

      if (condition == undefined) {
        this.data.length = 0;
        return;
      }

      if (Q.isFunction(condition)) { //如果是function

        this.each(function(index, item) {
          if (condition.call(this, index, item) === true) {
            this.data.splice(index, 1);
          }
        }, this);

      } else {
        this.each(function(index, item) {
          if (item === condition) {
            this.data.splice(index, 1);
          }
        }, this);
      }
      return this;
    },

    remove: function(obj) {
      var index = Q.inArray(obj, this.data);

      if (index > -1) {
        return this.data.splice(Q.inArray(obj, this.data), 1)[0];
      }
    },

    removeAt: function(index) {
      this.data.splice(index, 1);
    },

    replace: function(index, obj) {
      if (Q.isFunction(index)) {
        index = this.getIndex(index);
      }

      if (index < 0) {
        return undefined;
      }

      return this.data.splice(index, 1, obj)[0];
    },

    merge: function(obj) {
      if (obj && obj.length && typeof obj != 'string') {
        return this.newSelf(this.data.concat(obj));
      };
    },

    toArray: function() {
      return this.data.slice(0);
    },

    sort: function(fn, direction, context) {
      var dec;

      fn = fn || _sort;
      direction = String(direction).toUpperCase();
      dec = direction.toUpperCase() == "DESC" ? -1 : 1; //正序1 倒序-1

      this.data.sort(function(left, right) {
        return fn.call(context || this, left, right) * dec;
      });
    },

    getRange: function(start, end) {
      var items = this.data,
        length = items.length,
        i, ret = [];

      if (items.length < 1) {
        return ret;
      }

      start = start || 0;
      end = Math.min(end == undefined ? length - 1 : end, length - 1);

      if (start <= end) {
        for (i = start; i <= end; i++) {
          ret.push(items[i]);
        }
      } else {
        for (i = start; i >= end; i--) {
          ret.push(items[i]);
        }
      }
      return ret;
    },

    newSelf: function(data) {
      return new List([].concat(data || this.data));
    }
  });

  List.prototype.clear = List.prototype.removeAll;

  List.from = function(obj) {
    return new List(obj);
  };

  var Hash = Q.Class.define(Enumerable, {

    statics: {

      from: function(obj) {
        return new Hash(obj);
      }
    },

    type: 'Hash',

    init: function(obj) {
      this.data = obj ? Q.extend({}, obj) : {};
    },

    count: function() {
      return $key(this.data).length;
    },

    _each: function(iterator, context) {
      var key, value;
      for (key in this.data) {
        value = this.data[key];
        if (iterator.call(context || value, key, value) === false) {
          break;
        };
      }
    },

    key: function() {
      return this.pluck("key");
    },

    value: function() {
      return this.pluck("value");
    },

    merge: function(obj) {
      var data = isObject(obj) && (data = isHash(obj) ? obj.data : obj);

      return this.newSelf(Q.extend({}, this.data, data));
    },

    remove: function(key) {
      if (!this.data[key] === undefined) return;
      delete this.data[key];
    },

    get: function(key) {
      return this.data[key];
    },

    set: function(key, value) {
      this.data[key] = value;
    },

    update: function(obj) {
      return new Hash(obj).inject(this, function(hash, key, item) {
        this[item.key] = item;
      })
    },

    removeAll: function() {
      this.each(function(key) {
        delete this[key];
      }, this.data)
    },
    newSelf: function(data) {
      return new Hash(Q.extend({}, data || this.data));
    }
  });

  List.prototype.clone = List.prototype.newSelf;

  Hash.prototype.toArray = Hash.prototype.value;

  /*
        混合类型
    */
  var MixCollection = Q.Class.define(List, {

    type: 'MixCollection',

    /*
            @param* {array|object} obj 可选
            @param {string|function} nameProp
        */
    init: function(obj, nameProp) {
      var objType = Q.type(obj),
        namePropType = Q.type(nameProp),
        keys = {},
        data = [];
      //整理参数
      if (nameProp == undefined && (objType == 'string' || objType == 'function')) {
        nameProp = obj;
        obj = undefined;

        objType = Q.type(obj);
        namePropType = Q.type(nameProp);
      }

      //key提取器
      if (namePropType == 'function') {

        this.getKey = function(o) {
          return String(nameProp(o));
        };

      } else {

        nameProp = nameProp == undefined ? '' : ('.' + nameProp);
        this.getKey = new Function('o', 'return String(o' + nameProp + ');');
      }

      if (objType == 'object' || objType == 'array') {
        Q.each(obj, function(i, item) {
          keys[this.getKey(item)] = item;
          data.push(item);
        }, this);
      }

      this.keys = keys;
      this.data = data;
    },

    contains: function(item) {
      return Q.isString(item) ? !!this.keys[item] : this.callParent(arguments);
    },

    get: function(key) {
      var keyType = Q.type(key);

      if (keyType == 'number') {
        return this.data[key];
      } else if (keyType == 'string') {
        return this.keys[key];
      } else if (keyType == 'object') {
        return this.keys[this.getKey(key)];
      }
    },

    insert: function(index, data) {
      this.add(data, index);
    },

    add: function(obj, /*private*/ index) {
      var key, old_index, i, item;

      if (Q.isArray(obj)) { //数组

        i = 0;
        while (item = obj[i++]) {
          this.add(item, index);
        }

        return;
      } else {

        if (obj == undefined) {
          return;
        }

        //获取键值
        key = this.getKey(obj);

        if (this.keys[key]) { //已存在

          old_index = Q.inArray(this.keys[key], this.data);
          if (old_index !== -1) {
            this.data.splice(old_index, 1);
          }
        }

        this.keys[key] = obj;

        if (Q.isNumber(index)) {
          this.data.splice(index, 0, obj);
        } else {
          this.data.push(obj);
        }
      }
    },

    indexOfKey: function(key) {
      var item = this.keys[key],
        index = -1;

      if (item) {
        index = Q.inArray(item, this.data);
      }
      return index;
    },

    splice: function() {
      var removed = core_slice.apply(this.data, arguments),
        key,
        added = core_slice.call(arguments, 2);

      //注销
      Q.each(removed, function(_, item) {
        key = this.getKey(item);
        delete this.keys[key];
      }, this);

      //添加
      Q.each(added, function(_, item) {
        key = this.getKey(item);
        this.keys[key] = item;
      }, this);
    },

    remove: function(item) {
      if (!item) {
        return;
      }

      return this.removeByKey(this.getKey(item));
    },

    removeByKey: function(key) {
      var item, key, ret;

      if (!key) {
        return;
      }

      key = String(key);
      item = this.keys[key];

      //如果记录在keys汇总存在
      if (this.keys[key]) {
        ret = this.data.splice(Q.inArray(item, this.data), 1);
        delete this.keys[key];
      }

      return ret;
    },

    removeAt: function(index) {
      var item;

      if (index == undefined) {
        return;
      }

      item = this.data[index];

      return this.remove(item);
    },

    removeBy: function(condition, context) {
      var me = this;

      this.each(function(index, item) {
        if (condition.call(this, index, item) === true) {
          me.removeByKey(me.getKey(item));
        }
      }, context);
    },

    removeAll: function(condition) {
      var i, item;

      if (condition == undefined) {
        for (i in this.keys) {
          delete this.keys[i];
        }

        this.data.length = 0;

      } else if (Q.isArray(condition)) {
        i = 0;
        while (item = remove[i++]) {
          this.removeByKey(this.getKey(item));
        }

      } else if (Q.isFunction(condition)) {
        this.removeBy(this.getKey(item));
      }

      return this;
    },

    replace: function(index, item) {
      var org, key, orgIndex, removed;

      if (index == undefined || item == undefined) {
        return;
      }

      if (Q.isString(index)) {
        org = this.keys[index];
        key = index;
      } else {
        org = this.data[index];
        orgIndex = index;
      }

      if (!org) {
        return;
      }

      //
      if (orgIndex == undefined) {
        orgIndex = Q.inArray(org, this.data);
      }

      if (key == undefined) {
        key = this.getKey(org);
      }

      //删除旧引用
      delete this.keys[key];
      //替换旧项的位置
      removed = this.data.splice(orgIndex, 1, item);

      key = this.getKey(item);
      this.keys[key] = item;

      return removed[0];
    },

    merge: function(obj) {
      var ret;

      if (!obj) {
        return;
      }

      ret = new MixCollection(this.data);
      ret.add(obj);

      return ret;
    },
    newSelf: function(data) {
      return new MixCollection([].concat(data || this.data), this.getKey);
    }
  });

  MixCollection.prototype.clear = MixCollection.prototype.removeAll;
  MixCollection.prototype.clone = MixCollection.prototype.newSelf;

  MixCollection.from = function(obj) {
    return new MixCollection(obj);
  };

  Q.mix({
    Enumerable: Enumerable,
    List: List,
    Hash: Hash,
    MixCollection: MixCollection
  })


}(window, Q);



/*-----------------------------JSON模块-----------------------------------*/
! function(Q, window) {
  var nullStr = 'null',

    emptyString = '',

    core_hasOwnProperty = Object.prototype.hasOwnProperty,

    toStr = window.String,

    cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,

    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,

    meta = { // table of character substitutions
      '\b': '\\b',
      '\t': '\\t',
      '\n': '\\n',
      '\f': '\\f',
      '\r': '\\r',
      '"': '\\"',
      '\\': '\\\\'
    },
    rep;

  function quote(string) {
    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
      var c = meta[a];
      return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
  }

  /*将对象的某一属性转换为json*/
  function stringifyProp(key, obj) {
    var prop = obj[key],
      i, item, partial, len, value, ret;

    //如果存在过滤函数
    //stringify第二个参数为函数
    if (typeof rep === 'function') {
      prop = rep.call(obj, key, prop);
    }

    switch (Q.type(prop)) {
      case 'string':
        ret = quote(prop);
        break;
      case 'number':
        ret = isFinite(prop) ? String(prop) : nullStr;
      case 'null':
      case 'boolean':
        ret = toStr(prop);
        break;
      case 'date':
        ret = quote([
          prop.getFullYear() + '-',
          padLeft(prop.getMonth() + 1) + '-',
          padLeft(prop.getDate()) + 'T',
          padLeft(prop.getHours()) + ':',
          padLeft(prop.getMinutes()) + ':',
          padLeft(prop.getSeconds()) + 'Z'
        ].join(emptyString));
        break;
      case 'array':
        partial = [];
        for (i = 0, len = prop.length; i < len; i++) {
          partial.push(stringifyProp(i, prop) || nullStr);
        }
        ret = '[' + partial.join(',') + ']';
        break;
      case 'object':
        partial = [];
        //如果string第二个函数为过滤数组
        if (Q.isArray(rep)) {
          for (i = 0, len = rep.length; i < len; i++) {
            item = rep[i];
            if (typeof item === 'string' && core_hasOwnProperty.call(prop, item) && (value = stringifyProp(item, prop))) {
              partial.push(quote(item) + ':' + value);
            }
          }
        } else {
          for (i in prop) {
            if (core_hasOwnProperty.call(prop, i) && (value = stringifyProp(i, prop))) {
              partial.push(quote(i) + ':' + value);
            }
          }
        }
        ret = '{' + partial.join(',') + '}';
        break;
    }

    return ret;
  }

  function padLeft(n) {
    return n < 10 ? '0' + n : n;
  }

  function stringify(obj, replacer, space) {
    rep = replacer;

    if (replacer && typeof replacer !== 'function' &&
      (Q.isArray(replacer) && replacer.length)) {
      throw new Error('JSON.stringify');
    }

    return stringifyProp('', {
      '': obj
    });
  }

  /*将字符串解析为json*/
  function parse(text, reviver) {
    var json;

    function traverse(key, obj) {
      var prop = obj[key],
        k, value;

      if (prop && typeof prop === 'object') {
        for (k in prop) { //遍历属性 如果属性为undefined则删除
          if (core_hasOwnProperty.call(prop, k)) {
            value = arguments.callee(k, prop);
            if (value !== undefined) {
              prop[k] = value;
            } else {
              delete prop[k];
            }
          }
        }
      }
      return reviver.call(obj, key, prop);
    }

    text = String(text);
    cx.lastIndex = 0;

    if (cx.test(text)) {
      text = text.replace(cx, function(a) {
        return '\\u' +
          ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      });
    }

    try {
      json = Q.globalEval('(' + text + ')');
    } catch (e) {
      throw new SyntaxError('JSON.parse');
    }

    return typeof reviver === 'function' ?
      traverse('', {
        '': json
      }) : json;
  }

  Q.mix('JSON', {
    stringify: stringify,
    parse: parse
  });

}(Q, window);



/*--------------------ajax------------------------------------------*/
/*
 * Portions of this file are based on pieces of Yahoo User Interface Library
 * Copyright (c) 2007, Yahoo! Inc. All rights reserved.
 * YUI licensed under the BSD License:
 * http://developer.yahoo.net/yui/license.txt
 */
+ function() {
  var activeX = 'Microsoft.XMLHTTP',
    contentType = 'Content-Type',

    rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg;

  /*设置requestHeader*/
  function setHeader(o) {
    var conn = o.conn,
      headers = {},
      prop;

    Q.extend(headers, pub.headers, pub.defaultHeaders);

    + function(conn, headers) {

      for (prop in headers) {
        conn.setRequestHeader(prop, headers[prop]);
      }
    }(conn, headers);
    delete pub.headers;
  }

  /*创建一个异常*/
  function createExceptionObject(tId, callbackArg, isAbort, isTimeout) {
    return {
      tId: tId,
      status: isAbort ? -1 : 0,
      statusText: isAbort ? 'transaction aborted' : 'communication failure',
      isAbort: isAbort,
      isTimeout: isTimeout,
      argument: callbackArg
    };
  }

  /*初始化header*/
  function initHeader(label, value) {
    (pub.headers || (pub.headers = {}))[label] = value;
  }

  function createResponseObject(o, callbackArg) {
    var headerObj = {},
      headerStr,
      conn = o.conn,
      match,
      s,
      // see: https://prototype.lighthouseapp.com/projects/8886/tickets/129-ie-mangles-http-response-status-code-204-to-1223
      isBrokenStatus = conn.status == 1223;

    try {
      headerStr = o.conn.getAllResponseHeaders();
      while (match = headerStr.match(rnewline)) {
        headerObj[match[1].toLowerCase()] = match[2];
      }
    } catch (e) {}


    return {
      tId: o.tId,
      // Normalize the status and statusText when IE returns 1223, see the above link.
      status: isBrokenStatus ? 204 : conn.status,
      statusText: isBrokenStatus ? 'No Content' : conn.statusText,
      getResponseHeader: function(header) {
        return headerObj[header.toLowerCase()];
      },
      getAllResponseHeaders: function() {
        return headerStr;
      },
      responseText: conn.responseText,
      responseXML: conn.responseXML,
      argument: callbackArg
    };
  }

  function releaseObject(o) {
    if (o.tId) {
      pub.conn[o.tId] = null;
    }
    o.conn = null;
    o = null;
  }

  function handleTransactionResponse(o, callback, isAbort, isTimeout) {
    if (!callback) {
      releaseObject(o);
      return;
    }

    var httpStatus, responseObject;

    try {
      if (o.conn.status !== undefined && o.conn.status != 0) {
        httpStatus = o.conn.status;
      } else {
        httpStatus = 13030;
      }
    } catch (e) {
      httpStatus = 13030;
    }

    if ((httpStatus >= 200 && httpStatus < 300) || httpStatus == 1223) {
      responseObject = createResponseObject(o, callback.argument);
      if (callback.success) {
        if (!callback.scope) {
          callback.success(responseObject);
        } else {
          callback.success.call(callback.scope, responseObject);
        }
      }
    } else {
      switch (httpStatus) {
        case 12002:
        case 12029:
        case 12030:
        case 12031:
        case 12152:
        case 13030:
          responseObject = createExceptionObject(o.tId, callback.argument, (isAbort ? isAbort : false), isTimeout);
          if (callback.failure) {
            if (!callback.scope) {
              callback.failure(responseObject);
            } else {
              callback.failure.apply(callback.scope, [responseObject]);
            }
          }
          break;
        default:
          responseObject = createResponseObject(o, callback.argument);
          if (callback.failure) {
            if (!callback.scope) {
              callback.failure(responseObject);
            } else {
              callback.failure.apply(callback.scope, [responseObject]);
            }
          }
      }
    }

    releaseObject(o);
    responseObject = null;
  }

  function checkResponse(o, callback, conn, tId, poll, cbTimeout) {
    if (conn && conn.readyState == 4) {
      clearInterval(poll[tId]);
      poll[tId] = null;

      if (cbTimeout) {
        clearTimeout(pub.timeout[tId]);
        pub.timeout[tId] = null;
      }
      handleTransactionResponse(o, callback);
    }
  }

  function checkTimeout(o, callback) {
    pub.abort(o, callback, true);
  }


  // private
  function handleReadyState(o, callback) {
    callback = callback || {};
    var conn = o.conn,
      tId = o.tId,
      poll = pub.poll,
      cbTimeout = callback.timeout || null;

    if (cbTimeout) {
      pub.conn[tId] = conn;
      pub.timeout[tId] = setTimeout(Q.proxy(checkTimeout, window, o, callback), cbTimeout);
    }
    poll[tId] = setInterval(Q.proxy(checkResponse, window, o, callback, conn, tId, poll, cbTimeout), pub.pollInterval);
  }

  // private
  function asyncRequest(method, uri, callback, postData) {
    var o = getConnectionObject() || null;

    if (o) {
      o.conn.open(method, uri, true);

      if (pub.useDefaultXhrHeader) {
        initHeader('X-Requested-With', pub.defaultXhrHeader);
      }

      if (postData && pub.useDefaultHeader && (!pub.headers || !pub.headers[contentType])) {
        initHeader(contentType, pub.defaultPostHeader);
      }

      if (pub.defaultHeaders || pub.headers) {
        setHeader(o);
      }
      handleReadyState(o, callback);
      o.conn.send(postData || null);
    }
    return o;
  }

  // private
  function getConnectionObject() {
    var o;

    try {
      if (o = createXhrObject(pub.transactionId)) {
        pub.transactionId++;
      }
    } catch (e) {} finally {
      return o;
    }
  }

  // private
  function createXhrObject(transactionId) {
    var http;

    try {
      http = new XMLHttpRequest();
    } catch (e) {
      http = new ActiveXObject(activeX);
    } finally {
      return {
        conn: http,
        tId: transactionId
      };
    }
  }

  var pub = {
    request: function(method, uri, cb, data, options) {
      if (options) {
        var me = this,
          xmlData = options.xmlData,
          jsonData = options.jsonData,
          hs;

        Q.applyIf(me, options);

        if (xmlData || jsonData) {
          hs = me.headers;
          if (!hs || !hs[contentType]) {
            initHeader(contentType, xmlData ? 'text/xml' : 'application/json');
          }
          data = xmlData || (Q.isObject(jsonData) ? Q.JSON.stringify(jsonData) : jsonData);
        }
      }
      return asyncRequest(method || options.method || "POST", uri, cb, data);
    },

    useDefaultHeader: true,
    defaultPostHeader: 'application/x-www-form-urlencoded; charset=UTF-8',
    useDefaultXhrHeader: true,
    defaultXhrHeader: 'XMLHttpRequest',
    poll: {},
    timeout: {},
    conn: {},
    pollInterval: 50,
    transactionId: 0,

    //  This is never called - Is it worth exposing this?
    //          setProgId : function(id) {
    //              activeX.unshift(id);
    //          },

    //  This is never called - Is it worth exposing this?
    //          setDefaultPostHeader : function(b) {
    //              this.useDefaultHeader = b;
    //          },

    //  This is never called - Is it worth exposing this?
    //          setDefaultXhrHeader : function(b) {
    //              this.useDefaultXhrHeader = b;
    //          },

    //  This is never called - Is it worth exposing this?
    //          setPollingInterval : function(i) {
    //              if (typeof i == 'number' && isFinite(i)) {
    //                  this.pollInterval = i;
    //              }
    //          },

    //  This is never called - Is it worth exposing this?
    //          resetDefaultHeaders : function() {
    //              this.defaultHeaders = null;
    //          },

    abort: function(o, callback, isTimeout) {
      var me = this,
        tId = o.tId,
        isAbort = false;

      if (me.isCallInProgress(o)) {
        o.conn.abort();
        clearInterval(me.poll[tId]);
        me.poll[tId] = null;
        clearTimeout(pub.timeout[tId]);
        me.timeout[tId] = null;

        handleTransactionResponse(o, callback, (isAbort = true), isTimeout);
      }
      return isAbort;
    },

    isCallInProgress: function(o) {
      // if there is a connection and readyState is not 0 or 4
      return o.conn && !{
        0: true,
        4: true
      }[o.conn.readyState];
    }
  };

  Q.ajax = pub;

}(window, Q, undefined)

/*---------------------------dom处理--------------------------------*/
+ function(window, Q, undefined) {

  var doc = document,

    docEl = doc.documentElement,

    isCompat = doc.compatMode == "CSS1Compat",

    os = {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    },

    curCSS, //获取元素的CSS属性

    ralign = /^([a-z]+)-([a-z]+)(\?)?$/,

    ropacity = /opacity=([^)]*)/,

    rnumsplit = /^(\d+(?:\.\d+)?)(.*)$/i, //切割数字和单位

    roperaNum = /([+-])=(\d+(?:\.\d?)?(?:px|em|\%)?)/,

    rignorAttr = /^children|target|content$/,

    rsingleLabel = /^(?:br|frame|hr|img|input|link|meta|col)$/,

    //布尔值的属性
    rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,

    rwitespace = /\s+/,

    rmsPrefix = /^-ms-/,

    cssPrefixes = ['Webkit', 'Moz', 'O', 'ms'],

    cssHooks = {},

    cssProps = {
      float: Q.support.cssFloat ? 'cssFloat' : 'styleFloat'
    },

    /*使元素暂时可见*/
    cssShow = {
      display: 'block',
      position: 'absolute',
      visibility: 'hidden'
    },

    attrHooks = {},

    /*操作property时转换为正确的名称*/
    propFix = {
      'class': 'className',
      'for': 'htmlFor',
      rowspan: "rowSpan",
      colspan: "colSpan"
    },

    /*CSS值为数字时的时候 排除单位为PX的属性*/
    cssNumExclude = {
      "opacity": true,
      "zIndex": true,
      "fontWeight": true,
      "zoom": true
    },

    cssExpand = ['Top', 'Right', 'Bottom', 'Left'],

    valHooks = {},

    elDefaultDisplay = {}, //元素默认的display

    iframe,
    iframeDoc,

    /*
            提供操作单个HTML元素的静态方法
        */
    statics = {

      isCompat: isCompat,

      addClass: function(el, className) {
        if (!Q.isString(className)) { //检查参数
          return;
        }

        var classNames = Q.String.trim(className).split(rwitespace),
          cl, i, value, setClass;

        cl = el.className;

        if (!cl && classNames.length === 1) {
          el.className = className;
          return;
        }

        setClass = ' ' + cl + ' ';

        for (i = 0; i < classNames.length; i++) {
          if (setClass.indexOf(' ' + classNames[i] + ' ') < 0) {
            setClass += classNames[i] + ' ';
          }
        }
        el.className = Q.String.trim(setClass);
      },

      removeClass: function(el, className) {
        if (!Q.isString(className)) {
          return;
        }

        var classNames = Q.String.trim(className).split(rwitespace),
          cl, i, value;

        cl = ' ' + el.className + ' ';

        for (i = 0; i < classNames.length; i++) {
          if (cl.indexOf(' ' + classNames[i] + ' ') >= 0) {
            cl = cl.replace(' ' + classNames[i] + ' ', ' ');
          }
        }

        el.className = Q.String.trim(cl);
      },

      hasClass: function(el, className) {
        if (!Q.isString(className) || !className || !el.className) {
          return false;
        }

        return (' ' + el.className + ' ').indexOf(' ' + className + ' ') >= 0;
      },
      /*
                getter
                css(el,'color')

                setter:
                css(el,'color','red')
            */
      style: function(el, name, val, extra) {

        if (!el || el.nodeType == 3 || el.nodeType == 8) { //注释和文本节点不允许添加样式
          return;
        }

        var matches, type,
          orgName = camelCase(name),
          style = el.style,
          hook, ret;

        name = cssProps[orgName] || (cssProps[orgName] = vendorPropName(el.style, orgName));

        hook = cssHooks[name] || cssHooks[orgName];

        if (val != undefined) { //setter

          type = typeof val;

          if (type == 'string' && (matches = roperaNum.exec(val))) {
            //字符串转换为正负值+属性原来的值
            val = (matches[1] + 1) * matches[2] + parseFloat(statics.css(el, name));
            type = 'number';
          }

          //排除值为NaN和null的情况
          if (val == null || type === "number" && isNaN(val)) {
            return;
          }

          //如果值的类型为数值且不在排除的范围类 添加单位PX
          if (type === "number" && !cssNumExclude[name]) {
            val += "px";
          }

          if (!hook || !('set' in hook) || (val = hook.set(el, val, extra)) !== undefined) {
            style[name] = val;
          }

        } else { //getter

          if (hook && "get" in hook && (ret = hook.get(elem, extra)) !== undefined) {
            return ret;
          }

          // Otherwise just get the value from the style object
          return style[name];
        }
      },
      /*
                获取样式:
            */
      css: function(el, name, numeric, extra) {
        if (!el || el.nodeType == 3 || el.nodeType == 8) { //注释和文本节点不允许添加样式
          return;
        }

        var orgName = camelCase(name),
          hook, val, num;

        //添加对应前缀-ms-等
        name = cssProps[orgName] || (cssProps[orgName] = vendorPropName(el.style, orgName));

        hook = cssHooks[name] || cssHooks[orgName];


        if (hook && 'get' in hook) {
          val = hook.get(el, extra);
        }

        if (val === undefined) {
          val = curCSS(el, name);
        }

        if (numeric || extra !== undefined) {
          num = parseFloat(val);
          return numeric || Q.isNumber(num) ? num || 0 : val;
        }

        return val;
      },
      /*获取元素相对于文档可视区域左上角的偏移量*/
      offset: function(el) {
        var docElem, body, win, clientLeft, clientTop, scrollTop, scrollLeft,
          box = {
            top: 0,
            left: 0
          },
          doc = el && el.ownerDocument;

        if (!doc) {
          return;
        }

        if ((body = doc.body) === el) {
          return statics.bodyOffset(el);
        }

        docElem = doc.documentElement;

        //未插入文档
        if (!statics.contains(docElem, el)) {
          return box;
        }

        if (typeof el.getBoundingClientRect !== 'undefined') {
          box = el.getBoundingClientRect();
        }

        win = getWindow(doc);
        clientTop = docElem.clientTop || body.clientTop || 0;
        clientLeft = docElem.clientLeft || body.clientLeft || 0;
        scrollTop = win.pageYOffset || docElem.scrollTop;
        scrollLeft = win.pageXOffset || docElem.scrollLeft;

        return {
          top: box.top + scrollTop - clientTop,
          left: box.left + scrollLeft - clientLeft
        };
      },

      bodyOffset: function(body) {
        var top = body.offsetTop,
          left = body.offsetLeft;

        return {
          top: top,
          left: left
        };
      },

      setOffset: function(elem, options, i) {
        var position = statics.css(elem, "position");

        // set position first, in-case top/left are set even on static elem
        if (position === "static") {
          elem.style.position = "relative";
        }

        var curElem = Q.get(elem),
          curOffset = curElem.offset(),
          curCSSTop = statics.css(elem, "top"),
          curCSSLeft = statics.css(elem, "left"),
          calculatePosition = (position === "absolute" || position === "fixed") && Q.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
          props = {},
          curPosition = {},
          curTop, curLeft;


        // need to be able to calculate position if either top or left is auto and position is either absolute or fixed
        if (calculatePosition) {
          curPosition = curElem.position();
          curTop = curPosition.top;
          curLeft = curPosition.left;
        } else {
          curTop = parseFloat(curCSSTop) || 0;
          curLeft = parseFloat(curCSSLeft) || 0;
        }

        if (Q.isFunction(options)) {
          options = options.call(elem, i, curOffset);
        }

        if (options.top != null) {
          props.top = (options.top - curOffset.top) + curTop;
        }
        if (options.left != null) {
          props.left = (options.left - curOffset.left) + curLeft;
        }

        curElem.css(props);
      },
      nodeName: function(elem, name) {
        return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
      },
      position: function(elem) {
        if (!elem) {
          return;
        }

        var offsetParent, offset,
          parentOffset = {
            top: 0,
            left: 0
          };

        elem = Q.dom.get(elem);

        // fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
        if (statics.css(elem, "position") === "fixed") {
          // we assume that getBoundingClientRect is available when computed position is fixed
          offset = elem.getBoundingClientRect();
        } else {
          // Get *real* offsetParent
          offsetParent = statics.offsetParent(elem);

          // Get correct offsets
          offset = statics.offset(elem);
          if (!statics.nodeName(offsetParent, "html")) {
            parentOffset = statics.offset(offsetParent);
          }

          // Add offsetParent borders
          parentOffset.top += statics.css(offsetParent, "borderTopWidth", true);
          parentOffset.left += statics.css(offsetParent, "borderLeftWidth", true);
        }

        // Subtract parent offsets and element margins
        // note: when an element has margin: auto the offsetLeft and marginLeft
        // are the same in Safari causing offset.left to incorrectly be 0
        return {
          top: offset.top - parentOffset.top - statics.css(elem, "marginTop", true),
          left: offset.left - parentOffset.left - statics.css(elem, "marginLeft", true)
        };
      },

      offsetParent: function(elem) {
        var offsetParent = elem.offsetParent || document.documentElement;

        while (offsetParent && (!statics.nodeName(offsetParent, "html") && statics.css(offsetParent, "position") === "static")) {
          offsetParent = offsetParent.offsetParent;
        }

        return offsetParent || document.body;
      },
      /*缓存*/
      data: Q.proxy(Q.cache.data, Q.cache),

      removeData: Q.proxy(Q.cache.remove, Q.cache),

      cleanData: function(el) {
        el = Q.dom.get(el);

        if (!el) {
          return;
        }

        var cache = Q.cache._cache,
          innerKey = Q.cache.expando,
          i = 0,
          data, key;

        if (!(data = cache[el[innerKey]])) { //获取元素对应的缓存
          return;
        }

        //删除绑定事件
        if (data.events) {
          for (key in data.events) {
            Q.events.remove(el, key);
          }
        }

        //删除缓存
        for (key in data) {
          Q.cache.remove(el, key, true);
        }

        //删除元素上的UID
        if (el.removeAttribute) {
          el.removeAttribute(innerKey);
        }


        el[innerKey] = null;
      },

      /*事件 el, type, handler, data, selector*/
      on: function(el, type, data, handler, selector, /*private*/ one) {
        var event, orgHandler;


        if (Q.isObject(type)) { //on({click:{selector:'span',data:{name:'sss'},handler:fn}})

          for (event in type) {
            arguments.callee.call(this, event, type.selector, type.data, type.handler);
          }

        }

        /*参数调整*/
        if (Q.isFunction(data)) { //on('click',fn)
          one = selector;
          selector = handler;
          handler = data;
          data = undefined;
        }

        if (Q.isBool(selector)) {
          one = selector;
          selector = undefined
        }

        if (!type || !handler) {
          return;
        }

        if (one) { //只执行一次
          orgHandler = handler;
          handler = function() {
            statics.off(el, type, handler, selector);
            return orgHandler.apply(this, arguments);
          }
        }

        if (el.nodeType == 3 || el.nodeType == 8) {
          return;
        }

        Q.events.add(el, type, handler, data, selector);

        return this;
      },

      off: function(el, type, handler, selector) {

        if (handler == undefined) {
          handler = selector;
          selector = undefined;
        }

        //el, type, handler, selector
        Q.events.remove(el, type, handler, selector);

        return this;
      },

      trigger: Q.proxy(Q.events.trigger, Q.events),

      attr: function(el, name, val) {
        var nodeType = el.nodeType,
          hook, ret;

        if (!el || nodeType == 3 || nodeType == 8 || nodeType == 2) {
          return;
        }

        hook = attrHooks[name];

        if (val !== undefined) { //setter

          if (hook && 'set' in hook) {
            hook.set(el, val);
          } else {
            el.setAttribute(name, val);
          }

        } else if (hook && 'get' in hook) { //getter
          return hook.get(el);
        } else {
          ret = el.getAttribute(name);
          return ret === null ? undefined : ret;
        }
      },

      /*删除 Attribute*/
      removeAttr: function(el, val) {
        if (!el || el.nodeType !== 1) {
          return;
        }

        var attrNames = val.split(rwitespace),
          name, attrName, isBool,
          i = 0;

        for (; i < attrNames.length; i++) {
          name = attrNames[i];
          attrName = propFix[name] || name;
          isBool = rboolean.test(name);

          //如果不是布尔值控制的属性 设置为''这样在IE678这个渣渣中对应的prop也就没有了
          if (!isBool) {
            statics.attr(el, name, '');
          }

          el.removeAttribute(Q.support.getSetAttribute ? name : attrName);

          //如果未布尔值控制  在IE678中 设置对应的prop为false 
          if (isBool && attrName in el) {
            el[attrName] = false;
          }
        }
      },
      prop: function(el, name, val) {
        var nodeType = el.nodeType,
          ret;

        if (!el || nodeType == 3 || nodeType == 8 || nodeType == 2) {
          return;
        }

        name = propFix[name] || name;

        if (val !== undefined) { //setter
          el[name] = val;
        } else { //getter
          return el[name];
        }
      },
      removeProp: function(el, name) {
        var nodeType = el.nodeType;

        if (!el || nodeType == 3 || nodeType == 8 || nodeType == 2) {
          return;
        }

        name = propFix[name] || name;

        el[name] = undefined;
        delete el[name];
      },
      parentUntil: function(elem, selector, self) {
        var cur, ret, isString = Q.isString(selector);

        for (cur = self ? elem : elem.parentNode; cur && cur.nodeType == 1; cur = cur.parentNode) {
          if (isString ? statics.is(cur, selector) : selector(cur)) {
            ret = cur;
            break;
          }
        }
        return ret;
      },
      is: function(el, selector) {
        return !!Q.dom.find(selector, el.parentNode, null, [el]).data.length;
      },
      val: function(el, val) {
        if (!el && el.nodeType != 1) {
          return;
        }

        var hook = valHooks[el.type] || valHooks[el.nodeName.toLowerCase()],
          ret;

        if (val == undefined) { //getter

          if (hook && 'get' in hook) {
            return hook(el);
          }

          ret = el.value;
          return ret == null ? '' : ret + '';

        } else { //setter

          if (hook && 'set' in hook) {
            hook(el, val);
          }
          el.value = val;

        }
      },
      remove: function(el) {
        el = Q.dom.get(el);
        this.empty(el);
        statics.cleanData(el);
        el.parentNode && el.parentNode.removeChild(el);
      },
      /*清空元素*/
      empty: function(elem) {
        var i = 0,
          first, children, child;

        // Remove element nodes and prevent memory leaks
        if (elem.nodeType === 1) {
          i = 0;
          children = Q.toArray(elem.getElementsByTagName("*"));

          while (child = children[i++]) {
            statics.cleanData(child);
          }
        }

        // Remove any remaining nodes
        while (first = elem.firstChild) {
          elem.removeChild(elem.firstChild);
        }

        return this;
      },
      text: function(el, text) {
        el = Q.dom.get(el);

        if (!el) {
          return;
        }

        if (text != undefined) {
          statics.empty(el);
          //Q.get(el).append((el.ownerDocument || document).createTextNode(text));
          el.appendChild((el.ownerDocument || document).createTextNode(text));
        } else {
          return getText(el);
        }

      },
      show: function(el) {
        showHide(el, true);
      },
      hide: function(el) {
        showHide(el, false);
      },

      isHidden: isHidden,

      /*
                覆盖元素中的子元素
             */
      overwrite: function(el, config, returnElement) {
        el = Q.dom.get(el);
        el.innerHTML = Q.isObject(config) ? createHtml(config) : config;

        return returnElement === true ? new Q.Element(el.firstChild) : el.firstChild
      },

      createHtml: createHtml,

      insertAdjacentHTML: insertAdjacentHTML,

      serialize: serializeForm,

      getViewWidth: function(full) {
        return full ? statics.getDocumentWidth() : statics.getViewportWidth();
      },

      getDocumentWidth: function() {
        return Math.max(!isCompat ? doc.body.scrollWidth : docEl.scrollWidth, Q.Element.getViewportWidth());
      },

      getViewportWidth: document.documentMode && document.documentMode <= 8 ?
        function() {
          return Math.min(document.body.innerWidth, document.documentElement.innerWidth);
        } : function() {
          return window.innerWidth;
        },

      getViewHeight: function(full) {
        return full ? statics.getDocumentHeight() : statics.getViewportHeight();
      },

      getDocumentHeight: function() {
        return Math.max(!isCompat ? doc.body.scrollHeight : docEl.scrollHeight, Q.Element.getViewportHeight());
      },

      getViewportHeight: document.documentMode && document.documentMode <= 8 ?
        function() {
          return Math.min(document.body.innerHeight, document.documentElement.innerHeight);
        } : function() {
          return window.innerHeight;
        },

      /*
                暂时的替换元素的style

                主要用户在获取隐藏元素的宽度时，使其暂时可见
            */
      swap: function(el, settings, callback) {
        var prop, ret,
          orgStyle = {},
          style = el.style;

        for (prop in settings) {
          orgStyle[prop] = style[prop];
          style[prop] = settings[prop];
        }

        ret = callback.call(el);

        for (prop in orgStyle) {
          style[prop] = orgStyle[prop];
        }

        return ret;
      },

      contains: docEl.contains ? function(a, b) {
        var adown = a.nodeType === 9 ? a.documentElement : a,
          bup = b && b.parentNode;

        return a == b || (bup && bup.nodeType === 1 && adown.contains && adown.contains(b));

      } : docEl.compareDocumentPosition ? function(a, b) {

        return b && !!(a.compareDocumentPosition(b) & 16);

      } : function(a, b) {

        while (b = b.parentNode) {
          if (b == a) {
            return true;
          }
        }
        return false;
      }
    },

    Element = Q.Element = Q.Class.define(Q.Abstract, {
      type: 'Element',
      /*  
                1.new Q.Element('body>div.cn>span',context)
                2.new Q.Element(el1)
            */
      init: function(node) {
        var params = Q.toArray(arguments);

        if (Q.isString(node)) {
          node = Q.dom.get.apply(null, params);
        }

        this.dom = node;
      },

      statics: statics,

      getFrameWidth: function(sides) {
        var ret = 0;

        if (!sides) { // || (Q.support.boxSizing && statics.css(this.dom, 'box-sizing') == 'border-box')
          return ret;
        }

        Q.each(sides.split(/\s+/), function(index, side) {
          side = Q.String.cap(side);
          ret += parseInt(this.css('border' + side + 'Width')) || 0;
          ret += parseInt(this.css('padding' + side)) || 0
          ret += parseInt(this.css('margin' + side)) || 0;
        }, this);

        return ret;
      },

      addClass: function(className) {
        statics.addClass(this.dom, className);
        return this;
      },

      removeClass: function(className) {
        statics.removeClass(this.dom, className);
        return this;
      },

      hasClass: function(className) {
        return statics.hasClass(this.dom, className);
      },
      /*
                getter:
                elements.css('color')

                setter:
                elements.css('color','red')
                elements.css({'color':'red','zIndex',1})

            */
      css: function(name, value, extra) {
        var isObj = Q.isObject(name),
          el = this.dom,
          prop;

        //getter
        if (value === undefined && !isObj) {
          return statics.css(el, name, extra);
        }

        //setter
        if (isObj) {
          for (prop in name) {
            statics.style(el, prop, name[prop], extra);
          }
        } else {
          statics.style(el, name, value, extra);
        }

        return this;
      },

      data: function(name, value) {
        var el = this.dom;

        //getter
        if (value === undefined) {
          return Q.cache.data(el, name);
        }

        //setter
        Q.cache.data(el, name, value);

        return this;
      },

      removeData: function(name) {
        Q.cache.remove(this.dom, name);

        return this;
      },

      /*
                on('click','span',{name:'sss'},fn)

                on('click','span',fn)

                on('click',{name:'sss'},fn)

                on('click',fn)


                on({click:{selector:'span',data:{name:'sss'},handler:fn}})
            */
      /*取消元素事件的冒泡或默认动作*/
      swallowEvent: function(eventNames, preventDefault) {
        var me = this;

        function handler(e) {
          e.stopPropagation();
          if (preventDefault) {
            e.preventDefault();
          }
        }

        if (!Q.isArray(eventNames)) {
          eventNames = eventNames.split(/\s+/);
        }

        Q.each(eventNames, function(index, name) {
          this.on(name, handler);
        }, this);

        return me;
      },

      on: function(type, data, handler, selector, /*private*/ one) {
        statics.on(this.dom, type, data, handler, selector, one)
        return this;
      },

      one: function(type, data, handler, selector) {
        return this.on(type, data, handler, selector, true);
      },

      /*解除事件绑定*/
      off: function(type, handler, selector) {

        //el, type, handler, selector
        statics.off(this.dom, type, handler, selector);

        return this;
      },

      offset: function(settings) {
        if (settings === undefined) {
          return statics.offset(this.dom);
        } else {
          statics.setOffset(this.dom, settings);
        }
      },

      trigger: function() {
        var params = Array.prototype.slice.call(arguments, 0);

        params.unshift(this.dom);
        Q.events.trigger.apply(Q.events, params);
      },

      attr: function(name, value) {
        var prop, el = this.dom;

        if (typeof name == 'string' && value == undefined) { //getter

          return statics.attr(el, name)

        } else { //setter
          if (typeof name == 'object') { //名键值对的情况

            for (prop in name) {
              if (name[prop] != undefined) {
                arguments.callee.call(this, prop, name[prop]);
              }
            }

          } else {
            statics.attr(el, name, value);
          }
        }


        return this;
      },

      removeAttr: function(attr) {
        statics.removeAttr(this.dom, attr);
        return this;
      },

      prop: function(name, value) {
        var prop, el = this.dom;

        if (typeof name == 'string' && value == undefined) { //getter

          return statics.prop(el, name)

        } else { //setter
          if (typeof name == 'object') { //名键值对的情况

            for (prop in name) {
              if (name[prop] != undefined) {
                arguments.callee.call(this, prop, name[prop]);
              }
            }

          } else {

            statics.prop(el, name, value);

          }
        }

        return this;
      },

      removeProp: function(name) {
        statics.removeProp(this.dom, name);
        return this;
      },
      val: function(value) {
        if (value != undefined) {
          statics.val(this.dom, value);
          return this;
        } else {
          return statics.val(this.dom);
        }
      },
      is: function(selector) {
        return !!statics.is(this.dom, selector);
      },
      contains: function(el) {
        return statics.contains(this.dom, Q.dom.get(el));
      },
      parentUntil: function(until, self) {
        return statics.parentUntil(this.dom, until, self);
      },
      /*前一个节点*/
      prev: function() {
        var node = this.dom.previousSibling;

        if (node && node.nodeType === 1) {
          node = node.previousSibling;
        }

        return node;
      },
      /*下一个节点*/
      next: function() {
        var node = this.dom.nextSibling;

        if (node && node.nodeType === 1) {
          node = node.nextSibling;
        }

        return node;
      },
      empty: function() {
        statics.empty(this.dom);
        return this;
      },
      createChild: function(config, position, ct) {
        var div = ct || document.createElement('div'),
          el = statics.overwrite(div, config);

        if (position || position === 0) {
          this.insert(el, position);
        } else {
          this.dom.appendChild(el);
        }

        div = null;
        return Q.get(el);
      },
      wrap: function(config, returnDom) {

        var parent = insertAdjacentHTML(this.dom, 'beforebegin', createHtml(config));
        parent.appendChild(this.dom);
        return new Q.get(parent);
      },
      insert: function(node, index) {
        var sibling = Q.isElement(index) ? index : this.dom.childNodes[index] || null;
        node = Q.dom.get(node);

        if (this.dom && this.dom.nodeType === 1 || this.dom.nodeType === 11) {
          this.dom.insertBefore(node, sibling);
        }
      },
      insertTo: function(parent, index) {
        parent = Q.get(parent);

        var node = parent.children().get(index);
        parent.dom.insertBefore(this.dom, (node && node.dom) || null);
      },
      insertBefore: function(node) {
        node = Q.dom.get(node);
        node.parentNode.insertBefore(this.dom, node);
        return this;
      },
      insertAfter: function(node) {
        node = Q.dom.get(node);
        node.parentNode.insertBefore(this.dom, node.nextSibling || null);
        return this;
      },
      replaceWith: function(node) {
        node = Q.dom.get(node);
        node.parentNode.insertBefore(this.dom, node);
        statics.remove(node);
        return this;
      },
      prepend: function(node) {
        node = Q.dom.get(node);
        if (this.dom && this.dom.nodeType === 1 || this.dom.nodeType === 11) {
          this.dom.parentNode.insertBefore(node, this.dom);
        }
        return this;
      },
      prependTo: function(node) {
        node = Q.dom.get(node);
        if (node && node.nodeType === 1 || node.nodeType === 11) {
          node.parentNode.insertBefore(node, this.dom);
        }
        return this;
      },
      insertAdjacentHTML: function(where, html) {
        return insertAdjacentHTML(this.dom, where, html);
      },
      append: function(node) {
        node = Q.dom.get(node);
        if (this.dom && this.dom.nodeType === 1 || this.dom.nodeType === 11) {
          this.dom.appendChild(node);
        }
        return this;
      },
      appendTo: function(node) {
        node = Q.dom.get(node);
        if (node && node.nodeType === 1 || node.nodeType === 11) {
          node.appendChild(this.dom);
        }
        return this;
      },
      remove: function() {
        if (this.dom) {
          statics.remove(this.dom);
        }
        this.dom = null;
        return this;
      },
      children: function(selector) {
        return Q.find(selector || '*', this.dom, null, this.dom.childNodes);
      },
      child: function(selector) {
        return Q.get(selector, this.dom, null, this.dom.childNodes);
      },
      text: function(text) {
        if (text == undefined) {
          return statics.text(this.dom);
        } else {
          statics.text(this.dom, text);
        }
      },
      show: function() {
        showHide(this.dom, true);
        return this;
      },
      hide: function() {
        showHide(this.dom, false);
        return this;
      },
      isHidden: function() {
        return isHidden(this.dom);
      },

      position: function() {
        return statics.position(this.dom);
      },

      translatePoints: function(x, y) {
        y = isNaN(x[1]) ? y : x[1];
        x = isNaN(x[0]) ? x : x[0];

        var me = this,
          relative = me.css('position') == 'relative',
          o = me.offset(),
          l = parseInt(me.css('left'), 10),
          t = parseInt(me.css('top'), 10);

        l = !isNaN(l) ? l : (relative ? 0 : me.dom.offsetLeft);
        t = !isNaN(t) ? t : (relative ? 0 : me.dom.offsetTop);

        return {
          left: (x - o.left + l),
          top: (y - o.top + t)
        };
      },

      adjustForConstraints: function(xy, parent, offsets) {
        return this.getConstrainToXY(
          parent || document,
          false,
          offsets, xy) || xy;
      },

      // private ==>  used outside of core
      getConstrainToXY: function(el, local, offsets, proposedXY) {
        el = Q.get(el);
        offsets = offsets ? Q.applyIf(offsets, os) : os;

        var vw, vh, vx = 0,
          vy = 0;

        if (el.dom == document.body || el.dom == document) {
          vw = statics.getViewWidth();
          vh = statics.getViewHeight();
        } else {
          vw = el.dom.clientWidth;
          vh = el.dom.clientHeight;
          if (!local) {
            var vxy = el.offset();
            vx = vxy.left;
            vy = vxy.top;
          }
        }

        var s = el.getScroll();

        vx += offsets.left + s.left;
        vy += offsets.top + s.top;

        vw -= offsets.right;
        vh -= offsets.bottom;

        var vr = vx + vw,
          vb = vy + vh,
          xy = proposedXY || (!local ? this.offset() : this.position()),
          x = xy.left,
          y = xy.top,
          w = this.outerWidth(false),
          h = this.outerHeight(false);

        // only move it if it needs it
        var moved = false;

        // first validate right/bottom
        if ((x + w) > vr) {
          x = vr - w;
          moved = true;
        }
        if ((y + h) > vb) {
          y = vb - h;
          moved = true;
        }
        // then make sure top/left isn't negative
        if (x < vx) {
          x = vx;
          moved = true;
        }
        if (y < vy) {
          y = vy;
          moved = true;
        }
        return moved ? {
          top: y,
          left: x
        } : false;
      },

      alignTo: function(element, position, offsets) {
        var me = this;
        return me.offset(me.getAlignToXY(element, position, offsets));
      },

      getAlignToXY: function(el, p, o) {
        el = Q.get(el);

        if (!el || !el.dom) {
          throw "Element.alignToXY with an element that doesn't exist";
        }

        o = o || [0, 0];
        p = (!p || p == "?" ? "tl-bl?" : (!(/-/).test(p) && p !== "" ? "tl-" + p : p || "tl-bl")).toLowerCase();

        var me = this,
          d = me.dom,
          a1,
          a2,
          x,
          y,
          //constrain the aligned el to viewport if necessary
          w,
          h,
          r,
          dw = Q.Element.getViewWidth() - 10, // 10px of margin for ie
          dh = Q.Element.getViewHeight() - 10, // 10px of margin for ie
          p1y,
          p1x,
          p2y,
          p2x,
          swapY,
          swapX,
          doc = document,
          docElement = doc.documentElement,
          docBody = doc.body,
          scrollX = (docElement.scrollLeft || docBody.scrollLeft || 0) + 5,
          scrollY = (docElement.scrollTop || docBody.scrollTop || 0) + 5,
          c = false, //constrain to viewport
          p1 = "",
          p2 = "",
          m = p.match(/^([a-z]+)-([a-z]+)(\?)?$/);

        if (!m) {
          throw "Element.alignTo with an invalid alignment " + p;
        }

        p1 = m[1];
        p2 = m[2];
        c = !!m[3];

        //Subtract the aligned el's internal xy from the target's offset xy
        //plus custom offset to get the aligned el's new offset xy
        a1 = me.getAnchorXY(p1, true);
        a2 = el.getAnchorXY(p2, false);

        x = a2[0] - a1[0] + o[0];
        y = a2[1] - a1[1] + o[1];

        if (c) {
          w = me.outerWidth(false);
          h = me.outerHeight(false);
          r = el.getRegion();
          //If we are at a viewport boundary and the aligned el is anchored on a target border that is
          //perpendicular to the vp border, allow the aligned el to slide on that border,
          //otherwise swap the aligned el to the opposite border of the target.
          p1y = p1.charAt(0);
          p1x = p1.charAt(p1.length - 1);
          p2y = p2.charAt(0);
          p2x = p2.charAt(p2.length - 1);
          swapY = ((p1y == "t" && p2y == "b") || (p1y == "b" && p2y == "t"));
          swapX = ((p1x == "r" && p2x == "l") || (p1x == "l" && p2x == "r"));


          if (x + w > dw + scrollX) {
            x = swapX ? r.left - w : dw + scrollX - w;
          }
          if (x < scrollX) {
            x = swapX ? r.right : scrollX;
          }
          if (y + h > dh + scrollY) {
            y = swapY ? r.top - h : dh + scrollY - h;
          }
          if (y < scrollY) {
            y = swapY ? r.bottom : scrollY;
          }
        }
        return {
          top: y,
          left: x
        };
      },

      getRegion: function() {
        var me = this,
          xy = me.offset(),
          x = xy.left,
          y = xy.top,
          w = me.outerWidth(),
          h = me.outerHeight(),
          borderPadding, beforeX, beforeY;

        return {
          x: x,
          left: x,
          0: x,
          y: y,
          top: y,
          1: y,
          width: w,
          height: h,
          right: x + w,
          bottom: y + h
        };
      },

      getAnchorXY: function(anchor, local, s) {
        //Passing a different size is useful for pre-calculating anchors,
        //especially for anchored animations that change the el size.
        anchor = (anchor || "tl").toLowerCase();
        s = s || {};

        var me = this,
          vp = me.dom == document.body || me.dom == document,
          w = s.width || vp ? Q.Element.getViewWidth() : me.outerWidth(false),
          h = s.height || vp ? Q.Element.getViewHeight() : me.outerHeight(false),
          xy,
          r = Math.round,
          o = me.offset(),
          scroll = me.getScroll(),
          extraX = vp ? scroll.left : !local ? o.left : 0,
          extraY = vp ? scroll.top : !local ? o.top : 0,
          hash = {
            c: [r(w * 0.5), r(h * 0.5)],
            t: [r(w * 0.5), 0],
            l: [0, r(h * 0.5)],
            r: [w, r(h * 0.5)],
            b: [r(w * 0.5), h],
            tl: [0, 0],
            bl: [0, h],
            br: [w, h],
            tr: [w, 0]
          };

        xy = hash[anchor];
        return [xy[0] + extraX, xy[1] + extraY];
      },

      getScroll: function() {
        var d = this.dom,
          doc = document,
          body = doc.body,
          docElement = doc.documentElement,
          l,
          t,
          ret;

        if (d == doc || d == body) {
          if (Q.Browser.ie && isCompat) {
            l = docElement.scrollLeft;
            t = docElement.scrollTop;
          } else {
            l = window.pageXOffset;
            t = window.pageYOffset;
          }
          ret = {
            left: l || (body ? body.scrollLeft : 0),
            top: t || (body ? body.scrollTop : 0)
          };
        } else {
          ret = {
            left: d.scrollLeft,
            top: d.scrollTop
          };
        }
        return ret;
      }
    });

  Element.prototype.bind = Element.prototype.on;
  Element.prototype.unbind = Element.prototype.off;

  function getWindow(elem) {
    return Q.isWindow(elem) ?
      elem :
      elem.nodeType === 9 ?
      elem.defaultView || elem.parentWindow :
      false;
  }

  //获取样式
  if (window.getComputedStyle) { //W3C
    curCSS = function(el, name) {
      return window.getComputedStyle(el, null)[name];
    }
  } else if (document.documentElement.currentStyle) { //IE
    curCSS = function(el, name) {
      return el.currentStyle && el.currentStyle[name];
    }
  }

  var nodeSiblingMapping = {
    beforebegin: 'previousSibling',
    afterend: 'nextSibling',
    beforeend: 'lastChild',
    afterbegin: 'firstChild'
  };

  function insertAdjacentHTML(el, where, html) {
    var frag, childNode, condition;

    where = where.toLowerCase();

    if (el.insertAdjacentHTML) {
      el.insertAdjacentHTML(where, html);
    } else {
      frag = el.ownerDocument.createRange().createContextualFragment(html);
      condition = where == 'afterend' || where == 'afterbegin';

      switch (where) {
        case 'beforebegin':
        case 'afterend':
          childNode = el[condition ? 'nextSibling' : 'previousSibling'] || null;
          el.parentNode.insertbefore(frag, childNode);
          break;
        case 'beforeend':
        case 'afterbegin':
          childNode = el[condition ? 'firstChild' : 'lastChild'] || null;
          el.insertbefore(frag, childNode);
          break;
      }
    }

    return el[nodeSiblingMapping[where]];
  }


  /*
        获取元素的文本
        @param (Array|Element) el
    */
  function getText(el) {
    var nodeType = el.nodeType,
      ret = "",
      i = 0,
      node;

    if (nodeType) {
      if (nodeType == 1 || nodeType == 9 || nodeType == 11) {
        if (typeof el.textContent == 'string') {
          return el.textContent;
        } else {
          for (el = el.firstChild; el; el = el.nextSibling) {
            ret += arguments.callee(el);
          }
        }
      } else if (nodeType == 3) { //获取文本节点
        return el.nodeValue;
      }
    } else { //数组
      for (; node = el[i]; i++) {
        ret += arguments.callee(node);
      }
    }

    return ret;
  }

  function camelCase(text) {
    //IE需要更改下前缀  因为IE中例如-ms-box-sizing获取的key是msBoxSizing
    return Q.String.camelCase(text.replace(rmsPrefix, 'ms-'));
  }

  /*
        获取不同供应商的属性名称
    */
  function vendorPropName(style, name) {
    if (name in style) {
      return name;
    };

    var capName = name.charAt(0).toUpperCase() + name.slice(1),
      orgName = name,
      i = cssPrefixes.length;

    while (i--) {
      name = cssPrefixes[i] + capName;

      if (name in style) {
        return name;
      }

    }

    return orgName;
  }

  var core_slice = Array.prototype.slice,
    encodeURICmp = window.encodeURIComponent,
    rselect = /^select-(?=one|multiple)$/i,
    rignor = /^(?!button|submit|reset|file)$/i,
    rcheck = /^(?:radio|checkbox)$/i;

  /*序列化表单*/
  function serializeForm(form) {
    var parts, elements, field, options, opt, j, optVal;

    if (!form || !form.nodeType) {
      return;
    }
    parts = []; //['a=1','b=2']
    elements = Q.toArray(form.elements); //转换为数组

    Q.each(elements, function(_, field) {
      name = field.name;
      type = filed.type;

      if (name && rselect.test(type)) { //选项框
        options = Q.toArray(field.options); //选取所有选项
        j = 0;

        while ((opt = options[j++])) {
          if (opt.selected) { //选中
            optVal = opt.getAttribute('value').specified ?
              opt.value : opt.text;
            //插入到parts中
            parts.push(encodeURICmp(field.name) + '=' + encodeURICmp(optVal || 'selected'));
          }
        }
      } else if (rignor.test(type)) { //过滤
        if (name && rcheck.test(type)) {
          parts.push(encodeURICmp(field.name) + '=' + encodeURICmp(field.value || 'on'));
        }
      }
    });

    return parts.join('&');
  }


  function showHide(el, show) {
    if (!el.style) {
      return;
    }

    var value = Q.cache._data(el, 'olddisplay'),
      display;

    if (show) {
      //无缓存 且diaply为none
      if (!value && el.style.display === 'none') {
        el.style.display = '';
      }

      //被样式表覆盖 获取默认display值
      if (el.style.display === '' && isHidden(el)) {
        value = Q.cache._data(el, 'olddisplay', get_cssDefaultDisplay(el.nodeName))
      }


    } else {
      display = curCSS(el, 'display');

      if (!value && display !== 'none') {
        //缓存
        Q.cache._data(el, 'olddisplay', display);
      }
    }

    if (!show || el.style.display === "none" || el.style.display === "") {
      el.style.display = show ? value || "" : "none";
    }
  }

  function isHidden(el) {
    return Q.Element.css(el, "display") === "none" || !Q.Element.contains(el.ownerDocument, el);
  }

  /*获取元素的默认Display值*/

  function get_cssDefaultDisplay(nodeName) {
    if (elDefaultDisplay[nodeName]) {
      return elDefaultDisplay[nodeName];
    }

    var el = document.createElement(nodeName),
      display, doc = document,
      docBody = doc.body;

    docBody.appendChild(el);
    display = statics.css(el, 'display');
    docBody.removeChild(el);

    if (display === 'none' || display === '') {
      iframe = docBody.appendChild(
        iframe || Q.extend(doc.createElement('iframe'), {
          frameBorder: 0,
          width: 0,
          height: 0
        })
      );

      //IE允许我们重用缓存的iframeDoc
      //FF webkit不允许
      if (!iframeDoc) {
        iframeDoc = iframe.contentWindow.document;
        iframeDoc.write('<!doctype html><html><body>');
        iframeDoc.close();
      }

      el = iframeDoc.body.appendChild(document.createElement(nodeName));
      display = elDefaultDisplay[nodeName] = statics.css(el, 'display');
      iframeDoc.body.removeChild(el);

      docBody.removeChild(iframe);
    }
    return display;
  }

  //创建HTML字符串
  function createHtml(config) {
    var ret = '',
      i, attr, key;

    if (typeof config == 'string') {

      ret = config;

    } else if (Q.isArray(config)) {

      for (i = 0; i < config.length; i++) {
        if (config[i]) {
          ret += arguments.callee(config[i]);
        }
      }

    } else { //Object
      ret += '<' + (config.target || 'div'); //标签

      for (i in config) {
        attr = config[i];

        if (!rignorAttr.test(i)) {
          if (typeof attr == 'object') {
            ret += ' ' + i + '="';
            for (key in attr) {
              ret += key + ':' + attr[key] + ';';
            }
          } else {
            ret += ' ' + i + '="' + attr + '" ';
          }
        }
      }

      if (rsingleLabel.test(config.target)) {
        ret += '/>';
      } else {
        ret += '>';

        if (config.content) {
          ret += config.content;
        }

        if (config.children) {
          ret += arguments.callee(config.children);
        }

        ret += '</' + (config.target || 'div') + '>'
      }

    }

    return ret;
  }

  /*补白 
        @param {bool} valueIsBorderBox
        获取的时候是通过offsetWidth 所以valueIsBorderBox为true
        设置的时候此值是boxSizing判断
    */
  function augmentWidthOrHeight(el, name, extra, valueIsBorderBox) {
    var i = extra === (valueIsBorderBox ? "border" : "content") ?
      4 : name === "width" ?
      1 : 0,
      val = 0;

    for (; i < 4; i += 2) {
      if (extra === "margin") {
        val += Q.Element.css(el, extra + cssExpand[i], true);
      }

      if (valueIsBorderBox) {
        if (extra === "content") {
          val -= parseFloat(curCSS(el, "padding" + cssExpand[i])) || 0;
        }

        if (extra !== "margin") {
          val -= parseFloat(curCSS(el, "border" + cssExpand[i] + "Width")) || 0;
        }
      } else {
        val += parseFloat(curCSS(el, "padding" + cssExpand[i])) || 0;

        if (extra !== "padding") {
          val += parseFloat(curCSS(el, "border" + cssExpand[i] + "Width")) || 0;
        }
      }
    }
    return val;
  }

  function getWidthOrHeight(el, name, extra) {
    var val = name == 'width' ? el.offsetWidth : el.offsetHeight,
      isBorder = Q.support.boxSizing && statics.css(el, 'boxSizing') == 'border-box',
      i;


    //外层display none时
    if (val <= 0 || val == null) {
      val = parseFloat(curCSS(el, name));
    }

    return (isNaN(val) ? 0 : val +
      augmentWidthOrHeight(
        el,
        name,
        extra || (isBorder ? "border" : "content"),
        true
      )
    ) + "px";
  }

  function setPositiveNumber(elem, value, subtract) {
    var matches = rnumsplit.exec(value);
    return matches ?
      Math.max(0, matches[1] - (subtract || 0)) + (matches[2] || "px") :
      value;
  }

  Q.each({
    Height: "height",
    Width: "width"
  }, function(name, type) {
    Q.each({
      padding: "inner" + name,
      content: type,
      "": "outer" + name
    }, function(defaultExtra, funcName) {

      Q.Element[funcName] = function(el, margin, value) {
        var extra = defaultExtra || (margin === true || value === true ? "margin" : "border"),
          doc;

        //如果el为 window  则获取文档的内容 高度/宽度
        if (Q.isWindow(el)) {
          return el.document.documentElement["client" + name];
        }

        if (el.nodeType === 9) {
          doc = el.documentElement;

          //如果获取的为document高度则返回
          //（body、document)*(scrollHeight、offsetHeight)中最大的一个
          return Math.max(
            el.body["scroll" + name], doc["scroll" + name],
            el.body["offset" + name], doc["offset" + name],
            doc["client" + name]
          );
        }

        return value === undefined ?
          statics.css(el, type, value, extra) :
          statics.style(el, type, value, extra);
      }

      Q.Element.prototype[funcName] = function(margin, value) {
        var ret;
        ret = Q.Element[funcName](this.dom, margin, value);

        return value === undefined ? ret : this;
      }
    })
  })

  Q.each(['height', 'width'], function(index, prop) {
    cssHooks[prop] = {
      get: function(el, extra) {
        //如果未隐藏元素 暂时使其可见
        if (el.offsetWidth === 0 && curCSS(el, 'display') === 'none') {

          return statics.swap(el, cssShow, function() {
            return getWidthOrHeight(el, prop, extra);
          });

        } else {
          return getWidthOrHeight(el, prop, extra);
        }
      },
      set: function(el, value, extra) {
        return setPositiveNumber(el, value, extra ?
          augmentWidthOrHeight(
            el,
            prop,
            extra,
            Q.support.boxSizing && Q.Element.css(el, "boxSizing") === "border-box"
          ) : 0
        );
      }
    }
  });

  //对于不支持opacity的浏览器
  if (!Q.support.opacity) {
    cssHooks.opacity = {
      get: function(el) {
        return ropacity.test(el.currentStyle.filter) ?
          0.01 * parseFloat(RegExp.$1) + '' : '1';
      },
      set: function(el, value) {
        el.style.filter = 'alpha(opacity=' + (parseFloat(value) * 100) + ')';
      }
    }
  }


  Q.each(("blur focus focusin focusout load resize scroll unload click dblclick " +
    "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
    "change select submit keydown keypress keyup error contextmenu").split(" "), function(i, type) {

    //将这些事件绑定到 Elment 原型链上  
    Element.prototype[type] = function(data, handler) {
      //参数判断
      if (!Q.isObject(data)) {
        handler = data;
      }

      if (handler != undefined) {
        statics.on(this.dom, type, handler, data);
        return this;
      } else { //如果参数为空则为触发该事件
        return Q.events.trigger(this.dom, type);
      }
    }

  });


  if (!Q.support.isGetHrefNormal) { //IE67将链接相对路径转换为绝对路径
    Q.each(['src', 'href'], function(index, name) {
      attrHooks[name] = {
        get: function(el) {
          return el.getAttribute(name, 2); //第2个参数表示准确的返回设置的值
        }
      };
    });
  }

  if (!Q.support.style) {
    attrHooks.style = {
      get: function(el) {
        return el.style.cssText.toLowerCase() || undefined;
      },
      set: function(el, val) {
        el.style.cssText = val + '';
      }
    }
  }

  Q.each(['select-one', 'select-multiple'], function(index, type) {
    valHooks[type] = {
      get: function(el) {
        var i, max, option, values = [],
          one = type == 'select-one',
          selectIndex = el.selectedIndex,
          settings = el.settings,
          value;

        i = one ? selectIndex : 0;
        max = one ? selectIndex + 1 : settings.length;

        for (; i < max; i++) {
          option = settingss[i];

          if (option.selected && !el.disabled) { //获取选中项的value  或text

            if (option.hasAttribute) { //非IE67
              value = option.hasAttribute('value') ? option.value : option.text;
            } else {
              valNode = option.getAttributeNode('value');
              value = (valNode && valNode.specified) ? option.value : option.text;
            }

            if (one) {
              return value;
            }

            values.push(value);
          }
        }

        return values;
      },
      set: function(el, val) {

      }
    }
  });

  var _flyEl;

  Q.mix({
    fly: function(el) {
      if (!_flyEl) {
        _flyEl = new Q.Element(el);
      }
      _flyEl.dom = el;

      return _flyEl;
    },
    vendorPropName: vendorPropName
  })

}(window, Q);


! function(Q, window, undefined) {
  var rtrim = /^[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000]+|[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000]+$/g,

    rescapeRegExp = /([-.*+?\^${}()|\[\]\/\\])/g,

    empty = '',

    toString = String,

    rdashAlpha = /-([\da-z])/gi,

    fcamelCase = function(all, letter) {
      return (letter + "").toUpperCase();
    };

  Q.String = {
    empty: empty,

    leftPad: function(string, size, character) {
      var result = String(string);
      character = character || " ";
      while (result.length < size) {
        result = character + result;
      }
      return result;
    },

    /**
     * 返回一个格式化函数
     * @param  {String}     format      字符串格式
     * @param  {Boolean}    byKeys      是否按名键值方式替换
     */
    format: function(format, byKeys) {
      return byKeys !== true ?
        //按参数索引的方式格式化
        function() {
          var _format = format,
            i, len;
          //按参数索引的方式格式化
          for (i = 0, len = arguments.length; i < len; i++) {
            _format = _format.replace(new RegExp('\\{' + i + '\\}', 'g'), toString(arguments[i]));
          }
          return _format;
        } :
        //按第一个参数的名键值方式替换
        function(args) {
          var _format = format,
            i;

          if (args == null) {
            return Q.String.empty;
          }
          
          for (i in args) {
            _format = _format.replace(new RegExp('\\{' + i + '\\}', 'g'), toString(args[i]));
          }
          return _format;
        };
    },

    //转义正则
    escapeRegExp: function(text) {
      return text.replace(rescapeRegExp, '\\$1');
    },

    escape: function(text) {
      return text.replace(/('|\\)/g, "\\$1");
    },

    isEmpty: function(text) {
      return !text.replace(/\s*/, empty).length > 0;
    },

    unenscapeHtml: function(source) {
      return String(source)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#92;/g, '\\')
        .replace(/&quot;/g, '\"')
        .replace(/&#39;/g, '\'');
    },

    escapeHtml: function(source) {
      return String(source)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\\/g, '&#92;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /*去掉两端空白*/
    trim: function(text) {
      return toString(text).replace(rtrim, empty);
    },

    /*驼峰写法*/
    camelCase: function(text) {
      return text.replace(rdashAlpha, fcamelCase);
    },

    /*首字母大写*/
    cap: function(text) {
      if (!text) {
        return empty;
      }

      text = toString(text).replace(rtrim, empty);
      return text.slice(0, 1).toUpperCase() + text.substr(1);
    }
  }

}(Q, window);

+ function(Q) {

  var rdateFormat = new RegExp('([YyMdHhmsaZE]+)', 'g'),

    rhourFormat = new RegExp('([hms]+)', 'g'),

    stripEscapeRe = /(\\.)/g,

    //解析函数缓存
    parseFunctionCache = {},

    //转换字符串函数缓存
    formatFunctionCache = {},

    daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],

    rmark = /\{\{([^\}\s]+)\}\}/g,

    IOS8601Souce = '{{year}}-{{month}}-{{date}}T{{hours}}:{{minutes}}:{{seconds}}',

    IOS8601 = 'YYYY-MM-ddThh:mm:ss',

    dateTypes = {

      year: {
        format: ['YYYY'],
        name: 'FullYear',
        defaultFormat: '1970',
        formatCode: 'String(dateTime.getFullYear())',
        parseCode: 'setFullYear'
      },

      shortYear: {
        format: ['yy'],
        name: 'ShortYear',
        defaultFormat: '70',
        formatCode: 'String(dateTime.getFullYear()).substr(2,2)',
        parseCode: 'setFullYear'
      },

      month: {
        format: ['MM'],
        name: 'Month',
        defaultFormat: '01',
        formatCode: 'this.leftPad(dateTime.getMonth()+1,2,"0")',
        parseCode: 'setMonth'
      },

      shortMonth: {
        format: ['M'],
        name: 'Month',
        defaultFormat: '01',
        formatCode: 'String(dateTime.getMonth()+1)',
        parseCode: 'setMonth'
      },

      date: {
        format: ['dd'],
        name: 'Date',
        defaultFormat: '01',
        formatCode: 'this.leftPad(dateTime.getDate(),2,"0")',
        parseCode: 'setDate'
      },

      shortDate: {
        format: ['d'],
        name: 'ShortDate',
        defaultFormat: '01',
        formatCode: 'String(dateTime.getDate())',
        parseCode: 'setDate'
      },

      hours: {
        format: ['hh'],
        name: 'Hours',
        defaultFormat: '00',
        formatCode: 'this.leftPad(dateTime.getHours(),2,"0")',
        parseCode: 'setHours'
      },

      shortHours: {
        format: ['h'],
        name: 'ShortHours',
        defaultFormat: '00',
        formatCode: 'String(dateTime.getHours())',
        parseCode: 'setHours'
      },

      minutes: {
        format: ['mm'],
        name: 'Minutes',
        defaultFormat: '00',
        formatCode: 'this.leftPad(dateTime.getMinutes(),2,"0")',
        parseCode: 'setMinutes'
      },

      shortMinutes: {
        format: ['m'],
        name: 'ShortMinutes',
        defaultFormat: '00',
        formatCode: 'String(dateTime.getMinutes())',
        parseCode: 'setMinutes'
      },

      seconds: {
        format: ['ss'],
        name: 'Seconds',
        defaultFormat: '00',
        formatCode: 'this.leftPad(dateTime.getSeconds(),2,"0")',
        parseCode: 'setSeconds'
      },

      shortSeconds: {
        format: ['s'],
        name: 'ShortSeconds',
        defaultFormat: '00',
        formatCode: 'String(dateTime.getSeconds())',
        parseCode: 'setSeconds'
      }

    },

    formatTypes = {},

    dateUtile;

  Q.each(dateTypes, function(type, _) {

    Q.each(this.format, function() {
      formatTypes[this] = new String(type);
      formatTypes[this].name = _.name;
      formatTypes[this].defaultFormat = _.defaultFormat;
      formatTypes[this].formatCode = _.formatCode;
      formatTypes[this].parseCode = _.parseCode;
    });

  });


  function padNumber(num, len) {
    var ret = emptyString;

    if (num < 0) {
      ret = '-'
      num = -num;
    }

    num = ret + num;

    while (ret.length < len) {
      ret = '0' + ret;
    }

    return ret;
  }

  Q.Date = dateUtile = {

    MILLI: "ms",
    SECOND: "s",
    MINUTE: "mi",
    HOUR: "h",
    DAY: "d",
    MONTH: "mo",
    YEAR: "y",

    now: Date.now || function() {
      return new Date().valueOf();
    },

    getParseFunction: function(format) {
      var cacheFunc, matchExpSource, dateTypeArray;

      format = Q.String.escapeRegExp(format || IOS8601);

      //从缓存中获取解析信息
      cacheFunc = parseFunctionCache[format];

      if (!cacheFunc) { //缓存中不存在

        //格式中包含的日期类型数组
        dateTypeArray = [];

        //获取format中包含的日期类型
        matchExpSource = format.replace(rdateFormat, function(source, $1) {

          dateTypeArray.push(formatTypes[$1]);

          return '(\\S{1,' + $1.length + '})';
        });

        cacheFunc = function(input, format) {
          var match, dateTimeInfo, i, len, ret, value;

          //捕获输入的字符串中的日期数值
          if (!(match = new RegExp('^' + matchExpSource + '$').exec(input))) {
            return;
          }

          dateTimeInfo = {};

          //与类型对应
          for (i = 0, len = dateTypeArray.length; i < len; i++) {
            dateTimeInfo[dateTypeArray[i]] = parseInt(match[i + 1]);
          }

          ret = new Date();

          Q.each(['year', 'month', 'date', 'hours', 'minutes', 'seconds'], function(_, dateType) {
            value = dateTimeInfo[dateType] || parseInt(dateTypes[dateType].defaultFormat);

            if (dateType == 'month') {
              value -= 1;
            }

            ret[dateTypes[dateType].parseCode](value);
          });

          return ret;
        }

        parseFunctionCache[format] = cacheFunc;

      }

      return cacheFunc;
    },
    /*
            将字符串转换为Date
            YYYY-MM-dd
        */
    parse: function(input, format) {

      var parseFunc;

      if (parseFunc = dateUtile.getParseFunction(format || IOS8601)) {
        return parseFunc(input, format);
      }
    },

    format: function(dateTime, format) { //author: meizz 
      return dateTime != null ? dateUtile.getFormatFunction(format).call(Q.String, dateTime) : null;
    },

    getFormatFunction: function(format) {
      var formatFunc, i = 0;

      format = Q.String.escape(format || IOS8601);

      if (!(formatFunc = formatFunctionCache[format])) {

        format = format.replace(rdateFormat, function(source, $1) {

          return '\'+' + formatTypes[$1].formatCode + '+\'';
        });

        formatFunc = formatFunctionCache[format] = new Function('dateTime', 'return \'' + format + '\';');
      }

      return formatFunc;
    },

    /*获取两个时间点的间隔*/
    getElapsed: function(left, right) {
      return Math.abs(left - (right || new Date()))
    },

    /*清除日期中的时间信息*/
    clearTime: function(dateTime, clone) {
      if (clone) {
        return arguments.callee(dateUtile.clone(dateTime));
      }
      var orgDate = dateTime.getDate();

      dateTime.setHours(0);
      dateTime.setMinutes(0);
      dateTime.setSeconds(0);
      dateTime.setMilliseconds(0);

      return dateTime;
    },

    clone: function(dateTime) {
      return new Date(dateTime.valueOf());
    },

    getDaysInMonth: function(dateTime) { // return a closure for efficiency
      var m = dateTime.getMonth();

      return m == 1 && Q.Date.isLeapYear(dateTime) ? 29 : daysInMonth[m];
    },

    /*是否是闰年*/
    isLeapYear: function(dateTime) {
      var year = dateTime.getFullYear();
      return !!((year & 3) == 0 && (year % 100 || (year % 400 == 0 && year)));
    },

    getFirstDateOfMonth: function(dateTime) {
      return new Date(dateTime.getFullYear(), dateTime.getMonth(), 1);
    },

    getLastDateOfMonth: function(dateTime) {
      return new Date(dateTime.getFullYear(), dateTime.getMonth(), dateUtile.getDaysInMonth(dateTime));
    },

    add: function(datetime, interval, value) {
      var d = dateUtile.clone(datetime);
      if (!interval || value === 0) return d;

      switch (interval.toLowerCase()) {
        case dateUtile.MILLI:
          d.setMilliseconds(datetime.getMilliseconds() + value);
          break;
        case dateUtile.SECOND:
          d.setSeconds(datetime.getSeconds() + value);
          break;
        case dateUtile.MINUTE:
          d.setMinutes(datetime.getMinutes() + value);
          break;
        case dateUtile.HOUR:
          d.setHours(datetime.getHours() + value);
          break;
        case dateUtile.DAY:
          d.setDate(datetime.getDate() + value);
          break;
        case dateUtile.MONTH:
          var day = datetime.getDate();
          if (day > 28) {
            day = Math.min(day, dateUtile.getLastDateOfMonth(dateUtile.add(dateUtile.getFirstDateOfMonth(datetime), 'mo', value)).getDate());
          }
          d.setDate(day);
          d.setMonth(datetime.getMonth() + value);
          break;
        case dateUtile.YEAR:
          d.setFullYear(datetime.getFullYear() + value);
          break;
      }
      return d;
    },

    /*检查格式是否包含时间信息*/
    formatContainsHourInfo: function(format) {
      rhourFormat.lastIndex = 0;
      return rhourFormat.test(format.replace(stripEscapeRe, ''));
    }


  };

}(Q)

! function(Q, window) {

  var encodeURICmp = window.encodeURIComponent,

    decodeURICmp = window.decodeURIComponent,

    emptyString = '',

    rbracket = /\[\]$/,

    rqueryPair = /([^=&]+)=([^&]+)?/g,

    rpropNames = /(?:^([^\s\[\]]+))|(?:\[([^\]\s]+)?\])/g,

    r20 = /%20/g,

    util;

  Q.Object = util = {
    /*获取对象的键值*/
    keys: function(obj) {
      var ret = [],
        key, i;

      if (!obj) {
        return ret;
      }

      for (i in obj) {
        if (obj.hasOwnProperty(i)) {
          ret.push(i);
        }
      }

      return ret;
    },

    /*对比两个对象是否相等*/
    equals: function(left, right) {
      var ret = false

      if (left === right) { //绝对相等
        ret = true;
      } else if (left && right) { //对比两个对象的名键值
        ret = equalsObject(left, right) && equalsObject(right, left);

      } else if (!left && !right) { //null undefined
        ret = left === right;
      }

      return ret;
    },
    /*
            将QueryString转换为对象
            1.'a[]=1&&a[]=2&&name=123'=>{a:[1,2],name:123}
        */
    parseQueryString: function(queryString, traditional) {
      var ret = {},
        matched, key, value,
        definedPropName, //是否定义了主属性名
        keys, prop, curProp,
        propNames, subPropName, i, len;

      if (!queryString || Q.String.isEmpty(queryString)) {
        return ret;
      }

      while (matched = rqueryPair.exec(queryString)) {

        key = decodeURICmp(matched[1]);
        value = matched[2] !== undefined ? decodeURICmp(matched[2]) : emptyString;

        if (traditional) { //一般处理（非递归）

          //属性已存在 转换为数据
          if (ret.hasOwnProperty(key)) {

            if (!Q.isArray(ret[key])) {
              ret[key] = [ret[key]];
            }

            ret[key].push(value);

          } else {

            ret[key] = value;

          }
        } else {
          keys = [];

          while (propNames = rpropNames.exec(key)) {
            if (propNames[1]) {
              definedPropName = propNames[1];
            }

            keys.push(propNames[1] || propNames[2] || emptyString);
          }

          //如果存在[ss][ddsf]这种字符串 则没有定义属性名称 抛出错误
          //正确的应该为sss[ss][ddsf] sss为属性名称
          if (!definedPropName) {
            throw new Error('[Q.Object.fromQueryString] 字符串解析错误, 这个名键值对中没有给出名称 "' + source + '"');
          }

          curProp = ret;

          for (i = 0, len = keys.length; i < len; i++) {
            prop = keys[i] || '';

            if (i == len - 1) {

              if (Q.isArray(curProp[prop]) || prop == emptyString) {
                curProp.push(value);
              } else {
                curProp[prop] = value;
              }

            } else {

              if (curProp[prop] === undefined || typeof curProp[prop] === 'string') {
                subPropName = keys[i + 1];

                curProp[prop] = Q.isNumber(subPropName) || subPropName == emptyString ? [] : {}
              }
              curProp = curProp[prop];

            }
          }

        }

      }

      return ret;
    },
    /*
            1.[{name:key,value:value},{name:key,value:value}...]

            2.{
                username:'1233',
                information:[{
                    
                }]
            }

        */
    toQueryString: function(obj, traditional) {
      var ret = [],

        add = function(key, value) {
          if (value !== undefined) {
            value = value === null ? emptyString : value;
            ret.push(encodeURICmp(key) + '=' + encodeURICmp(value))
          }
        },

        prefix, i, pair;

      if (Q.isArray(obj)) { //[{name:key,value:value},{name:key,value:value}...]

        i = 0;
        while (pair = obj[i++]) {
          add(pair.name, pair.value);
        }

      } else {
        for (prefix in obj) {
          Q.Object.buildQueryObjects(prefix, obj[prefix], traditional, add);
        }
      }

      return ret.join('&').replace(r20, '+');
    },

    buildQueryObjects: function(prefix, obj, traditional, add) {
      var self = arguments.callee,
        objType = Q.type(obj),
        i, item;

      if (objType == 'array') { //数组
        i = 0;

        while (item = obj[i++]) {
          if (traditional || rbracket.test(prefix)) {
            add(prefix, item);
          } else {
            self(prefix + '[' + (typeof item === 'object' ? i - 1 : emptyString) + ']', item, traditional, add);
          }
        }

      } else if (!traditional && objType == 'object') {

        for (i in obj) {
          self(prefix + '[' + i + ']', obj[i], traditional, add);
        }

      } else {
        add(prefix, obj);
      }
    }
  };


  function equalsObject(left, right) {
    var i;

    for (i in left) {
      if (left.hasOwnProperty(i) && left[i] !== right[i]) {
        return false;
      }
    }

    return true;
  }

}(Q, window)

! function(Q, window) {
  Q.Number = {
    /*约束范围*/
    constrain: function(number, min, max) {
      var x = parseFloat(number);

      return (x < min) ? min : ((x > max) ? max : x);
    },

    tryParse: function(value, defaultValue) {
      value = Number(value);
      return isNaN(value) ? defaultValue : value;
    },

    format: function(value, format) {
      return value;
    }
  }
}(Q, window);

- function(factory) {

  /*AMD加载方式*/
  if (typeof define == 'function' && define.amd) {
    define(factory);
  }

}(function() {
  return Q;
});