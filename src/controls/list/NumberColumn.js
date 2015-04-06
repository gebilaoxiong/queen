/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-04-09 01:58:20
 * @description
 */
define(['list/Column', 'util/Template'], function(Column, Template) {
  var NumberColumn;

  NumberColumn = Q.Class.define(Column, {

    /*序列化格式*/
    format: '0,000.00',

    init: function(config) {
      config.tpl = config.tpl || new Template('<%=Q.Number.format(' + config.dataIndex + ',' + (config.format || this.format) + ')%>');

      this.callParent(arguments);
    }
  });

  return NumberColumn;
});