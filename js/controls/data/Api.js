define([
	'controls/Exception',
	'data/Response'
], function(exception, response) {

	var validActions = {},

		Api = {

			actions: {
				create: 'create',
				read: 'read',
				update: 'update',
				destroy: 'destroy'
			},

			restActions: {
				create: 'POST',
				read: 'GET',
				update: 'PUT',
				destroy: 'DELETE'
			},

			isAction: function(action) {
				return !!Api.actions[action];
			},

			getVerb: function(name) {
				var verb;

				if (validActions[name]) {
					return validActions[name];
				}

				for (verb in this.actions) {
					if (this.actions[verb] === name) {
						validActions[name] = verb;
						break;
					}
				}

				return (validActions[name] !== undefined ? validActions[name] : null);
			},

			isValid: function(api) {
				var invalid = [],
					crud = this.actions,
					action;

				for (action in api) {
					if (!(action in crud)) {
						invalid.push(action);
					}
				}

				return (!invalid.length) ? true : invalid;
			},

			hasUniqueUrl: function(proxy, verb) {
				var url = (proxy.api[verb]) ? proxy.api[verb].url : null,
					unique = true,
					action;

				for (action in proxy.api) {
					if ((unique = (action === verb) ?
						true :
						(proxy.api[action].url != url) ? true : false) === false) {
						break;
					}
				}
				return unique;
			},

			/*
				将为proxy定义、整理api
			*/
			prepare: function(proxy) {
				var proxyApi, verb, action;

				if (!proxy.api) {
					proxy.api = {};
				}

				proxyApi = proxy.api;

				for (verb in this.actions) {
					action = this.actions[verb];
					proxyApi[action] = proxyApi[action] || proxy.url || proxy.directFn;

					if (typeof(proxyApi[action]) == 'string') {
						proxyApi[action] = {
							url: proxyApi[action],
							method: (proxy.restful === true) ? Api.restActions[action] : undefined
						};
					}

				}
			},
			/*初始化Proxy，让其成为RESTful*/
			restify: function(proxy) {
				var verb;

				proxy.restify = true;

				for (verb in this.restActions) {
					proxy.api[this.actions[verb]].method ||
						(proxy.api[this.actions[verb]].method = this.restActions[verb]);
				}

				proxy.onWrite = Q.wrap(proxy, function(action, o, response, rs) {
					var reader = o.reader,
						res = new response({
							action: action,
							raw: response
						});

					switch (response.status) {
						case 200:
							return true;
							break;
						case 201:
							if (res.raw.responseText == undefined) {
								res.success = true
							} else {
								return true;
							}
							break;
						case 204:
							res.success = true;
							res.data = null;
							break;
						default:
							return true;
							break;
					}

					if (res.success === true) {
						this.fire("write", this, action, res.data, res, rs, o.request.arg);
					} else {
						this.fire('exception', this, 'remote', action, o, res, rs);
					}

					o.request.callback.call(o.request.scope, res.data, res, res.success);
					return false;
				}, proxy.onWrite);
			}
		};

	Api.Exception = Q.Class.define(exception, {

		init: function(message, arg) {
			this.arg = arg;
			this.callParent(arguments);
		},

		name: 'controls.data.Api',

		lang: {
			'action-url-undefined': 'No fallback url defined for this action.  When defining a DataProxy api, please be sure to define an url for each CRUD action in Ext.data.Api.actions or define a default url in addition to your api-configuration.',
			'invalid': 'received an invalid API-configuration.  Please ensure your proxy API-configuration contains only the actions defined in Ext.data.Api.actions',
			'invalid-url': 'Invalid url.  Please review your proxy configuration.',
			'execute': 'Attempted to execute an unknown action.  Valid API actions are defined in Ext.data.Api.actions"'
		}

	})

	return Api
})