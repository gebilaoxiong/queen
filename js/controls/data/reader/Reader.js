define([
  'data/Record',
  'data/RecordManager',
  'controls/Exception'
], function(record, recordManager, exception) {

  var Reader = Q.Class.define(Q.Abstract, {

    type: 'DataReader',

    getTotal: Q.noop,

    getRoot: Q.noop,

    getMessage: Q.noop,

    getSuccess: Q.noop,

    getId: Q.noop,

    buildExtractors: Q.noop,

    extractValues: Q.noop,

    init: function(meta, recordType) {
      var type;

      this.meta = meta;

      type = Q.type(recordType);

      if (type == 'array') { //fields
        recordType = record.create(recordType);
      } else if (type == 'string') { //record名称
        recordType = recordManager.get(recordType);
      }

      this.recordType = recordType;

      if (this.recordType) {
        //编译提取器
        this.buildExtractors();
      }
    },

    isData: function(data) {
      return data && Q.isObject(data) && !Q.isEmptyObject(data);
    },

    /*
		被用作在成功插入数据库之后将一条数据变成“非模拟的”(新增)。 
		连同来自服务端的新数据一起，设置记录的主键。 
		你必须/至少返回数据库主键，使用你的Reader中 配置的idProperty属性。 
		来自服务端的数据将会与本地的记录进行合并。 
		另外， 你返回的记录数据必须与来自服务器的数据顺序一致。 
		最好进行一次commit操作，消除“脏字段”的标记。 Store的"update"事件将会被禁止。 
		参数:
		 
		record : Record/Record[] 
		需要变成实现的模拟数据。 
		data : Object/Object[] 
		需要应用的新record数据。 必须包含来自数据库的主键，它是在idProperty字段中定义的。 
		返回值: void 

		*/
    realize: function(record, data) {
      var index, len;
      if (Q.isArray(record)) { //数组
        for (index = record.length - 1; index >= 0; index--) {
          if (Q.isArray(data)) {
            this.realize(record.splice(index, 1).shift(), data.splice(index, 1).shift());
          } else {
            this.realize(record.splice(index, 1).shift(), data);
          }
        }
      } else {

        if (Q.isArray(data) && data.length == 1) {
          data = data.shift();
        }

        if (!this.isData(data)) {
          throw new Reader.Exception('realize', record);
        }

        record.phantom = false;
        record._phid = record.id;
        record.id = this.getId(data);
        record.data = data;

        record.commit();
        record.store.reMap(record);
      }
    },

    update: function(record, data) {
      var index, len;
      if (Q.isArray(record)) {
        for (index = 0, len = record.length; index < len; index++) {
          if (Q.isArray(data)) {
            this.update(record.splice(index, 1).shift(), data.splice(index, 1).shift());
          } else {
            this.update(record.splice(index, 1).shift(), data);
          }
        }
      } else {
        if (Q.isArray(data) && data.length == 1) {
          data = data.shift();
        }
        if (this.isData(data)) {
          record.data = Q.extend(record.data, data);
        }
        record.commit();
      }
    },
    /*
			提取数据 默认值
		*/
    extractData: function(root, returnRecords) {
      var me = this,
        records = [],
        fields, fieldsItems, fieldsLength,
        RecordType, record, data;

      if (!root.length && Q.isObject(root)) {
        root = [root];
      }

      RecordType = me.recordType;
      fields = me.recordType.prototype.fields,
        fieldsItems = fields.data,
        fieldsLength = fieldsItems.length;

      if (returnRecords === true) {
        Q.each(root, function(index, item) {
          record = new RecordType(me.extractValues(item, fieldsItems, fieldsLength), me.getId(item));
          records.push(record);
        }, me);
      } else {
        Q.each(root, function(index, item) {
          data = me.extractValues(item, fieldsItems, fieldsLength);
          data[me.meta.idProperty] = me.getId(item);
          records.push(data);
        });
      }

      return records;
    },

    onMetaChange: function(meta) {
      var recordType;

      delete this.ef;
      this.meta = meta;
      recordType = meta.recordType;

      if (Q.isString(recordType)) {
        this.recordType = recordManager.get(recordType);
      } else if (meta.fields) {
        this.recordType = record.create(meta.fields);
      }

      this.buildExtractors();
    }
  });

  Reader.Exception = Q.Class.define(exception, {
    init: function(message, arg) {
      this.arg = arg;
      this.callParent(arguments);
    },

    name: 'Q.data.Reader',

    lang: {
      'update': "#update received invalid data from server.  Please see docs for DataReader#update and review your DataReader configuration.",
      'realize': "#realize was called with invalid remote-data.  Please see the docs for DataReader#realize and review your DataReader configuration.",
      'invalid-response': "#readResponse received an invalid response from the server."
    }
  });

  return Reader;
});