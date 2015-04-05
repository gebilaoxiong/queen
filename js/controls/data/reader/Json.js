define([
	'data/reader/Reader',
	'data/Api',
	'data/Response'
], function(Reader, Api, DataResponse) {

	var rprop = /[\[\.]]/,

		defaultMeta = {
			idProperty: 'id',
			successProperty: 'success',
			totalProperty: 'total'
		},

		JsonReader;

	JsonReader = Q.Class.define(Reader, {

		type: 'JsonReader',

		init: function(meta, recordType) {
			meta = meta || {};

			Q.applyIf(meta, defaultMeta);

			recordType = recordType || meta.recordType;


			this.callParent('init', [meta, recordType || meta.fields]);
		},

		read: function(response) {
			var jsonString = response.responseText,
				json = Q.JSON.parse(jsonString);

			if (!json) {
				throw {
					message: 'JsonReader.read: Json object not found'
				}
			}

			return this.readRecords(json);
		},

		readRecords: function(json) {
			var me, meta,
				totalRecords, totalProperty, root,
				rootLength, v, success;

			me = this;
			me.jsonData = json;
			//meta
			if (json.metaData) {
				me.onMetaChange(json.metaData);
			}
			meta = me.meta;

			root = me.getRoot(json);
			rootLength = totalProperty = root.length;
			success = true;

			//totalProperty
			if (meta.totalProperty) {
				v = parseInt(me.getTotal(json), 10);

				if (!isNaN(v)) {
					totalRecords = v;
				}
			}

			//是否成功
			if (meta.successProperty) {
				v = me.getSuccess(json);
				if (v === false || v === 'false') {
					success = false;
				}
			}

			//返回read操作所需的json格式
			return {
				success: success,
				records: me.extractData(root, true),
				totalRecords: totalRecords
			}

		},

		readResponse: function(action, response) {
			var root, success, def, res,
				json = response.responseText !== undefined ?
				Q.parse2Json(response.responseText) :
				response;

			if (!json) {
				throw new JsonReader.Exception('response');
			}

			root = this.getRoot(json);
			success = this.getSuccess(json);

			if (success && action === Api.actions.create) {
				def = Q.isDefined(root);
				if (def && Q.isEmptyObject(root)) {
					throw new JsonReader.Exception('root-empty', this.meta.root);
				} else if (!def) {
					throw new JsonReader.Exception('root-undefined-response', this.meta.root);
				}
			}

			res = new DataResponse({
				action: action,
				success: success,
				data: root ? this.extractData(root, false) : [],
				message: this.getMessage(json),
				raw: json
			});

			if (res.success == undefined || res.success == '') {
				throw new JsonReader.Exception('successProperty-response', this.meta.successProperty);
			}

			return res;
		},

		/*建立萃取器*/
		buildExtractors: function() {
			var meta, Record, fields,
				fieldsItems, fieldsLength,
				getId, ef, i, field;

			if (this.ef) {
				return;
			}

			meta = this.meta;
			Record = this.recordType;
			fields = Record.prototype.fields;
			fieldsItems = fields.data;
			fieldsLength = fields.count();

			//编译访问器
			if (meta.totalProperty) {
				this.getTotal = this.createAccessor(meta.totalProperty);
			}

			if (meta.successProperty) {
				this.getSuccess = this.createAccessor(meta.successProperty);
			}

			if (meta.messageProperty) {
				this.getMessage = this.createAccessor(meta.messageProperty);
			}

			//获取数据的根
			this.getRoot = meta.root ?
				this.createAccessor(meta.root) :
				function(o) {
					return o
				};

			//id访问器
			if (meta.id || meta.idProperty) {
				getId = this.createAccessor(meta.id || meta.idProperty);
				this.getId = function(rec) {
					var ret = getId(rec);
					return (ret == undefined || ret === '') ? null : ret;
				}
			} else {
				this.getId = function() {
					return null;
				}
			}

			ef = [];

			for (i = 0; i < fieldsLength; i++) {
				field = fieldsItems[i];
				ef.push(this.createAccessor(
					field.mapping != undefined ? field.mapping : field.name));
			}

			this.ef = ef;
		},

		createAccessor: function(expr) {
			var i;
			if (expr == undefined || (Q.isArray(expr) && expr.length)) {
				return Q.noop;
			}
			if (Q.isFunction(expr)) {
				return expr;
			}

			i = String(expr).search(rprop);

			if (i >= 0) { //field mapping属性info.name
				return new Function('o', 'return o' + (i > 0 ? '.' : '') + expr);
			}

			return function(obj) {
				return obj[expr];
			}

		},

		extractValues: function(data, fieldsItems, len) {
			var field, values = {},
				j, value;

			for (j = 0; j < len; j++) {
				field = fieldsItems[j];
				value = this.ef[j](data);

				values[field.name] = field.convert(
					value !== undefined ? value : field.defualtValue,
					data);
			}

			return values;
		}
	});

	JsonReader.Exception = Q.Class.define(Reader.Exception, {
		init: function(message, arg) {
			this.arg = arg;
			this.callParent(arguments);
		},
		lang: {
			'response': 'An error occurred while json-decoding your server response',
			'successProperty-response': 'Could not locate your "successProperty" in your server response.  Please review your JsonReader config to ensure the config-property "successProperty" matches the property in your server-response.  See the JsonReader docs.',
			'root-undefined-config': 'Your JsonReader was configured without a "root" property.  Please review your JsonReader config and make sure to define the root property.  See the JsonReader docs.',
			'idProperty-undefined': 'Your JsonReader was configured without an "idProperty"  Please review your JsonReader configuration and ensure the "idProperty" is set (e.g.: "id").  See the JsonReader docs.',
			'root-empty': 'Data was expected to be returned by the server in the "root" property of the response.  Please review your JsonReader configuration to ensure the "root" property matches that returned in the server-response.  See JsonReader docs.'
		}
	})

	return JsonReader;
});