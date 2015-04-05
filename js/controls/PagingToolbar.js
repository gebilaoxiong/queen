define([
	'controls/Toolbar',
	'data/StoreManager',
	'form/NumberField'
], function(Toolbar, StoreManager, NumberField) {

	var PagingToolbar, T;

	T = Toolbar;

	PagingToolbar = Q.Class.define(Toolbar, {

		pageSize: 20,

		displayInfo: false,

		displayMsg: '显示 {0} - {1}条，共 {2} 条',

		emptyMsg: '没有数据',

		beforePageText: '第',

		afterPageText: '页,共 {0} 页',

		firstText: '第一页',

		prevText: '上一页',

		nextText: '下一页',

		lastText: '最后页',

		refreshText: '刷新',

		configuration: function() {
			this.callParent(arguments);


			if (this.afterPageText && Q.isString(this.afterPageText)) {
				this.afterPageText = Q.String.format(this.afterPageText);
			}

			if (this.displayMsg && Q.isString(this.displayMsg)) {
				this.displayMsg = Q.String.format(this.displayMsg);
			}
		},

		initComponent: function() {
			var pagingItems, userItems;


			pagingItems = [

				/*第一页*/
				this.first = new T.Button({
					tooltip: this.firstText,
					overflowText: this.firstText,
					iconCls: 'x-tbar-page-first',
					disabled: true,
					handler: this.moveFirst,
					scope: this
				}),

				/*上一页*/
				this.prev = new T.Button({
					tooltip: this.prevText,
					overflowText: this.prevText,
					iconCls: 'x-tbar-page-prev',
					disabled: true,
					handler: this.movePrevious,
					scope: this
				}),

				'-',

				this.beforePageText,

				/*选择页 输入框*/
				this.inputItem = new NumberField({
					cls: 'x-tbar-page-number',
					allowDecimals: false,
					allowNegative: false,
					enableKeyEvents: true,
					selectOnFocus: true,
					submitValue: false,
					listeners: {
						scope: this,
						keydown: this.onPagingKeyDown,
						blur: this.onPagingBlur
					}
				}),


				/*总计页数*/
				this.afterTextItem = new T.TextItem({
					text: this.afterPageText(1)
				}),

				'-',

				/*下一页*/
				this.next = new T.Button({
					tooltip: this.nextText,
					overflowText: this.nextText,
					iconCls: 'x-tbar-page-next',
					disabled: true,
					handler: this.moveNext,
					scope: this
				}),

				/*最后一页*/
				this.last = new T.Button({
					tooltip: this.lastText,
					overflowText: this.lastText,
					iconCls: 'x-tbar-page-last',
					disabled: true,
					handler: this.moveLast,
					scope: this
				}),

				'-',

				/*刷新*/
				this.refresh = new T.Button({
					tooltip: this.refreshText,
					overflowText: this.refreshText,
					iconCls: 'x-tbar-loading',
					handler: this.doRefresh,
					scope: this
				})
			];

			userItems = this.items || this.buttons || [];

			//确定用户定义的按钮放在前面
			if (this.prependButtons) {
				this.items = userItems.concat(pagingItems);
			} else {
				this.items = pagingItems.concat(userItems);
			}

			delete this.buttons;

			if (this.displayInfo) {
				this.items.push('->');
				this.items.push(this.displayItem = new T.TextItem({
					cls: 'x-tbar-page-display'
				}));
			}
			//调用父类方法
			this.callParent(arguments);

			this.bind('afterlayout', this.onFirstLayout, this, {
				single: true
			});

			this.cursor = 0;
			//绑定store
			this.bindStore(this.store, true);
		},

		onFirstLayout: function() {

			if (this.dsLoaded) {
				/*完成首次布局后 禁用一些按钮 并根据store信息更新文字*/
				this.onLoad.apply(this, this.dsLoaded);
			}
		},

		/*更新面板信息*/
		updateInfo: function() {
			if (this.displayItem) {
				var count = this.store.getCount(),

					msg = count == 0 ? this.emptyMsg :
					this.displayMsg(
						this.cursor + 1,
						this.cursor + count,
						this.store.getTotalCount());

				this.displayItem.setText(msg);
			}
		},

		onStoreOnLoad: function(e, store, record, o) {
			this.onLoad(store,record,o);
		},

		onLoad: function(store, record, o) {
			if (!this.rendered) {
				this.dsLoaded = [store, record, o];
				return;
			}

			var params, pageData, activePage, pageCount;

			params = this.getParams();
			this.cursor = (o.params && o.params[params.start]) ? o.params[params.start] : 0;
			pageData = this.getPageData();
			activePage = pageData.activePage;
			pageCount = pageData.pages;

			//共多少页
			this.afterTextItem.setText(this.afterPageText(pageData.pages));
			this.inputItem.setValue(activePage);

			//第一页按钮
			this.first.setDisabled(activePage == 1);
			//上一页
			this.prev.setDisabled(activePage == 1);
			//下一页
			this.next.setDisabled(activePage == pageCount);
			//最后一页
			this.last.setDisabled(activePage == pageCount);

			//开启刷新按钮
			this.refresh.enable();
			this.updateInfo();

			this.fire('change', this, pageData);
		},

		/*根据store计算信息*/
		getPageData: function() {
			var total = this.store.getTotalCount();

			return {
				/*总共的数据量*/
				total: total,
				/*当前页码*/
				activePage: Math.ceil((this.cursor + this.pageSize) / this.pageSize),
				/*共多少页*/
				pages: total < this.pageSize ? 1 : Math.ceil(total / this.pageSize)
			};
		},

		changePage: function(page) {
			Q.Number.constrain(this.doLoad(((page - 1) * this.pageSize), 0, this.store.getTotalCount()));
		},

		onLoadError: function() {
			if (!this.rendered) {
				return;
			}
			this.refresh.enable();
		},

		readPage: function(pageData) {
			var v = this.inputItem.getValue(),
				pageNum;

			if (!v || isNaN(pageNum = parseInt(v, 10))) {

				this.inputItem.setValue(pageData.activePage);

				return false;
			}

			return pageNum;
		},

		onPagingFocus: function() {
			this.inputItem.select();
		},

		//private
		onPagingBlur: function(e) {
			this.inputItem.setValue(this.getPageData().activePage);
		},

		onPagingKeyDown: function(field, e) {
			var k = e.which,
				pageData = this.getPageData(),
				pageNum;

			if (k == 13) { //RETURN

				e.stopPropagation();
				e.preventDefault();

				pageNum = this.readPage(pageData);

				if (pageNum !== false) {
					pageNum = Math.min(Math.max(1, pageNum), pageData.pages) - 1;
					this.doLoad(pageNum * this.pageSize);
				}

			} else if (k == 36 || k == 35) { //HOME|END

				e.stopPropagation();
				e.preventDefault();

				pageNum = k == e.HOME ? 1 : pageData.pages;
				field.setValue(pageNum);

			} else if (k == 38 || k == 33 || k == 40 || k == 34) { //UP|PAGEUP|DOWN|PAGEDOWN

				e.stopPropagation();
				e.preventDefault();

				if ((pageNum = this.readPage(pageData))) {
					var increment = e.shiftKey ? 10 : 1;
					if (k == e.DOWN || k == e.PAGEDOWN) {
						increment *= -1;
					}
					pageNum += increment;
					if (pageNum >= 1 & pageNum <= pageData.pages) {
						field.setValue(pageNum);
					}
				}

			}
		},
		getParams: function() {
			return this.paramNames || this.store.paramNames;
		},

		beforeLoad: function() {
			if (this.rendered && this.refresh) {
				this.refresh.disable();
			}
		},

		doLoad: function(start) {
			var params = {},
				pn = this.getParams();
			params[pn.start] = start;
			params[pn.limit] = this.pageSize;

			if (this.fire('beforechange', this, params) !== false) {
				this.store.load({
					params: params
				});
			}
		},

		/*蹦到第一页*/
		moveFirst: function() {
			this.doLoad(0);
		},
		/*蹦到上一页*/
		movePrevious: function() {
			this.doLoad(Math.max(0, this.cursor - this.pageSize));
		},
		/*蹦到下一页*/
		moveNext: function() {
			this.doLoad(this.cursor + this.pageSize);
		},
		/*蹦到最后一页*/
		moveLast: function() {
			var total = this.store.getTotalCount(),
				extra = total % this.pageSize;

			this.doLoad(extra ? (total - extra) : total - this.pageSize);
		},
		doRefresh: function() {
			this.doLoad(this.cursor);
		},

		bindStore: function(store, initial) {
			var doLoad;

			if (!initial && this.store) {

				if (store !== this.store && this.store.autoDestroy) {
					this.store.destroy();
				} else {
					this.store.unbind('beforeload', this.beforeLoad, this);
					this.store.unbind('load', this.onStoreOnLoad, this);
					this.store.unbind('exception', this.onLoadError, this);
				}
				if (!store) {
					this.store = null;
				}
			}


			if (store) {
				store = StoreManager.lookup(store);

				store.bind({
					scope: this,
					beforeload: this.beforeLoad,
					load: this.onStoreOnLoad,
					exception: this.onLoadError
				});

				doLoad = true;
			}

			this.store = store;

			if (doLoad) {
				this.onLoad(store, null, {});
			}
		},

		beforeDestroy: function() {
			this.displayMsg = this.afterPageText = null;
			this.callParent(arguments);
		},

		onDestroy: function() {
			this.bindStore(null);
			this.callParent(arguments);
		}

	});

	return PagingToolbar;
});