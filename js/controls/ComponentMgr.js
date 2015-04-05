define(function() {
	/*组件管理器*/

	//组件缓存
	var cmpCache = new Q.Hash(),

		core_slice = Array.prototype.slice;


	/*注册控件实例*/
	function register(cmp, key) {
		if (key === undefined && !Q.isFunction(cmp.getId)) {
			return;
		}

		if (key === undefined) {
			key = cmp.getId();
		}

		cmpCache.set(key, cmp);
	}

	/*解除注册*/
	function unregister(key) {
		if (!Q.isString(key) && key.getId) {
			key = key.getId();
		}

		cmpCache.remove(key);
	}

	/*获取控件*/
	function get(key) {
		if (!Q.isString(key) && key.getId) {
			key = key.getId();
		}

		return cmpCache.get(key);
	}

	/*创建一个控件实例*/
	function create(config, defaultType) {
		var type, instance;

		if (!(config && config.xtype) && !defaultType) {
			return;
		}

		if (config && ('xtype' in config)) {

			type = config['xtype'];

		} else {
			type = defaultType;
		}

		klass.prototype = type.prototype;
		instance = new klass(type, config);

		if (instance.xtype) {
			delete instance.xtype;
		}

		return instance;
	}

	/*假类 通过传入一个构造函数和参数的数组 构造实例*/
	function klass(type, arg) {
		type.call(this, arg);
	}


	function lookup(cmp) {
		if (!cmp) {
			return;
		}

		if (Q.isPlainObject(cmp)) {
			cmp = create(cmp);
		}

		if (cmp && cmp.id) {
			return cmpCache[cmp.id];
		}
	}

	return {
		register: register,
		unregister: unregister,
		get: get,
		create: create,
		lookup: lookup
	}
})