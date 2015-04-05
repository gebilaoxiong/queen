define(function() {

  /*
		var filter=new Filter({
			property:'name',
			value:1,
			operator:'=='
		})
		
	*/

  var uid = 0,
    prefix = 'filter';

  var Filter = Q.Class.define({

    id: null,

    /**/
    anyMatch: false,

    /*准确匹配 即添加$在正则末尾*/
    exactMatch: false,

    /*是否区分大小写*/
    caseSensitive: false,

    disabled: false,

    /*
			<
     	 	<=
    	 	=
    	 	>=
     	 	>
     	 	!=
		*/
    operator: null,

    /*
			value {string/RegExp} 匹配的正则
		*/

    /*静态方法*/
    statics: {},

    operatorFns: {
      "<": function(_, candidate) {
        return coerce(this.getRoot(candidate)[this.property], this.value) < this.value;
      },
      "<=": function(_, candidate) {
        return coerce(this.getRoot(candidate)[this.property], this.value) <= this.value;
      },
      "=": function(_, candidate) {
        return coerce(this.getRoot(candidate)[this.property], this.value) == this.value;
      },
      ">=": function(_, candidate) {
        return coerce(this.getRoot(candidate)[this.property], this.value) >= this.value;
      },
      ">": function(_, candidate) {
        return coerce(this.getRoot(candidate)[this.property], this.value) > this.value;
      },
      "!=": function(_, candidate) {
        return coerce(this.getRoot(candidate)[this.property], this.value) != this.value;
      }
    },

    init: function(config) {
      var me = this;

      me.initCfg = config;
      Q.extend(this, config);

      if (me.id == undefined) {
        me.id = prefix + (uid++);
      }

      me.Filter = me.Filter || me.filterFn;

      if (me.filter === undefined) {
        me.setValue(config.value);
      }
    },

    setValue: function(value) {
      var me = this;

      me.value = value;
      if (me.property === undefined || me.value == undefined) {

      } else {
        me.filter = me.createFilterFn();
      }

      me.filterFn = me.filter;
    },

    setFilterFn: function(filterFn) {
      this.filterFn = this.filter = filterFn;
    },

    /*
			根据配置返回一个过滤函数
			如果设置了操作符 则优先返回operatorFns；
			如果没有则先用Value依据配置（anyMatch|exactMatch|caseSensitive）生成一个正则
			然后使用闭包返回生成的过滤函数
		*/
    createFilterFn: function() {
      var me = this,
        matcher,
        property;

      if (me.operator) {
        return me.operatorFns[me.operator];
      } else {

        matcher = me.createValueMatcher(me.value, me.anyMatch, me.caseSensitive, me.exactMatch);
        property = me.property;

        return function(_, item) {
          var value = me.getRoot(item)[property];
          return matcher === null ? value === null : matcher.test(value);
        }
      }
    },

    getRoot: function(item) {
      var root = this.root;
      return root === undefined ? item : item[root];
    },
    /*根据value和配置返回一个过滤函数*/
    createValueMatcher: function(value, anyMatch, caseSensitive, exactMatch) {
      var me = this,
        escapeRegExp = Q.String.escapeRegExp;

      if (value === null) {
        return value;
      }

      if (!value.exec) { //非正则对象
        value = String(value);

        if (anyMatch === true) {
          value = escapeRegExp(value);
        } else {
          value = '^' + escapeRegExp(value);
          if (exactMatch === true) {
            value += '$';
          }
        }
        value = new RegExp(value, caseSensitive ? '' : 'i');
      }
      return value;
    },
    toJson: function() {
      var me = this,
        ret = Q.extend({}, me.initCfg);

      ret.value = me.value;
      return ret;
    }
  });

  Filter.prototype.operatorFns['=='] = Filter.prototype.operatorFns['='];

  function coerce(from, to) {
    var fromType = Q.type(from),
      toType = Q.type(to),
      isString = typeof from === 'string';

    if (fromType !== toType) {
      switch (toType) {
        case 'string':
          return String(from);
        case 'number':
          return Number(from);
        case 'boolean':
          return isString && (!from || from === 'false') ? false : Boolean(from);
        case 'null':
          return isString && (!from || from === 'null') ? null : from;
        case 'undefined':
          return isString && (!from || from === 'undefined') ? undefined : from;
        case 'date':
          return isString && isNaN(from) ? Q.Date.parse(from) : Date(Number(from));
      }
    }

    return from;
  }

  return Filter;
});