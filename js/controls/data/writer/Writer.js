define([
  'util/Observable',
  'data/Record'
], function(observable, dataRecord) {

  var Writer = Q.Class.define(observable, {

    /*
			默认为false。
			设置为 true使DataWriter返回修改记录的所有字段而非仅仅是改变的字段。 
			false使Writer只修改一条记录中改变的字段。
		*/
    writeAllFields: false,

    /*
			默认false。
			设置为 true来使DataWriter 始终用列表的方式写HTTP参数，
			即便对单一记录操作。
		*/
    listful: false,

    init: function(settings) {
      Q.extend(this, settings);
      this.callParent(arguments);
    },

    /*
			调用witer中相应的xxxRecord方法对record做相应处理
			将返回值存放在数组data中
			接着调用render
				在render中如果encode为true 将数组data进行URL编码
					存放在params[this.meta.root]中
				如果为false则放在params的(jsonData|xmlData)[this.meta.root]中

			@params {Record/Record[]} rs  
		*/
    apply: function(params, baseParams, action, rs) {
      var data = [],
        renderer = action + 'Record';

      if (Q.isArray(rs)) {
        Q.each(rs, function(_, rec) {
          data.push(this[renderer](rec));
        }, this);
      } else {
        data.push(this[renderer](rs));
      }

      this.render(params, baseParams, data);
    },

    render: Q.noop,

    updateRecord: Q.noop,

    createRecord: Q.noop,

    destroyRecord: Q.noop,

    /**
     * 将Record转换为hash对象
     * 决定字段是部分提交还是全部提交
     */
    toHash: function(rec, config) {
      var map = {},
        data = {},
        raw, m;

      rec.fields.each(function() {
        map[this.name ? this.name : this.mapping] = this;
      });

      //覆盖所有字段 且 不为新增record
      raw = this.writeAllFields === false && rec.phantom === false ?
        rec.getChange() : rec.data;

      Q.each(raw, function(prop, value) {
        if ((m = map[prop])) {
          data[m.name ? m.name : m.mapping] = value;
        }
      });

      //如果为新增
      if (rec.phantom) {
        if (Q.isUndefined(rec.data[this.meta.idProperty])) {
          delete data[this.meta.idProperty];
        }
      } else {
        data[this.meta.idProperty] = rec.id;
      }

      return data;
    },

    toArray: function(data) {
      var fields = [];

      Q.each(data, function(name, value) {
        fields.push({
          name: name,
          value: value
        });
      });

      return fields;
    }


  })
});