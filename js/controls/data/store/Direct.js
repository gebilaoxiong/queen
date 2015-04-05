/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-03-25 02:04:46
 * @description
 */
define([
	'data/store/Store',
	'data/proxy/Direct',
	'data/reader/Json'
], function(DataStore, DirectProxy, JsonReader) {

	var DirectStore = Q.Class.define(DataStore, {

		init: function(config) {

			var _cfg, proxyCfg, readerCfg;

			_cfg = Q.extend({}, {
				batchTransactions: false
			}, config);

			//如果没有设置代理
			if (_cfg.proxy == null) {
				proxyCfg = {};

				Q.each('paramOrder,paramsAsHash,directFn,api'.split(','), function(_, prop) {
					if (_cfg.hasOwnProperty(prop)) {
						proxyCfg[prop] = _cfg[prop];
					}
				});
			}

			//只设置了fields
			if (c.reader == null && _cfg.fields) {
				readerCfg = {};

				Q.each('totalProperty,root,idProperty'.split(','), function(_, prop) {
					if (c.hasOwnProperty(prop)) {
						readerCfg[prop] = c[prop];
					}
				});
			}


			this.callParent('init', [Q.extend(_cfg, {
				proxy: _cfg.proxy != null ? _cfg.proxy : new DirectProxy(proxyCfg),
				reader: _cfg.reader == null && _cfg.fields ? new JsonReader(readerCfg, _cfg.fields) : _cfg.reader
			})]);

		}
	});

	return DirectStore;
});