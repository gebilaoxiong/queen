/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-04-09 01:44:49
 * @description
 */
define(['util/Template'], function(Template) {
	var Column;

	Column = Q.Class.define(Q.Abstract, {

		isColumn: true,

		/*文本方向*/
		align: 'left',

		/*列标题*/
		header: '',

		/*列宽度*/
		width: null,

		/*列className*/
		cls: '',

		/*
		
		dataIndex 必须。 Store的 Record 定义中定义的字段名，用来渲染列值。 

		 */

		init: function(config) {
			if (!config.tpl) { //模板
				config.tpl = new Template('<%=' + config.dataIndex + '%>')
			} else if (Q.isString(config.tpl)) { //模板字符串
				config.tpl = new Template(config.tpl);
			}

			Q.extend(this, config);
		}
	});

	return Column;
})