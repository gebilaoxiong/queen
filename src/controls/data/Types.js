define(['data/SortTypes'], function(sortTypes) {
  var Types = {
    auto: {
      convert: function(v) {
        return v;
      },
      sortType: sortTypes.none,
      type: 'auto'
    },
    'string': {
      convert: function(v) {
        return v != undefined ? String(v) : '';
      },
      sortType: sortTypes.string,
      type: 'string'
    },
    'int': {
      convert: function(v) {
        return v != undefined && v != '' ?
          parseInt(String(v), 10) : this.useNull ? null : 0;
      },
      sortType: sortTypes.asInt,
      type: 'int'
    },
    'float': {
      convert: function(v) {
        return v != undefined && v != '' ?
          parseFloat(String(v), 10) : this.useNull ? null : 0;
      },
      sortType: sortTypes.asFloat,
      type: 'float'
    },
    'bool': {
      convert: function(v) {
        return v === true || v === 'true' || v == 1;
      },
      sortType: sortTypes.asInt,
      type: 'bool'
    },
    'date': {
      convert: function(v) {
        var df = this.dateFormat,
          parsed;

        if (!v) {
          return null;
        }

        if (Q.isDate(v)) {
          return v;
        }

        if (df) {
          if (df == 'timestamp') {
            return new Date(v * 1000);
          }
          if (df == "time") {
            return new Date(parseInt(v, 10));
          }

          return Q.Date.parse(v, df);
        }

        return Q.Date.parse(v);
      },
      sortType: sortTypes.asDate,
      type: 'date'
    }
  };

  return Types;
});