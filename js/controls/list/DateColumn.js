/**
 * 
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-04-09 13:27:29
 * @description 
 */
define(['list/Column', 'util/Template'], function(Column, Template) {
	var DateColumn;

	DateColumn = Q.Class.define(Column, {

		/*序列化格式*/
		format: 'YYYY/MM/dd',

		init: function(config) {
			config.tpl = config.tpl || new Template('<%=Q.Date.format(' + config.dataIndex + ',' + (config.format || this.format) + ')%>');

			this.callParent(arguments);
		}
	});

	return DateColumn;
});
