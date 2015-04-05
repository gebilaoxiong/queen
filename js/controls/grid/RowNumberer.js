/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-03-31 21:53:46
 * @description
 */
define(function() {

	var RowNumberer, defaultConfig;

	defaultConfig = {
		/*标题*/
		header: '序号',

		width: 60,

		sortable: false,
		// private
		fixed: true,
		hideable: false,
		menuDisabled: true,
		dataIndex: '',
		id: 'numberer',
		rowspan: undefined,

		// private
		renderer: function(v, p, record, rowIndex) {
			if (this.rowspan) {
				p.cellAttr = 'rowspan="' + this.rowspan + '"';
			}
			return rowIndex + 1;
		}
	};

	RowNumberer = Q.Class.define({

		init: function(config) {
			Q.extend(this, defaultConfig, config);

			if (this.rowspan) {
				this.renderer = Q.proxy(this.renderer, this);
			}
		}
	});

	return RowNumberer;
});