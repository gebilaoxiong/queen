define([
	'data/Types',
	'data/SortTypes'
], function(DataTypes, SortTypes) {

	var Field = Q.Class.define({

		/*转换日期时的格式*/
		dateFormat: null,

		/*在转换数字的时候 如果转换失败则返回null*/
		useNull: false,

		/*当Record创建时提供的默认值*/
		defaultValue: '',

		/*读取数据时候的路径表达式*/
		mapping: null,

		sortType: null,

		/*排序规则*/
		sortDir: 'ASC',

		allowBlank: true,

		init: function(config) {
			var st /*sortType 排序类型*/ ;


			if (Q.isString(config)) {
				config = {
					name: config
				};
			}

			//配置附加到实例上
			Q.extend(this, config);

			st = this.sortType;

			if (this.type) {
				if (Q.isString(this.type)) {
					this.type = DataTypes[this.type.toLowerCase()] || DataTypes.auto;
				}
			} else {
				this.type = DataTypes.auto;
			}

			if (Q.isString(st)) {
				this.sortType = SortTypes[st];
			} else {
				this.sortType = this.type.sortType;
			}

			if (!this.convert) {
				this.convert = this.type.convert;
			}

		}
	});

	return Field;
});