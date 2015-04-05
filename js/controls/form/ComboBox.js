define([
	'form/TriggerField',
	'data/store/Array',
	'data/StoreManager',
	'controls/Layer',
	'controls/DataView',
	'controls/PagingToolbar',
	'util/Timer'
], function(TriggerField, ArrayStore, StoreManager, Layer, DataView, PagingToolbar, Timer) {
	
	var ComboBox = Q.Class.define(TriggerField, {

		type: 'CheckBox',

		defaultAutoCreate: {
			target: 'input',
			type: 'text',
			size: '24',
			autocomplete: "off"
		},

		listCls: '',

		prefixCls: 'x-combo-list',

		/*选中项*/
		selectedClass: 'x-combo-selected',

		listEmptyText: '',

		//根据ID没有找到对应的文本时
		valueNotFoundText: '',

		triggerCls: 'x-form-arrow-trigger',

		listAlign: 'tl-bl?',

		maxHeight: 300,

		minHeight: 90,

		lazyRender: true,

		/*
			当触发器被点击时需要执行的操作。 
			'query' : Default 
			使用原始值 执行查询。 

			'all' : 
			使用allQuery 指定的配置项 进行查询。 
		*/
		triggerAction: 'all',

		/*在自动完成之前 用户输入的最少字符数*/
		minChars: 4,

		/*
			true将会选中数据store收集到的第一条结果 (默认为true)。 
			false将会需要手动从下拉列表中选择，
			用来设置组件的值，
			除非 typeAheadDelay) 的值为true。
		*/
		autoSelect: true,

		/*
			设置为true，
			当开始输入字符时，在指定的延迟之后会自动匹配剩下的内容， 
			如果找到了匹配的 
			内容则自动选中它 (typeAheadDelay ) (默认值为 false) 
		*/
		typeAhead: false,

		typeAheadDelay: 250,

		/*
			在开始输入和发出查询过滤下拉列表之间需要延迟的毫秒数
		*/
		queryDelay: 500,

		pageSize: 0,

		selectOnFocus: false,

		queryParam: 'query',

		loadingText: "玩命加载中...",

		resizable: false,

		handleHeight: 8,

		/*
			发送给服务器的查询文本，
			用来为列表返回所有记录而不进行过滤(默认为'') 
		*/
		allQuery: '',

		mode: 'remote',

		minListWidth: 70,

		forceSelection: false,

		/*
			true 将不会为当前下拉框初始化列表，
			直到表单项获得焦点为止(默认为true) 
		*/
		lazyInit: true,

		clearFilterOnReset: true,

		submitValue: undefined,

		initComponent: function() {
			var me = this,
				domSettings, data,
				opts, i, len, opt, value, div;

			me.callParent(arguments);

			/*
				声明式初始化
			*/
			if (me.transform) {
				//获取dom
				domSettings = Q.dom.get(me.transform);

				/*
					如果指定，
					一个拥有此name的表单隐藏域将会被动态创建，
					用来存储表单项的 数据值(默认为底层DOM元素的name)。 
					对于在提交表但时自动提交下拉框的值是必须的。 
					另请参见： valueField。 

					注意: 如果没有指定hiddenId， 
						隐藏域的id也将默认为此name的值。 
						ComboBox的 id和 hiddenId 必须是不同的，
					 	因为不应该有两个DOM节点共用一个相同的id。 
					 	所以，如果ComboBox的 name 和 hiddenName是相同的，
					 	你必须指定一个唯一的 hiddenId 。 

				*/
				if (me.hiddenName) {
					me.hiddenName = domSettings.name
				}

				if (!me.store) {
					me.mode = 'local';
					data = [];
					opts = domSettings.options;

					for (i = 0, len = opts.length; i < len; i++) {
						opt = opts[i];
						value = (opt.hasAttribute ?
							opt.hasAttribute('value') :
							o.getAttributeNode('value').specified) ? opt.value : opt.text;

						if (opt.selected && Q.isDefined(me.value)) {
							me.value = value;
						}

						data.push([value, opt.text]);
					}

					me.store = new ArrayStore({
						idIndex: 0,
						fields: ['value', 'text'],
						data: data,
						autoDestroy: true
					});

					me.valueField = 'value';
					me.displayField = 'text';
				}

				domSettings.name = Q.id();
				if (!me.lazyRender) {
					div = (domSettings.ownerDocument || document).createElement('div');
					me.el = Q.Element.overrite(div, me.autoCreate || me.defaultAutoCreate, true);
					div = null;

					me.el.appendTo(domSettings);
					me.render(prependTo.parentNode, domSettings);
				}
				Q.Element.remove(domSettings);
			} else if (me.store) {
				me.store = StoreManager.lookup(me.store);

				//自动创建
				if (me.store.autoCreated) {
					me.displayField = me.valueField = 'field1';
					if (!me.store.expandData) {
						me.displayField = 'field2';
					}
					me.mode = 'local';
				}
			}

			me.selectedIndex = -1;

			if (me.mode == 'local') {

				if (me.initCfg.queryDelay != undefined) {
					me.queryDelay = 10;
				}
				
				if (me.initCfg.minChars) {
					me.minChars = 0;
				}
			}
		},

		onRender: function(container, position) {
			var me = this,
				div;

			if (me.hiddenName && me.submitValue != undefined) {
				me.submitValue = false;
			}

			me.callParent(arguments);

			if (me.hiddenName) {
				div = (me.el.dom.ownerDocument || document).createElement('div');
				me.hiddenField = Q.Element.overwrite(div, {
					target: 'input',
					type: 'hidden',
					name: me.hiddenName,
					id: (this.hiddenId || Q.id())
				}, true);
				div = null;

				me.hiddenField.appendTo(me.wrap);
			}

			//初始化List
			if (!me.lazyInit) {
				me.initList();
			} else {
				me.bind('focus', me.initList, me, {
					single: true
				});
			}
		},

		initValue: function() {
			this.callParent(arguments);
			if (this.hiddenField) {
				this.hiddenField.dom.value =
					Q.isDefined(this.hiddenValue) ? this.hiddenValue : this.value || '';
			}
		},

		getParentZIndex: function() {
			var zindex;

			if (this.ownerCt) {
				this.findParentBy(function(ct) {
					zindex = parseInt(ct.getPositionEl().css('z-index'), 10);
					return !!zindex;
				});
			}

			return zindex;
		},

		getZIndex: function(listParent) {
			var zindex;

			listParent = listParent || Q.dom.get(this.getListParent() || this.getBody());
			zindex = Q.Element.css(listParent, 'z-index', true);

			if (!zindex) {
				zindex = this.getParentZIndex();
			}
			return (zindex || 12000) + 5;
		},

		/*初始化列表*/
		initList: function() {
			var me = this,
				cls, listParent, listWidth;

			if (!me.list) {
				cls = me.prefixCls,
					listParent = Q.dom.get(me.getListParent() || this.getBody());


				me.list = new Layer({
					parentEl: listParent,
					cls: [cls, me.listCls].join(' '),
					constrain: false,
					zindex: me.getZIndex(listParent)
				});

				listWidth = me.listWidth || Math.max(me.wrap.outerWidth(), me.minListWidth);
				me.list.outerWidth(true, listWidth);
				me.assetHeight = 0;

				if (me.syncFont !== false) {
					me.list.css('font-size', me.el.css('font-size'));
				}

				//title
				if (me.title) {
					me.header = me.list.createChild({
						'class': cls + '-hd',
						content: me.title
					});

					me.assetHeight += me.header.outerHeight(true);
				}


				me.innerList = me.list.createChild({
					'class': cls + '-inner'
				});

				me.innerList.on('mouseover', me.onViewOver, me);
				me.innerList.on('mousemove', me.onViewMove, me);

				me.innerList.outerWidth(true, listWidth - me.list.getFrameWidth('left right'));

				//分页
				if (me.pageSize) {
					me.footer = me.list.createChild({
						'class': cls + '-ft'
					});

					me.pageTb = new PagingToolbar({
						store: me.store,
						pageSize: me.pageSize,
						renderTo: me.footer
					});


					me.assetHeight += me.footer.outerHeight(true);
				}


				if (!me.tpl) {
					me.tpl = [
						'<%var i=0,item;while(item=$root[i++]){%>',
						'<div class="' + cls + '-item"><%=item.' + me.displayField + '%></div>',
						'<%}%>'
					];
				}

				me.initView();

				me.view.bind({
					containerclick: me.onViewClick,
					click: me.onViewClick,
					scope: me
				});

				me.bindStore(me.store, true);

				//
				if (me.resizable) {

				}
			}

		},

		/**
		 * 初始化下拉视图
		 */
		initView: function() {
			var me = this;
			if (!me.view) {
				me.view = new DataView({
					applyTo: me.innerList,
					tpl: me.tpl,
					singleSelect: true,
					selectedClass: me.selectedClass,
					itemSelector: me.itemSelector || '.' + me.prefixCls + '-item',
					emptyText: me.listEmptyText,
					deferEmptyText: false
				});
			}
		},

		getListParent: function() {
			return this.getBody();
		},

		getStore: function() {
			return this.store;
		},

		bindStore: function(store, initial) {
			if (this.store && !initial) {
				if (this.store !== store && this.store.autoDestroy) {
					this.store.destroy();
				} else {
					this.store.unbind('beforeload', this.onBeforeLoad, this);
					this.store.unbind('load', this.onLoad, this);
					this.store.unbind('exception', this.collapse, this);
				}

				if (!store) {
					this.store = null;
					if (this.view) {
						this.view.bindStore(null);
					}
					if (this.pageTb) {
						this.pageTb.bindStore(null);
					}
				}
			}

			if (store) {
				if (!initial) {
					this.lastQuery = null;
					if (this.pageTb) {
						this.pageTb.bindStore(store);
					}
				}

				this.store = StoreManager.lookup(store);
				this.store.bind({
					scope: this,
					beforeload: this.onBeforeLoad,
					load: this.onLoad,
					exception: this.collapse
				});

				if (this.view) {
					this.view.bindStore(store);
				}
			}
		},

		reset: function() {
			if (this.clearFilterOnReset && this.mode == 'local') {
				this.store.clearFilter();
			}
			this.callParent(arguments);
		},

		initEvents: function() {
			this.callParent(arguments);
			this.dqTask = new Timer(this.initQuery, this);

			if (this.typeAhead) {
				this.taTask = new Timer(this.onTypeAhead, this);
			}

			if (!this.enableKeyEvents) {
				this.el.on('keyup', this.onKeyUp, this);
			}
		},

		onDestroy: function() {
			if (this.dqTask) {
				this.dqTask.destroy();
				this.dqTask = null;
			}
			this.bindStore(null);

			Q.destroy(
				this.resizer,
				this.view,
				this.pageTb,
				this.list
			);

			if (this.hiddenField) {
				this.hiddenField.remove();
				delete this.hiddenField;
			}

			this.callParent(arguments);
		},

		onDisable: function() {
			this.callParent(arguments);
			if (this.hiddenField) {
				this.hiddenField.dom.disabled = true;
			}
		},

		onBeforeLoad: function() {
			if (!this.hasFocus) {
				return;
			}

			//载入文本
			this.innerList.dom.innerHTML = this.loadingText ?
				'<div class="loading-indicator">' + this.loadingText + '</div>' : '';

			this.restrictHeight();
			this.selectedIndex = -1;
		},

		onLoad: function() {
			if (!this.hasFocus) {
				return;
			}

			if (this.store.getCount() > 0 || this.listEmptyText) {
				this.expand();
				this.restrictHeight();
				if (this.lastQuery == this.allQuery) {
					if (this.editable) {
						this.el.dom.select();
					}

					if (this.autoSelect !== false && !this.selectByValue(this.value, true)) {
						this.select(0, true);
					}
				} else {
					if (this.autoSelect !== false) {
						this.selectNext();
					}

					if (this.typeAhead) {
						this.taTask.delay(this.typeAheadDelay);
					}
				}
			} else {
				this.collapse();
			}
		},

		onTypeAhead: function() {
			var record, newValue, len, selStart;

			if (this.store.getCount() > 0) {
				record = this.store.getAt(0);
				newValue = record.data[this.displayField];
				len = newValue.length;
				selStart = this.getRawValue().length;

				if (selStart != len) {
					this.setRawValue(newValue);
					this.selectText(selStart, newValue.length);
				}
			}
		},

		assertValue: function() {
			var val = this.getRawValue(),
				record;

			if (this.valueField && Q.isDefined(this.value)) {
				record = this.findRecord(this.valueField, this.value);
			}

			if (!record || record.get(this.displayField) != val) {
				record = this.findRecord(this.displayField, val);
			}

			if (!record && this.forceSelection) {
				if (val.length > 0 && val != this.emptyText) {
					this.el.dom.value = Q.isDefined(this.lastSelectionText) ?
						this.lastSelectionText : '';
					this.applyEmptyText();
				} else {
					this.clearValue();
				}
			} else {
				if (record && this.valueField) {
					if (this.value == val) {
						return;
					}

					val = record.get(this.valueField || this.displayField);
				}
				this.setValue(val);
			}
		},

		onSelect: function(record, index) {
			var me = this;
			if (me.fire('beforeselect', me, record, index) !== false) {
				me.setValue(record.data[me.valueField || me.displayField]);
				me.collapse();
				me.fire('select', me, record, index);
			}
		},

		getName: function() {
			var hiddenField = this.hiddenField;
			return hiddenField && hiddenField.dom.name ?
				hiddenField.name :
				this.hiddenName || this.callParent(arguments);
		},

		getValue: function() {
			if (this.valueField) {
				return Q.isDefined(this.value) ? this.value : '';
			} else {
				return this.callParent(arguments);
			}
		},

		clearValue: function() {
			var me = this;

			if (me.hiddenField) {
				me.hiddenField.dom.value = '';
			}
			me.setRawValue('');
			me.lastSelectionText = '';
			me.applyEmptyText();
			me.value = '';
		},

		setValue: function(value) {
			var me = this,
				text = value,
				record;

			if (me.valueField) {
				record = me.findRecord(me.valueField, value);
				if (record) {
					text = record.data[me.displayField];
				} else if (me.valueNotFoundText != undefined) {
					text = me.valueNotFoundText;
				}
			}

			me.lastSelectionText = text;

			if (me.hiddenField) {
				me.hiddenField.dom.value = Q.isDefined(value) ?
					value : '';
			}

			//ComboBox.superclass.prototype.setValue.call(me, text);
			me.callParent('setValue', [text]);

			me.value = value;
			return me;
		},

		findRecord: function(prop, value) {
			var record;
			if (this.store.getCount() > 0) {
				this.store.each(function(_, r) {
					if (r.data[prop] == value) {
						record = r;
						return false;
					}
				});
			}
			return record;
		},

		onViewMove: function(e) {
			this.inKeyMode = false;
		},

		onViewOver: function(e) {
			if (this.inKeyMode) {
				return;
			}
			var item = this.view.findItemFromChild(e.target);
			if (item) {
				var index = this.view.indexOf(item);
				this.select(index, false);
			}
		},

		onViewClick: function(doFocus) {
			var index = this.view.getSelectedIndexes()[0],
				s = this.store,
				r = s.getAt(index);

			if (r) {
				this.onSelect(r, index);
			} else {
				this.collapse();
			}
			if (doFocus !== false) {
				this.el.focus();
			}
		},

		restrictHeight: function() {
			this.innerList.dom.style.height = '';

			var me = this,
				doc = this.getDoc(),
				win = doc.defaultView || doc.parentWindow,
				docElem = doc.documentElement,
				body = doc.body,
				inner = me.innerList.dom,
				pad = me.list.getFrameWidth('top bottom') + (me.resizable ? me.handleHeight : 0) + me.assetHeight,
				h = Math.max(inner.clientHeight, inner.offsetHeight, inner.scrollHeight),
				ha = me.el.offset().top - me.getBody().scrollTop,
				hb = Math.max(docElem.clientHeight, body.clientHeight) - ha - me.getResizeEl().outerHeight(true),
				space = Math.max(ha, hb, me.minHeight || 0) - pad - 5;

			h = Math.min(h, space, me.maxHeight);

			me.innerList.outerHeight(true, h);
			me.list.beginUpdate();
			me.list.outerHeight(true, h + pad);
			me.list.alignTo(this.wrap, me.listAlign);
			me.list.endUpdate();
		},

		isExpanded: function() {
			return this.list && this.list.isVisible();
		},

		selectByValue: function(v, scrollIntoView) {
			if (!Q.isUndefined(v)) {
				var r = this.findRecord(this.valueField || this.displayField, v);
				if (r) {
					this.select(this.store.indexOf(r), scrollIntoView);
					return true;
				}
			}
			return false;
		},

		select: function(index, scrollIntoView) {
			this.selectedIndex = index;
			this.view.select(index);
			if (scrollIntoView !== false) {
				var el = this.view.getNode(index);
				if (el) {
					//this.innerList.scrollChildIntoView(el, false);
				}
			}

		},

		selectNext: function() {
			var ct = this.store.getCount();
			if (ct > 0) {
				if (this.selectedIndex == -1) {
					this.select(0);
				} else if (this.selectedIndex < ct - 1) {
					this.select(this.selectedIndex + 1);
				}
			}
		},

		// private
		selectPrev: function() {
			var ct = this.store.getCount();
			if (ct > 0) {
				if (this.selectedIndex == -1) {
					this.select(0);
				} else if (this.selectedIndex !== 0) {
					this.select(this.selectedIndex - 1);
				}
			}
		},

		onKeyUp: function(e) {
			var k = e.which;
			if (this.editable !== false && this.readOnly !== true && (k == 8 /*BACKSPACE*/ || !(
					(k >= 16 && k <= 20) || // Shift, Ctrl, Alt, Pause, Caps Lock
					(k >= 44 && k <= 46) // Print Screen, Insert, Delete
				))) {
				this.lastKey = k;
				this.dqTask.delay(this.queryDelay);
			}
			this.callParent(arguments);
		},

		validateBlur: function() {
			return !this.list || !this.list.isVisible();
		},

		initQuery: function() {
			this.doQuery(this.getRawValue());
		},

		// private
		beforeBlur: function() {
			this.assertValue();
		},

		// private
		postBlur: function() {
			this.callParent(arguments);
			this.collapse();
			this.inKeyMode = false;
		},

		doQuery: function(q, forceAll) {
			q = Q.isUndefined(q) ? '' : q;

			var qe = {
				query: q,
				forceAll: forceAll,
				combo: this,
				cancel: false
			};

			if (this.fire('beforequery', qe) === false || qe.cancel) {
				return false;
			}

			q = qe.query;
			forceAll = qe.forceAll;

			if (forceAll === true || (q.length >= this.minChars)) {
				if (this.lastQuery !== q) {
					this.lastQuery = q;
					if (this.mode == 'local') {
						this.selectedIndex = -1;
						this.store.clearFilter();
						if (!forceAll) {
							this.store.filter(this.displayField, q);
						}
						this.onLoad();
					} else {
						this.store.baseParams[this.queryParam] = q;
						this.store.load({
							params: this.getParams(q)
						});
						this.expand();
					}
				} else {
					this.selectedIndex = -1;
					this.onLoad();
				}
			}
		},

		getParams: function(q) {
			var params = {},
				paramNames = this.store.paramNames;
			if (this.pageSize) {
				params[paramNames.start] = 0;
				params[paramNames.limit] = this.pageSize;
			}
			return params;
		},

		/**
		 * Hides the dropdown list if it is currently expanded. Fires the {@link #collapse} event on completion.
		 */
		collapse: function() {
			var doc;
			if (!this.isExpanded()) {
				return;
			}
			this.list.hide();

			this.getBody(true).off('mousedown', this.collapseIf, this)
			this.fire('collapse', this);
		},

		collapseIf: function(e) {
			if (!this.isDestroyed && !Q.Element.contains(this.wrap.dom, e.target) && !Q.Element.contains(this.list.dom, e.target)) {
				this.collapse();
			}
		},

		expand: function() {
			var me = this;

			if (me.isExpanded() || !me.hasFocus) {
				return;
			}

			me.list.show();

			if (me.title || me.pageSize) {
				me.assetHeight = 0;
				if (me.title) {
					me.assetHeight += me.header.outerHeight(true);
				}
				if (me.pageSize) {
					me.assetHeight += me.footer.outerHeight(true);
				}
			}

			if (me.bufferSize) {
				me.doResize(me.bufferSize);
				delete me.bufferSize;
			}

			me.list.alignTo(me.wrap, me.listAlign);

			// zindex can change, re-check it and set it if necessary
			me.list.setZIndex(me.getZIndex());

			me.getBody(true).on('mousedown', me.collapseIf, me);

			me.fire('expand', me);
		},

		onTriggerClick: function(e) {
			var me = this;

			if (me.readOnly || me.disabled) {
				return;
			}
			e.stopPropagation();

			if (me.isExpanded()) {
				me.collapse();
				me.el.dom.focus();
			} else {
				me.onFocus();
				if (me.triggerAction == 'all') {
					me.doQuery(me.allQuery, true);
				} else if (me.triggerAction == 'query') {
					me.doQuery(me.getRawValue());
				}
			}
		}


	});

	return ComboBox;
});