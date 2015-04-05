define(['util/Timer'], function(Timer) {

	/*
		抽象类
		提供控件的事件支持
	*/
	var guid = 0,

		arrayProto = Array.prototype,

		core_slice = arrayProto.slice,

		core_shift = arrayProto.shift,

		core_unshift = arrayProto.unshift,

		core_concat = arrayProto.concat,

		Observable;

	Observable = Q.Class.define(Q.Abstract, {

		type: 'Observable',

		/*是否事件被挂起*/
		sleeping: false,

		bubbleEvents: [],

		init: function() {
			if (this.listeners) {
				this.bind(this.listeners);
				delete this.listeners;
			}
		},

		/*
				绑定事件
				@param options 
					scope   {Object}
					delay   {Number}
					once  {Bool}

				myGridPanel.bind("mouseover", this.onMouseOver, this);

				myGridPanel.bind({
				    cellClick: this.onCellClick,
				    mouseover: this.onMouseOver,
				    mouseout: this.onMouseOut,
				    scope: this 
				});
			*/
		bind: function(eventName, fn /*opt*/ , scope /*opt*/ , options /*opt*/ ) {
			var me = this,
				cfg, eventsCache, dispatchHandler, eventObjArray, eventObj, singleHandler;

			//整理参数
			if (typeof eventName != 'string') {
				options = eventName;

				for (eventName in options) {
					cfg = options[eventName];

					if (!cfg) {
						continue;
					}

					arguments.callee.call(me, eventName, cfg.fn || cfg, cfg.scope || options.scope, cfg.fn ? cfg : options)
				}

				return this;
			}

			//不绑定非function的东东
			if (!Q.isFunction(fn)) {
				return this;
			}

			eventName = Q.String.trim(eventName).toLowerCase();
			eventsCache = Q.cache._data(me, 'events') || Q.cache._data(me, 'events', {});

			if (!fn.guid) {
				fn.guid = guid++;
			}

			//缓存事件对象的数组
			eventObjArray = eventsCache[eventName] || (eventsCache[eventName] = []);
			options = options || {};

			if (options.single) {
				singleHandler = function(e) {
					fn.apply(scope, arguments);
					me.unbind(e.type, arguments.callee, scope);
				}
				singleHandler.guid = fn.guid;
			}

			eventObj = {
				sender: me,
				type: eventName,
				handler: options.single ? singleHandler : fn,
				data: options.data,
				guid: fn.guid,
				single: options.single,
				scope: scope,
				delay: options.delay
			}

			//延时器
			if (eventObj.delay) {
				eventObj.timer = new Timer(Q.noop);
			}

			eventObjArray.push(eventObj);

			return this;
		},

		/*派发当前对象的事件处理函数*/
		dispatch: function(event) {
			var me = this,
				type = event.type,
				eventObjArray,
				i = 0,
				len, eventObj, context;

			//处于休眠中
			if (me.sleeping) {
				return;
			}

			eventObjArray = (Q.cache._data(me, 'events') || {})[type]

			//如果没有绑定事件
			if (!eventObjArray || !eventObjArray.length) {
				return;
			}

			for (len = eventObjArray.length; i < len; i++) {
				eventObj = eventObjArray[i];
				context = eventObj.scope || me;
				event.currentTarget = me;
				event.data = eventObj.data;

				if (eventObj.timer) {

					eventObj.timer.delay(
						eventObj.delay,
						eventObj.handler,
						context,
						arguments);

				} else {
					//一旦出现false 全部 false 用于某些事件的判定（beforeload）
					event.result = eventObj.handler.apply(context, arguments) !== false && event.result;
				}

				if (eventObj.single) {
					len--;
					i--;
				}
			}

		},

		unbind: function(type, fn, scope) {
			var cache = Q.cache._data(this),
				eventObjArray, len, eventObj, i;

			if (!cache || !cache.events) {
				return
			}

			//如果没有type 则删除所有事件
			if (type === undefined) {
				for (type in cache.events) {
					arguments.callee.call(this, type, fn, scope);
				}
				return;
			}

			type = Q.String.trim(type).toLowerCase();

			if (!cache.events || !cache.events[type]) {
				return;
			}

			eventObjArray = cache.events[type];
			len = eventObjArray.length;


			for (i = 0; i < len; i++) {
				eventObj = eventObjArray[i];

				if ((!fn || fn.guid == eventObj.handler.guid) &&
					(!scope || scope == eventObj.scope)
				) {
					if (eventObj.timer) {
						eventObj.timer.destroy();
					}
					if (fn) { //如果fn存在 删除
						eventObjArray.splice(i, 1);
						break;
					}
				}
			}

			//如果fn不存在或试讲 移除所有事件处理函数
			if (!fn || eventObjArray.length === 0) {
				eventObjArray.length = 0;
				delete cache.events[type];
			}

			if (Q.isEmptyObject(cache.events)) {
				delete cache.events;
			}

			if (Q.cache._isEmptyCache(cache)) {
				delete this[Q.cache.expando];
			}

		},

		/**
		 * 触发事件
		 * @param  {string}  eventName     事件名称
		 */
		fire: function(eventName) {
			var params;

			params = core_slice.call(arguments, 1);

			return this.fireEvent(eventName, params, false);
		},

		/**
		 * 触发一个事件 使其冒泡
		 * @param  {string}  eventName     事件名称
		 */
		fireBubble: function(eventName) {
			var params;

			params = core_slice.call(arguments, 1);

			return this.fireEvent(eventName, params, true);
		},

		/**
		 * 触发事件
		 * @param  {string}  eventName 事件名称
		 * @param  {Array[]}  args      参数
		 * @param  {Boolean} bubble  是否允许冒泡
		 */
		fireEvent: function(eventName, args, bubble) {

			var me = this,
				event, execPath, cur;

			if (me.sleeping || (!eventName && Q.String.isEmpty(eventName))) {
				return;
			}

			eventName = Q.String.trim(eventName).toLowerCase();
			event = new Event(eventName, me); //事件对象

			//将事件对象插入到参数数组头部
			args = args || [];
			args.unshift(event);

			execPath = []; //执行路径
			execPath.push(me);

			//如果此事件是一个冒泡事件 或者此次触发允许冒泡
			if (me.enableBubble(eventName) || bubble === true) {
				cur = me;

				while (cur = cur.ownerCt) {
					execPath.push(cur);
				}
			}


			while ((cur = execPath.pop()) && !event.isPropagationStopped) {
				if (cur instanceof Observable) {
					cur.dispatch.apply(cur, args);
				}
			}

			return event.result;
		},

		/*判断是否事件需要冒泡*/
		enableBubble: function(type) {
			var bubbleEvents = this.bubbleEvents,
				len = bubbleEvents.length,
				ret = false;

			while (len--) {
				if (bubbleEvents[len] === type) {
					ret = true;
					break;
				}
			}

			return ret;
		},

		/**
		 * 转播事件
		 * @param  {Component} sender 事件源控件
		 * @param  {String[]} events 需要转播的事件名称
		 */
		relayEvents: function(sender, events) {
			var me = this;

			if (Q.isString(events)) {
				events = [events];
			}

			Q.each(events, function(_, eventName) {

				sender.bind(eventName, function() {
					core_shift.call(arguments); //去掉eventObject
					return this.fire.apply(me, core_concat.apply([eventName], arguments));
				}, me);

			});
		},

		/*挂起事件*/
		sleep: function() {
			this.sleeping = true;
		},
		/*恢复事件*/
		wakeup: function() {
			this.sleeping = false;
		},

		hasListener: function(eventName) {

		}

	}),

	Event = Q.Class.define({

		//是否默认动作被阻止
		defaultPrevented: false,

		//是否停止冒泡
		isPropagationStopped: false,

		init: function(type, target) {
			this.type = type;
			this.target = target;
		},

		/*阻止默认动作*/
		preventDefault: function() {
			this.defaultPrevented = true;
		},

		/*停止事件传播*/
		stopPropagation: function() {
			this.isPropagationStopped = true;
		}
	});

	return Observable;
})