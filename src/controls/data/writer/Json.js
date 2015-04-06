define(['data/Writer/Writer'], function(writer) {

  var Json = Q.Class.define(writer, {

    encode: true,

    /*
			false发送 删除数据的id到服务器，
			true 发送一个对象如{id: 1}
		*/
    encodeDelete: false,

    render: function(params, baseParams, data) {
      var jdata;

      if (this.encode === true) {
        Q.extend(params, baseParams);
        params[this.meta.root] = $H(data).toQueryString();
      } else {
        jdata = Q.extend({}, baseParams);
        jdata[this.meta.root] = data;
        params.jsonData = jdata;
      }
    },

    createRecord: function(rec) {
      return this.toHash(rec);
    },

    updateRecord: function(rec) {
      return this.toHash(rec);
    },

    destroyRecord: function(rec) {
      var data;

      if (this.encodeDelete) {
        data = {};
        data[this.meta.idProperty] = rec.id;
        return data;
      } else {
        return rec.id;
      }
    }
  });

  return Json;
});