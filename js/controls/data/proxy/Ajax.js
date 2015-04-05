define([
	'data/proxy/Proxy',
	'data/Api',
	'data/Connection',
	'data/Ajax'
], function(proxy, dataApi, ajaxConnection, Ajax) {

	var AjaxProxy = Q.Class.define(proxy, {

		type: 'HttpProxy',

		init: function(conn) {
			var actions;

			this.callParent(arguments);

			this.conn = conn;

			this.conn.url = null;

			this.useAjax = !conn || !(conn instanceof ajaxConnection);

			actions = dataApi.actions;
			this.activeRequest = {};

			for (var verb in actions) {
				this.activeRequest[actions[verb]] = undefined;
			}
		},

		getConnection: function() {
			return this.useAjax ? Ajax : this.conn;
		},

		setUrl: function(url, makePermanent) {
			this.conn.url = url;
			if (makePermanent === true) {
				this.url = url;
				this.api = null;
				dataApi.prepare(this);
			}
		},

		doRequest: function(action, rs, params, reader, cb, scope, arg) {
			var o = {
				method: this.api[action] ? this.api[action]['method'] : undefined,
				request: {
					callback: cb,
					scope: scope,
					arg: arg
				},
				reader: reader,
				callback: this.createCallback(action, rs),
				scope: this
			};

			if (params.jsonData) {
				o.jsonData = params.jsonData;
			} else if (params.xmlData) {
				o.xmlData = params.xmlData;
			} else {
				o.params = params || {};
			}

			this.conn.url = this.buildUrl(action, rs);

			if (this.useAjax) {

				Q.applyIf(o, this.conn);
				if (action == dataApi.actions.read && this.activeRequest[action]) {
					Q.ajax.abort(this.activeRequest[action]);
				}

				this.activeRequest[action] = Ajax.request(o);
			} else {
				this.conn.request(o);
			}

			this.conn.url = null;
		},
		//回调
		createCallback: function(action, rs) {
			return function(o, success, response) {
				//清除激活请求ID
				this.activeRequest[action] = undefined;

				//失败直接调用callback
				//两个事件都被store转播
				if (!success) { 
					if (action === dataApi.actions.read) {
						this.fire('loadexception', this, o.request);
					}
					this.fire('exception', this, 'response', action, o, response);
					o.request.callback.call(o.request.scope, null, o.request.arg, false);
					return;
				}

				if (action === dataApi.actions.read) {
					this.onRead(action, o, response);
				} else {
					this.onWrite(action, o, response, rs);
				}
			};
		},

		//action:read的回调
		onRead: function(action, o, response) {
			var result, res;

			try {
				//解析失败
				result = o.reader.read(response);
			} catch (e) {
				this.fire('loadexception', this, o, response, e);

				this.fire('exception', this, 'response', action, o, response, e);
				o.request.callback.call(o.request.scope, null, o.request.arg, false);
				return;
			}

			if (result.success === false) {
				this.fire('loadexception', this, o, response);

				res = o.reader.readResponse(action, response);
				this.fire('exception', this, 'remote', action, o, res, null);
			} else {
				this.fire('load', this, o, o.request.arg);
			}

			o.request.callback.call(o.request.scope, result, o.request.arg, result.success);
		},
		//action:update destroy modify的回调
		onWrite: function(action, o, response, rs) {
			var reader = o.reader,
				res;

			try {
				res = reader.readResponse(action, response);
			} catch (e) {
				this.fire('exception', this, 'response', action, o, response, e);
				o.request.callback.call(o.request.scope, null, o.request.arg, false);
				return;
			}

			if (res.success === true) {
				this.fire('write', this, action, res.data, res, rs, o.request.arg);
			} else {
				this.fire('exception', this, 'remote', action, o, res, rs);
			}

			o.request.callback.call(o.request.scope, res.data, res, res.success);
		},
		/*销毁*/
		destroy: function() {
			var actions, verb;

			if (!this.useAjax) {
				this.conn.abort();
			} else if (this.activeRequest) {
				actions = dataApi.actions;
				for (verb in actions) {
					if (this.activeRequest[verb]) {
						Q.ajax.abort(this.activeRequest[actions[verb]]);
					}
				}
			}

			this.callParent(arguments);
		}
	});

	return AjaxProxy;
});