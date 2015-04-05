/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-04-09 13:29:27
 * @description
 */
define(['list/Column', 'util/Template'], function(Column, Template) {
	var BooleanColumn;

	BooleanColumn = Q.Class.define(Column, {

		trueText: '是',

		falseText: '否',

		undefinedText: '&#160;',

		init: function(config) {
			var trueText, falseText, undefinedText;

			config.tpl = config.tpl || new Template('<%=this.format(' + config.dataIndex + ')%>');

			trueText = this.trueText;
			falseText = this.falseText;
			undefinedText = this.undefinedText;

			config.tpl.format = function(value) {
				if (value === undefined) {
					return undefinedText;
				}
				if (!value || value === 'false') {
					return falseText;
				}
				return trueText;
			};

			this.callParent(arguments);
		}
	});

	return BooleanColumn;
});