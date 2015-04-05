define(['data/proxy/Proxy', 'data/Api'], function(proxy, dataApi) {

	var Memory = Q.Class.define(proxy, {

		type:'MemoryProxy',
		
		init: function(data) {
			var api = {};
			
			api[dataApi.actions.read] = true;

			Memory.superclass.prototype.init.call(this, {
				api: api
			});
			
			this.data = data;
		},

		doRequest: function(action, rs, params, reader, callback, scope, arg) {
			// No implementation for CRUD in MemoryProxy.  Assumes all actions are 'load'
			params = params || {};
			var result;
			try {
				result = reader.readRecords(this.data);
			} catch (e) {
				// @deprecated loadexception
				this.fire("loadexception", this, null, arg, e);

				this.fire('exception', this, 'response', action, arg, null, e);
				callback.call(scope, null, arg, false);
				return;
			}
			callback.call(scope, result, arg, true);
		}
	});

	return Memory;
});