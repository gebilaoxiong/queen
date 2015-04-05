define([
  'data/store/Store',
  'data/reader/Json'
], function(Store, JsonReader) {

  var JsonStore = Q.Class.define(Store, {

    init: function(config) {

      config = config || {};

      //fields声明在类中
      if (!config.fields && !config.recordType && this.fields) {
        config.fields = this.fields;
        this.fields = null;
      }

      this.callParent('init', [
        Q.extend(config, {
          reader: new JsonReader(config)
        })
      ]);

    }
  });

  return JsonStore;
});