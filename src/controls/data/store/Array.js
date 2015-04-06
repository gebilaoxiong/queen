define([
  'data/store/Store',
  'data/reader/Array'
], function(Store, ArrayReader) {

  var ArrayStore = Q.Class.define(Store, {

    type: 'ArrayStore',

    init: function(settings) {
      settings = Q.extend(settings || {}, {
        reader: new ArrayReader(settings)
      });

      this.callParent(arguments);
    },

    loadData: function(data, append) {
      var r, i, item;

      if (this.expandData === true) {
        r = [];
        i = 0;

        while (item = data[i++]) {
          r.push([item]);
        }
        data = r;
      }

      this.callParent(arguments)
    }
  });

  return ArrayStore;
});