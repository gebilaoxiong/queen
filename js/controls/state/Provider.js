define(['util/Observable'], function(Observable) {

	var rdecode = /^(a|n|d|b|s|o|e)\:(.*)$/,

		Provider;

	Provider = Q.Class.define(Observable, {
		init: function() {

			this.state = {};

			this.callParent(arguments);
		},

		get: function(name, defaultValue) {
			return this.state[name] == undefined ?
				defaultValue : this.state[name];
		},

		clear: function(name) {
			delete this.state[name];
			this.fire("statechange", this, name, null);
		},

		set: function(name, value) {
			this.state[name] = value;
			this.fire("statechange", this, name, value);
		},
		/**
		 * 解码
		 * a -> Array
		 * n -> Number
		 * d -> Date
		 * b -> Boolean
		 * s -> String
		 * o -> Object
		 * -> Empty (null)
		 */
		decodeValue: function(cookie) {
			rdecode.lastIndex = 0;

			var matches = rdecode.exec(unescape(cookie)),
				all, type, v, kv;

			if (!matches || !matches[1]) {
				return;
			}

			type = matches[1];
			v = matches[2];

			switch (type) {
				case 'e':
					return null;
				case 'n':
					return parseFloat(v);
				case 'd':
					return new Date(Date.parse(v));
				case 'b':
					return (v == '1');
				case 'a':
					all = [];
					if (v != '') {
						Q.each(v.split('^'), function(_,val) {
							all.push(this.decodeValue(val));
						}, this);
					}
					return all;
				case 'o':
					all = {};
					if (v != '') {
						Q.each(v.split('^'), function(_,val) {
							kv = val.split('=');
							all[kv[0]] = this.decodeValue(kv[1]);
						}, this);
					}
					return all;
				default:
					return v;
			}
		},

		/**
		 * 编码
		 */
		encodeValue: function(value) {
			var enc,
				flat = '',
				i = 0,
				len, key;

			if (value == null) { //空 未定义
				return 'e:1';
			} else if (typeof value == 'number') { //数字

				enc = 'n:' + value;

			} else if (typeof value == 'boolean') { //bool值

				enc = 'b:' + (value ? 1 : 0);

			} else if (Q.isDate(value)) { //日期

				enc = 'd:' + value.toGMTString();

			} else if (Q.isArray(value)) { //数组

				for (len = value.length; i < len; i++) {
					flat += this.encodeValue(value[i]);
					if (i != len - 1) {
						flat += '^';
					}
				}
				enc = 'a:' + flat;

			} else if (typeof value == 'object') { //对象

				for (key in value) {
					if (typeof value[key] != 'function' && value[key] !== undefined) {
						flat += key + '=' + this.encodeValue(value[key]) + '^';
					}
				}
				enc = 'o:' + flat.substring(0, flat.length - 1);

			} else {//字符串
				enc = 's:' + value;
			}

			return escape(enc);
		}
	});

	return Provider;
});