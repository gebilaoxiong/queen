/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-03-25 20:40:50
 * @description
 */
define([
	'data/Ajax',
	'controls/Direct'
], function(Ajax, Direct) {

	var Action, Load, Submit, DirectSubmit, DirectLoad;

	/*
		返回数据格式应该为
		提交成功:
		{
			success:true
		}
		提交失败:
		{
			success:false,
			errors:{
				'field1':'字符串太长'
			}
		}

		载入成功
		{
			success:true,
			data:{name:123,age:321}
		}
		载入失败
		{
			success:false|true,
			data:null
		}
	*/

	Action = Q.Class.define(Q.Abstract, {

		statics: {
			client_invalid: 'client',

			server_invalid: 'server',

			connect_failure: 'connect',

			load_failure: 'load'
		},

		type: 'default',

		init: function(form, options) {
			this.form = form;
			this.options = options || {};
		},

		//options
		run: Q.noop,

		//response
		success: Q.noop,

		//response
		handleResponse: Q.noop,

		failure: function(response) {
			this.response = response;
			this.failureType = Action.connect_failure;
			this.form.afterAction(this, false);
		},

		//共享代码中所有操作验证响应
		processResponse: function(response) {
			this.response = response;

			//没有返回任何消息 表示一个提交操作成功
			if (!response.responseText && !response.responseXML) {
				return true;
			}

			this.result = this.handleResponse(response);
			return this.result;
		},

		decodeResponse: function(response) {
			try {
				return Q.JSON.parse(response.responseText);
			} catch (e) {
				return false;
			}
		},

		/*
			获取URL
			@param {bool} appendParams 是否将参数合并到URL中
		*/
		getUrl: function(appendParams) {
			var url = this.options.url || this.form.url || this.form.el.dom.action,
				params;

			if (appendParams) {
				params = this.getParams();

				if (params) {
					url = url + (url.indexOf('?') === -1 ? '?' : '&') + params;
				}
			}

			return url;
		},

		// private
		getMethod: function() {
			return (this.options.method || this.form.method || this.form.el.dom.method || 'POST').toUpperCase();
		},

		getParams: function() {
			var baseParams = this.form.baseParams,
				params = this.options.params;

			if (params) {
				if (typeof params == 'object') { //将对象转换为URL字符串
					params = Q.Object.toQueryString(Q.applyIf(params, baseParams));
				}
			} else if (baseParams) {
				params = Q.Object.toQueryString(baseParams);
			}
			return params;
		},

		createCallback: function(options) {
			var opts = opts || {};

			return {
				success: this.success,
				failure: this.failure,
				scope: this,
				timeout: (options.timeout * 1000) || (this.form.timeout * 1000),
				upload: this.form.fileUpload ? this.success : undefined
			}
		}
	});

	Submit = Q.Class.define(Action, {
		/*
			options

			clientValidation : boolean  决定是否在提交之前调用isValid 对Form的表单项进行校验。 
			在Form的提交选项中传递false可以阻止此操作。 如果不定义，将会在提交之前执行校验。 
		
			submitEmptyText : Boolean  如果被置为 true,emptyText值将在form提交时一同发送默认为true。 
		*/

		type: 'submit',

		run: function() {
			var options = this.options,
				method = tis.getMethod(),
				isGet = method == 'GET',
				fields, emptyFields, setupEmptyFields;

			//屏蔽客户端验证||验证通过
			if (options.clientValidation === false || this.form.isValid()) {

				//不提交contentPlaceHolder文本(空文本)
				if (options.submitEmptyText === false) {
					fields = this.form.items;
					emptyFields = [];
					setupEmptyFields = function(_, field) {

						if (field.el.val() == field.emptyText) {
							emptyFields.push(field);
							field.el.dom.value = "";
						}

						if (field.isComposite && field.rendered) { //CompositeField
							field.items.each(setupEmptyFields);
						}

					};
					fields.each(setupEmptyFields);
				}

				Ajax.request(Q.extend(this.createCallback(options), {
					form: this.form.el.dom,
					url: this.getUrl(isGet),
					method: method,
					headers: options.headers,
					params: !isGet ? this.getParams() : null,
					isUpload: this.form.fileUpload
				}));

				if (options.submitEmptyText === false) {
					Q.each(emptyFields, function(_, f) {
						if (f.applyEmptyText) {
							f.applyEmptyText();
						}
					});
				}
			} else if (options.clientValidation !== false) {
				this.failureType = Action.client_invalid;
				this.form.afterAction(this, false);
			}

		},

		success: function(response) {
			var result = this.processResponse(response);

			if (result === true || result.success) {
				this.form.afterAction(this, true);
				return;
			}

			if (result.errors) {
				this.form.markInvalid(result.errors);
			}

			this.failureType = Action.server_invalid;
			this.form.afterAction(this, false);
		},

		handleResponse: function(response) {
			var rs, errors

			if (this.form.errorReader) {
				rs = this.form.errorReader.read(response);
				errors = [];

				if (rs.records) {
					for (var i = 0, len = rs.records.length; i < len; i++) {
						var r = rs.records[i];
						errors[i] = r.data;
					}
				}

				//没有错误返回
				if (errors.length < 1) {
					errors = null;
				}

				return {
					success: rs.success,
					errors: errors
				};
			}

			return this.decodeResponse(response);
		}
	});

	Load = Q.Class.define(Action, {

		type: 'load',

		init: function(form, options) {
			this.callParent(arguments);
			this.reader = this.form.reader;
		},

		run: function() { //发送ajax请求
			Ajax.request(Q.extend(
				this.createCallback(this.options), {
					method: this.getMethod(),
					url: this.getUrl(false),
					headers: this.options.headers,
					params: this.getParams()
				}
			));
		},

		success: function(response) {
			var ret = this.processResponse(response);
			//如果操作失败 或没有返回任何数据 为失败
			if (ret === true || !ret.success || !ret.data) {
				this.failureType = Action.load_failure;
				this.form.afterAction(this, false);
				return;
			}
			this.form.clearInvalid();
			this.form.setValues(ret.data);
			this.form.afterAction(this, true);
		},

		//只读取一条记录
		handleResponse: function(response) {
			var rs, data;

			if (this.form.reader) {
				rs = this.form.reader.read(response);
				data = rs.records && rs.records[0] ? rs.records[0].data : null;

				return {
					success: rs.success,
					data: data
				};
			}

			return this.decodeResponse(response);
		}
	});

	DirectSubmit = Q.Class.define(Submit, {

		type: 'directsubmit',

		run: function() {
			var me = this,
				options = me.options;

			//未要求客户端验证
			//通过验证
			if (options.clientValidation === false || me.form.isValid()) {

				me.success.params = me.getParams();
				me.form.api.submit(me.form.el.dom, me.success, me)

			}
			//验证失败
			else if (options.clientValidation !== false) {

				me.failureType = Action.client_invalid;
				me.form.afterAction(this, false);
			}
		},

		getParams: function() {
			var me = this,
				baseParams = me.form.baseParams,
				params = me.options.params;

			return Q.extend({}, params, baseParams);
		},

		processResponse: function(result) {
			this.result = result;
			return result;
		},

		success: function(response, trans) {
			if (trans.type == Direct.exceptions.SERVER) {
				response = {};
			}

			this.callParent('success', response);
		}

	});

	DirectLoad = Q.Class.define(Load, {
		type: 'directload',

		run: function() {
			var args = this.getParams();
			args.push(this.success, this);
			this.form.api.load.apply(window, args);
		},

		getParams: function() {
			var buf = [],
				o = {},
				baseParams = this.form.baseParams,
				params = this.options.params,
				paramOrder = this.form.paramOrder,
				i, len;

			Q.extend(o, params, baseParams);

			if (paramOrder) {
				for (i = 0, len = paramOrder.length; i < len; i++) {
					buf.push(o[paramOrder[i]]);
				}
			} else if (this.form.paramsAsHash) {
				buf.push(o);
			}
			return buf;
		},

		processResponse: function(result) {
			this.result = result;
			return result;
		},

		success: function(response, trans) {
			if (trans.type == Direct.exceptions.SERVER) {
				response = {};
			}

			this.callParent('success', response);
		}
	});

	return {
		'action': Action,
		'load': Load,
		'submit': Submit,
		'directsubmit': DirectSubmit,
		'directload': DirectLoad
	}

})