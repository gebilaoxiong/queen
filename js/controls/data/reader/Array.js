define(['data/reader/Json'], function(jsonReader) {

  var ArrayReader = Q.Class.define(jsonReader, {

    type: 'ArrayReader',

    readRecords: function(o) {
      var me = this,
        meta = me.meta,
        recordType = me.recordType,
        fields = recordType.prototype.fields,
        records = [],
        success = true,
        sid, root, i, len, item, values,
        id, j, fieldLen, field, mapping, value, record,
        totalRecords;

      //sid
      sid = meta ? Q.Number.tryParse(meta.idIndex, meta.id) : null;

      me.arrayData = o;

      root = me.getRoot(o);

      for (i = 0, len = root.length; i < len; i++) {
        item = root[i]
        values = {}; //从数组中提取的值

        id = (sid || sid === 0) && item[sid] !== undefined && item[sid] !== "" ?
          item[sid] : null;

        for (j = 0, fieldLen = fields.data.length; j < fieldLen; j++) {
          field = fields.data[j];
          mapping = field.mapping != undefined ? field.mapping : j;

          value = item[mapping] !== undefined ? item[mapping] : field.defaultValue;
          value = field.convert(value, item);
          values[field.name] = value;
        }

        record = new recordType(values, id);
        record.json = item;
        records.push(record);
      }

      totalRecords = records.length;

      if (meta.totalProperty) {
        value = parseInt(me.getTotal(o), 10);
        if (!isNaN(value)) {
          totalRecords = value;
        }
      }

      if (meta.successProperty) {
        value = me.getSuccess(o);
        if (value === false || value === 'false') {
          success = false;
        }
      }

      return {
        success: success,
        records: records,
        totalRecords: totalRecords
      };
    }
  });

  return ArrayReader;
});