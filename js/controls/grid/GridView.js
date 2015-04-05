define([
	'util/Observable',
	'util/Template',
	'util/Timer',
	'util/Region',
	'dd/DDProxy',
	'menu/Menu',
	'menu/CheckItem',
	'menu/Separator',
	'controls/QuickTips'
], function(Observable, Template, Timer, Region, DDProxy, Menu, CheckItem, Separator, QuickTips /*, HeaderDropZone, GridDragZone*/ ) {

	var GridView = Q.Class.define(Observable, {

		type: 'GridView',

		/*True将会延迟应用 emptyText ，直到store第一次被加载(默认为true). */
		deferEmptyText: true,

		/*为垂直滚动条保留的空间大小 (默认为undefined)。如果没有显式指定一个值， 此值将会被自动计算。*/
		scrollOffset: undefined,

		/*默认为 false. 指定为true，当表格开始被渲染之后将会重新计算列宽度比例*/
		autoFill: false,

		/*默认为false. 指定为true将会让列宽度总是保持比例。*/
		forceFit: false,

		/*当排序之后应用到头部的CSS类*/
		sortClasses: ['sort-asc', 'sort-desc'],

		sortAscText: '正序',

		sortDescText: '倒序',

		hideSortIcons: false,

		/*显示在'Columns'菜单项中的文本(默认为'Columns') */
		columnsText: '显示',

		/*选中行样式*/
		selectedRowClass: 'x-grid-row-selected',


		borderWidth: 2,
		tdClass: 'x-grid-cell',
		hdCls: 'x-grid-hd',

		/*是否标记被更改的单元格*/
		markDirty: true,

		cellSelector: 'td.x-grid-cell',

		rowSelector: 'div.x-grid-row',

		rowBodySelector: 'div.x-grid-row-body',

		firstRowCls: 'x-grid-row-first',
		lastRowCls: 'x-grid-row-last',
		rowClsRe: /(?:^|\s+)x-grid-row-(first|last|alt)(?:\s+|$)/g,

		headerMenuOpenCls: 'x-grid-hd-menu-open',

		/*鼠标hover行*/
		rowOverCls: 'x-grid-row-over',

		init: function(config) {
			Q.extend(this, config);

			this.callParent(arguments);
		},

		/* -------------------------------- UI Specific ----------------------------- */
		/*
			主模板
			ostyle:header容器样式
			header
			bstyle:grid容器样式
			body
		*/
		masterTpl: new Template({
			tmpl: [
				'<div class="x-grid" hidefocus="true">',
				'<div class="x-grid-viewport">',
				'<div class="x-grid-header clearfix">',
				'<div class="x-grid-header-inner">',
				'<div class="x-grid-header-offset" style="<%=ostyle%>"><%=header%></div>',
				'</div>',
				'</div>',
				'<div class="x-grid-scroller">',
				'<div class="x-grid-body" style="<%=bstyle%>"><%=body%></div>',
				'<a href="#" class="x-grid-focus" tabIndex="-1"></a>',
				'</div>',
				'</div>',
				'<div class="x-grid-resize-marker">&#160;</div>',
				'<div class="x-grid-resize-proxy">&#160;</div>',
				'</div>'
			].join(''),
			escape: false
		}),

		/*
			header模板
			tstyle
			cells
		*/
		headerTpl: new Template({
			tmpl: [
				'<table border="0" cellspacing="0" cellpadding="0" style="<%=tstyle%>">',
				'<thead>',
				'<tr class="x-grid-hd-row"><%=cells%></tr>',
				'</thead>',
				'</table>'
			].join(''),
			escape: false
		}),

		bodyTpl: new Template({
			tmpl: '<%=rows%>',
			escape: false
		}),

		/*
			单元格模板
			id
			css
			style
			cellAttr
			attr
			value
		*/
		cellTpl: new Template({
			tmpl: [
				'<td class="x-grid-col x-grid-cell x-grid-td-<%=id%> <%=css%>" style="<%=style%>" tabIndex="0" <%=cellAttr%>>',
				'<div class="x-grid-cell-inner x-grid-col-<%=id%> x-unselectable" unselectable="on" <%=attr%>><%=value%></div>',
				'</td>'
			].join(''),
			escape: false
		}),

		initTemplates: function() {
			var templates = this.templates || {},
				template, name,

				/*
					id
					css
					style
					tooltip
					istyle
					value
				*/
				headerCellTpl = new Template({
					tmpl: [
						'<td class="x-grid-hd x-grid-cell x-grid-td-<%=id%> <%=css%>" style="<%=style%>">',
						'<div <%=tooltip%> class="x-grid-hd-inner x-grid-hd-<%=id%>" unselectable="on" style="<%=istyle%>">',
						this.grid.enableHdMenu ? '<span class="x-grid-hd-btn" href="#"></span>' : '',
						'<span class="x-column-header-text"><%=value%></span>',
						'</div>',
						'</td>'
					].join(''),
					escape: false
				}),

				/*
					bodyStyle
					cols
					body
				*/
				rowBodyText = [
					'<tr class="x-grid-row-body-tr" style="<%=bodyStyle%>">',
					'<td colspan="<%=cols%>" class="x-grid-body-cell" tabIndex="0" hidefocus="on">',
					'<div class="x-grid-row-body"><%=body%></div>',
					'</td>',
					'</tr>'
				].join(""),

				/*
					tstyle
					cells
				*/
				innerText = [
					'<table class="x-grid-row-table" border="0" cellspacing="0" cellpadding="0" style="<%=tstyle%>">',
					'<tbody>',
					'<tr><%=cells%></tr>',
					this.enableRowBody ? rowBodyText : '',
					'</tbody>',
					'</table>'
				].join("");

			Q.applyIf(templates, {
				hcell: headerCellTpl,
				cell: this.cellTpl,
				body: this.bodyTpl,
				header: this.headerTpl,
				master: this.masterTpl,
				row: new Template({
					tmpl: '<div class="x-grid-row <%=alt%>" style="<%=tstyle%>">' + innerText + '</div>',
					escape: false
				}),
				rowInner: new Template({
					tmpl: innerText,
					escape: false
				})
			});

			this.templates = templates;
			this.colRe = new RegExp('x-grid-td-([^\\s]+)', '');
		},

		fly: function(el) {
			if (!this._flyweight) {
				this._flyweight = new Q.Element(document.body);
			}
			this._flyweight.dom = el;
			return this._flyweight;
		},

		getEditorParent: function() {
			return this.scroller.dom;
		},

		initElements: function() {
			var Element = Q.Element,
				el = Q.get(this.grid.getGridEl().dom.firstChild),
				mainWrap = Q.get('div.x-grid-viewport', el.dom),
				mainHd = Q.get('div.x-grid-header', mainWrap.dom),
				scroller = Q.get('div.x-grid-scroller', mainWrap.dom);

			if (this.grid.hideHeaders) {
				mainHd.hide();
			}

			if (this.forceFit) {
				scroller.css('overflow-x', 'hidden');
			}

			Q.extend(this, {
				el: el,
				mainWrap: mainWrap,
				scroller: scroller,
				mainHd: mainHd,
				innerHd: mainHd.child('div.x-grid-header-inner').dom,
				mainBody: scroller.child('div.x-grid-body'),
				focusEl: scroller.child('a'),

				resizeMarker: el.child('div.x-grid-resize-marker'),
				resizeProxy: el.child('div.x-grid-resize-proxy')
			});

			this.focusEl.swallowEvent('click', true);
		},

		getRows: function() {
			return this.hasRows() ? this.mainBody.dom.childNodes : [];
		},

		findCell: function(el) {
			if (!el) {
				return false;
			}
			return Q.Element.parentUntil(el, this.cellSelector);
		},

		findCellIndex: function(el, requiredCls) {
			var cell = this.findCell(el),
				hasCls;

			if (cell) {
				hasCls = this.fly(cell).hasClass(requiredCls);
				if (!requiredCls || hasCls) {
					return this.getCellIndex(cell);
				}
			}
			return false;
		},

		getCellIndex: function(el) {
			var match;
			if (el) {
				match = el.className.match(this.colRe);

				if (match && match[1]) {
					return this.cm.getIndexById(match[1]);
				}
			}
			return false;
		},

		findHeaderCell: function(el) {
			var cell = this.findCell(el);
			return cell && this.fly(cell).hasClass(this.hdCls) ? cell : null;
		},

		// private
		findHeaderIndex: function(el) {
			return this.findCellIndex(el, this.hdCls);
		},

		findRow: function(el) {
			if (!el) {
				return false;
			}
			return Q.Element.parentUntil(el, this.rowSelector);
		},

		findRowIndex: function(el) {
			var row = this.findRow(el);
			return row ? row.rowIndex : false;
		},

		findRowBody: function(el) {
			if (!el) {
				return false;
			}

			return Q.Element.parentUntil(el, this.rowBodySelector);
		},

		getRow: function(row) {
			return this.getRows()[row];
		},

		getCell: function(row, col) {
			return Q.dom.find(this.cellSelector, this.getRow(row)).get(col);
		},

		getHeaderCell: function(index) {
			return this.mainHd.dom.getElementsByTagName('td')[index];
		},

		addRowClass: function(rowId, cls) {
			var row = this.getRow(rowId);
			if (row) {
				this.fly(row).addClass(cls);
			}
		},
		removeRowClass: function(row, cls) {
			var r = this.getRow(row);
			if (r) {
				this.fly(r).removeClass(cls);
			}
		},
		removeRow: function(row) {
			Q.Element.remove(row);
			this.syncFocusEl(row);
		},

		removeRows: function(firstRow, lastRow) {
			var bd = this.mainBody.dom,
				rowIndex;

			for (rowIndex = firstRow; rowIndex <= lastRow; rowIndex++) {
				Q.Element.remove(bd.childNodes[firstRow]);
			}

			this.syncFocusEl(firstRow);
		},

		/* ----------------------------------- Scrolling functions -------------------------------------------*/
		getScrollState: function() {
			var sb = this.scroller.dom;

			return {
				left: sb.scrollLeft,
				top: sb.scrollTop
			};
		},

		restoreScroll: function(state) {
			var sb = this.scroller.dom;
			sb.scrollLeft = state.left;
			sb.scrollTop = state.top;
		},

		scrollToTop: function() {
			var dom = this.scroller.dom;

			dom.scrollTop = 0;
			dom.scrollLeft = 0;
		},

		syncScroll: function() {
			this.syncHeaderScroll();
			var mb = this.scroller.dom;
			this.grid.fire('bodyscroll', mb.scrollLeft, mb.scrollTop);
		},

		// private
		syncHeaderScroll: function() {
			var innerHd = this.innerHd,
				scrollLeft = this.scroller.dom.scrollLeft;

			innerHd.scrollLeft = scrollLeft;
			innerHd.scrollLeft = scrollLeft; // second time for IE (1/2 time first fails, other browsers ignore)
		},

		updateSortIcon: function(col, dir) {
			var sortClasses = this.sortClasses.join(' '),
				sortClass = this.sortClasses[dir == "DESC" ? 1 : 0],
				headers = Q.dom.find('td', this.mainHd.dom);

			//移除所有列头部的排序class
			headers.each(function() {
				Q.Element.removeClass(this, sortClasses);
			});

			Q.Element.addClass(headers.get(col), sortClass);
		},

		updateAllColumnWidths: function() {
			var totalWidth = this.getTotalWidth(),
				colCount = this.cm.getColumnCount(),
				rows = this.getRows(),
				rowCount = rows.length,
				widths = [],
				row, rowFirstChild, trow, i, j;

			for (i = 0; i < colCount; i++) {
				widths[i] = this.getColumnWidth(i);
				this.getHeaderCell(i).style.width = widths[i];
			}

			this.updateHeaderWidth();

			for (i = 0; i < rowCount; i++) {
				row = rows[i];
				row.style.width = totalWidth;
				rowFirstChild = row.firstChild;

				if (rowFirstChild) {
					rowFirstChild.style.width = totalWidth;
					trow = rowFirstChild.rows[0];

					for (j = 0; j < colCount; j++) {
						trow.childNodes[j].style.width = widths[j];
					}
				}
			}

			this.onAllColumnWidthsUpdated(widths, totalWidth);
		},

		updateColumnWidth: function(column, width) {
			var columnWidth = this.getColumnWidth(column),
				totalWidth = this.getTotalWidth(),
				headerCell = this.getHeaderCell(column),
				nodes = this.getRows(),
				nodeCount = nodes.length,
				row, i, firstChild;

			this.updateHeaderWidth();
			headerCell.style.width = columnWidth;

			for (i = 0; i < nodeCount; i++) {
				row = nodes[i];
				firstChild = row.firstChild;

				row.style.width = totalWidth;
				if (firstChild) {
					firstChild.style.width = totalWidth;
					firstChild.rows[0].childNodes[column].style.width = columnWidth;
				}
			}

			this.onColumnWidthUpdated(column, columnWidth, totalWidth);
		},

		updateColumnHidden: function(col, hidden) {
			var totalWidth = this.getTotalWidth(),
				display = hidden ? 'none' : '',
				headerCell = this.getHeaderCell(col),
				nodes = this.getRows(),
				nodeCount = nodes.length,
				row, rowFirstChild, i;

			this.updateHeaderWidth();
			headerCell.style.display = display;

			for (i = 0; i < nodeCount; i++) {
				row = nodes[i];
				row.style.width = totalWidth;
				rowFirstChild = row.firstChild;

				if (rowFirstChild) {
					rowFirstChild.style.width = totalWidth;
					rowFirstChild.rows[0].childNodes[col].style.display = display;
				}
			}

			this.onColumnHiddenUpdated(col, hidden, totalWidth);
			delete this.lastViewWidth; //recalc
			this.layout();
		},

		doRender: function(columns, records, store, startRow, colCount, stripe) {
			var templates = this.templates,
				cellTemplate = templates.cell,
				rowTemplate = templates.row,
				last = colCount - 1,
				tstyle = 'width:' + this.getTotalWidth() + ';',
				// buffers
				rowBuffer = [],
				colBuffer = [],
				rowParams = {
					tstyle: tstyle
				},
				meta = {},
				len = records.length,
				alt,
				column,
				record, i, j, rowIndex;

			//build up each row's HTML
			for (j = 0; j < len; j++) {
				record = records[j];
				colBuffer = [];

				rowIndex = j + startRow;

				//build up each column's HTML
				for (i = 0; i < colCount; i++) {
					column = columns[i];

					meta.id = column.id;
					meta.css = i === 0 ? 'x-grid-cell-first ' : (i == last ? 'x-grid-cell-last ' : '');
					meta.attr = meta.cellAttr = '';
					meta.style = column.style;
					meta.value = column.renderer.call(column.scope, record.data[column.name], meta, record, rowIndex, i, store);

					if (Q.isUndefined(meta.value)) {
						meta.value = '&#160;';
					}

					if (this.markDirty && record.dirty && typeof record.modified[column.name] != 'undefined') {
						meta.css += ' x-grid-dirty-cell';
					}

					colBuffer[colBuffer.length] = cellTemplate.compile(meta);
				}

				alt = [];
				//set up row striping and row dirtiness CSS classes
				if (stripe && ((rowIndex + 1) % 2 === 0)) {
					alt[0] = 'x-grid-row-alt';
				}

				if (record.dirty) {
					alt[1] = ' x-grid-dirty-row';
				}

				rowParams.cols = colCount;

				if (this.getRowClass) {
					alt[2] = this.getRowClass(record, rowIndex, rowParams, store);
				}

				rowParams.alt = alt.join(' ');
				rowParams.cells = colBuffer.join('');

				rowBuffer[rowBuffer.length] = rowTemplate.compile(rowParams);
			}

			return rowBuffer.join('');
		},

		processRows: function(startRow, skipStripe) {
			if (!this.ds || this.ds.getCount() < 1) {
				return;
			}

			var rows = this.getRows(),
				length = rows.length,
				row, i;

			skipStripe = skipStripe || !this.grid.stripeRows;
			startRow = startRow || 0;

			for (i = 0; i < length; i++) {
				row = rows[i];
				if (row) {
					row.rowIndex = i;
					if (!skipStripe) {
						row.className = row.className.replace(this.rowClsRe, ' ');
						if ((i + 1) % 2 === 0) {
							row.className += ' x-grid-row-alt';
						}
					}
				}
			}

			// add first/last-row classes
			if (startRow === 0) {
				Q.Element.addClass(rows[0], this.firstRowCls);
			}

			Q.Element.addClass(rows[length - 1], this.lastRowCls);
		},

		afterRender: function() {
			if (!this.ds || !this.cm) {
				return;
			}

			this.mainBody.dom.innerHTML = this.renderBody() || '&#160;';
			this.processRows(0, true);

			if (this.deferEmptyText !== true) {
				this.applyEmptyText();
			}

			this.grid.fire('viewready', this.grid);
		},

		afterRenderUI: function() {
			var grid = this.grid;

			this.initElements();

			// get mousedowns early
			Q.Element.on(this.innerHd, 'click', this.handleHdDown, this);

			this.mainHd.on('mouseover', this.handleHdOver, this);
			this.mainHd.on('mouseout', this.handleHdOut, this);
			this.mainHd.on('mousemove', this.handleHdMove, this);

			this.scroller.on('scroll', this.syncScroll, this);

			if (grid.enableColumnResize !== false) {
				this.splitZone = new GridView.SplitDragZone(grid, this.mainHd.dom);
			}
			/*
			if (grid.enableColumnMove) {
				this.columnDrag = new GridView.ColumnDragZone(grid, this.innerHd);
				this.columnDrop = new HeaderDropZone(grid, this.mainHd.dom);
			}
			*/

			if (grid.enableHdMenu !== false) {
				//列菜单
				this.hmenu = new Menu({
					id: grid.id + '-hctx'
				});

				this.hmenu.add({
					itemId: 'asc',
					text: this.sortAscText,
					cls: 'xg-hmenu-sort-asc'
				}, {
					itemId: 'desc',
					text: this.sortDescText,
					cls: 'xg-hmenu-sort-desc'
				});

				if (grid.enableColumnHide !== false) {

					this.colMenu = new Menu({
						id: grid.id + '-hcols-menu'
					});

					this.colMenu.bind({
						scope: this,
						beforeshow: this.beforeColMenuShow,
						itemclick: this.handleHdMenuClick
					});

					this.hmenu.add({
						itemId: 'sortSep',
						xtype: Separator
					}, {
						itemId: 'columns',
						hideOnClick: false,
						text: this.columnsText,
						menu: this.colMenu,
						iconCls: 'x-cols-icon'
					});
				}

				this.hmenu.bind('itemclick', this.handleHdMenuClick, this);
			}

			if (grid.trackMouseOver) {
				this.mainBody.on('mouseover', this.onRowOver, this);
				this.mainBody.on('mouseout', this.onRowOut, this);
			}

			/*
			if (grid.enableDragDrop || grid.enableDrag) {
				this.dragZone = new GridDragZone(grid, {
					ddGroup: grid.ddGroup || 'GridDD'
				});
			}
			*/

			this.updateHeaderSortState();
		},

		renderUI: function() {
			var templates = this.templates;

			return templates.master.compile({
				body: templates.body.compile({
					rows: '&#160;'
				}),
				header: this.renderHeaders(),
				ostyle: 'width:' + this.getOffsetWidth() + ';',
				bstyle: 'width:' + this.getTotalWidth() + ';'
			});
		},

		processEvent: function(name, e) {
			var target = e.target,
				grid = this.grid,
				header = this.findHeaderIndex(target),
				row, cell, col, body;

			grid.fire(name, e);

			if (header !== false) {
				grid.fire('header' + name, grid, header, e);
			} else {
				row = this.findRowIndex(target);

				if (row !== false) {

					cell = this.findCellIndex(target);

					if (cell !== false) {
						col = grid.colModel.getColumnAt(cell);

						if (grid.fire('cell' + name, grid, row, cell, e) !== false) {
							if (!col || (col.processEvent && (col.processEvent(name, e, grid, row, cell) !== false))) {
								grid.fire('row' + name, grid, row, e);
							}
						}

					} else {
						if (grid.fire('row' + name, grid, row, e) !== false) {
							(body = this.findRowBody(target)) && grid.fire('rowbody' + name, grid, row, e);
						}
					}
				} else {
					grid.fire('container' + name, grid, e);
				}
			}
		},

		layout: function(initial) {
			if (!this.mainBody) {
				return; // not rendered
			}
			var grid = this.grid,
				gridEl = grid.getGridEl(),
				gridWidth = gridEl.width(),
				gridHeight = gridEl.height(),
				scroller = this.scroller,
				scrollStyle, headerHeight, scrollHeight;


			if (gridWidth < 20 || gridHeight < 20) {
				return;
			}

			if (grid.autoHeight) {
				scrollStyle = scroller.dom.style;
				scrollStyle.overflow = 'visible';

				if (!Q.Browser.ie) {
					scrollStyle.position = 'static';
				}
			} else {
				this.el.outerWidth(false, gridWidth);
				this.el.outerHeight(false, gridHeight);

				headerHeight = this.mainHd.outerHeight(true);
				scrollHeight = gridHeight - headerHeight;

				scroller.outerWidth(false, gridWidth);
				scroller.outerHeight(false, scrollHeight);

				if (this.innerHd) {
					this.innerHd.style.width = (gridWidth) + "px";
				}
			}

			//强制维持现有比例 或者是autoFill初始化的时候
			if (this.forceFit || (initial === true && this.autoFill)) {
				if (this.lastViewWidth != gridWidth) {
					this.fitColumns(false, false);
					this.lastViewWidth = gridWidth;
				}
			} else {
				this.autoExpand();
				this.syncHeaderScroll();
			}

			this.onLayout(gridWidth, scrollHeight);
		},

		onLayout: Q.noop,

		onColumnWidthUpdated: Q.noop,

		onAllColumnWidthsUpdated: Q.noop,

		onColumnHiddenUpdated: Q.noop,

		updateColumnText: Q.noop,

		afterMove: Q.noop,

		/* ----------------------------------- Core Specific -------------------------------------------*/

		initialize: function(grid) {
			this.grid = grid;

			this.initTemplates();
			this.initData(grid.store, grid.colModel);
			this.initUI(grid);
		},

		getColumnId: function(index) {
			return this.cm.getColumnId(index);
		},

		// private
		getOffsetWidth: function() {
			return (this.cm.getTotalWidth() + this.getScrollOffset()) + 'px';
		},

		// private
		getScrollOffset: function() {
			return Q.isNumber(this.scrollOffset) ? this.scrollOffset : 20;
		},

		renderHeaders: function() {
			var colModel = this.cm,
				templates = this.templates,
				headerTpl = templates.hcell,
				properties = {},
				colCount = colModel.getColumnCount(),
				last = colCount - 1,
				cells = [],
				i, cssCls;

			for (i = 0; i < colCount; i++) {
				if (i == 0) {
					cssCls = 'x-grid-cell-first ';
				} else {
					cssCls = i == last ? 'x-grid-cell-last ' : '';
				}

				properties = {
					id: colModel.getColumnId(i),
					value: colModel.getColumnHeader(i) || '',
					style: this.getColumnStyle(i, true),
					css: cssCls,
					tooltip: this.getColumnTooltip(i)
				};

				if (colModel.config[i].align == 'right') {
					properties.istyle = 'padding-right: 16px;';
				} else {
					properties.istyle = '';
				}

				cells[i] = headerTpl.compile(properties);
			}


			return templates.header.compile({
				cells: cells.join(""),
				tstyle: 'width:' + this.getTotalWidth() + ';'
			});
		},

		getColumnTooltip: function(i) {
			var tooltip = this.cm.getColumnTooltip(i);

			if (tooltip) {
				if (QuickTips.isEnabled()) {
					return 'ext:qtip="' + tooltip + '"';
				} else {
					return 'title="' + tooltip + '"';
				}
			}

			return '';
		},

		beforeUpdate: function() {
			this.grid.stopEditing(true);
		},

		updateHeaders: function() {
			this.innerHd.firstChild.innerHTML = this.renderHeaders();
			this.updateHeaderWidth(false);
		},

		updateHeaderWidth: function(updateMain) {
			var innerHdChild = this.innerHd.firstChild,
				totalWidth = this.getTotalWidth();

			innerHdChild.style.width = this.getOffsetWidth();
			innerHdChild.firstChild.style.width = totalWidth;

			if (updateMain !== false) {
				this.mainBody.dom.style.width = totalWidth;
			}
		},

		focusRow: function(row) {
			this.focusCell(row, 0, false);
		},

		focusCell: function(row, col, hscroll) {
			this.syncFocusEl(this.ensureVisible(row, col, hscroll));

			var focusEl = this.focusEl;

			if (Q.Browser.firfox) {
				focusEl.focus();
			} else {
				Q.delay(focusEl.focus, focusEl, 1);
			}
		},

		resolveCell: function(row, col, hscroll) {
			if (!Q.isNumber(row)) {
				row = row.rowIndex;
			}

			if (!this.ds) {
				return null;
			}

			if (row < 0 || row >= this.ds.getCount()) {
				return null;
			}
			col = (col !== undefined ? col : 0);

			var rowEl = this.getRow(row),
				colModel = this.cm,
				colCount = colModel.getColumnCount(),
				cellEl;

			if (!(hscroll === false && col === 0)) {
				while (col < colCount && colModel.isHidden(col)) {
					col++;
				}

				cellEl = this.getCell(row, col);
			}

			return {
				row: rowEl,
				cell: cellEl
			};
		},

		getResolvedXY: function(resolved) {
			if (!resolved) {
				return null;
			}

			var cell = resolved.cell,
				row = resolved.row;
			if (cell) {
				return Q.Element.offset(cell);
			} else {
				return {
					top: Q.Element.offset(row).top,
					left: this.el.offset().left
				};
			}
		},

		syncFocusEl: function(row, col, hscroll) {
			var xy = row;

			if (!Q.isObject(xy)) {
				row = Math.min(row, Math.max(0, this.getRows().length - 1));

				if (isNaN(row)) {
					return;
				}

				xy = this.getResolvedXY(this.resolveCell(row, col, hscroll));
			}

			this.focusEl.offset(xy || this.scroller.offset());
		},

		ensureVisible: function(row, col, hscroll) {
			var resolved = this.resolveCell(row, col, hscroll);

			if (!resolved || !resolved.row) {
				return null;
			}

			var rowEl = resolved.row,
				cellEl = resolved.cell,
				c = this.scroller.dom,
				p = rowEl,
				ctop = 0,
				stop = this.el.dom;

			while (p && p != stop) {
				ctop += p.offsetTop;
				p = p.offsetParent;
			}

			ctop -= this.mainHd.dom.offsetHeight;
			stop = parseInt(c.scrollTop, 10);

			var cbot = ctop + rowEl.offsetHeight,
				ch = c.clientHeight,
				sbot = stop + ch;


			if (ctop < stop) {
				c.scrollTop = ctop;
			} else if (cbot > sbot) {
				c.scrollTop = cbot - ch;
			}

			if (hscroll !== false) {
				var cleft = parseInt(cellEl.offsetLeft, 10),
					cright = cleft + cellEl.offsetWidth,
					sleft = parseInt(c.scrollLeft, 10),
					sright = sleft + c.clientWidth;

				if (cleft < sleft) {
					c.scrollLeft = cleft;
				} else if (cright > sright) {
					c.scrollLeft = cright - c.clientWidth;
				}
			}

			return this.getResolvedXY(resolved);
		},

		insertRows: function(dm, firstRow, lastRow, isUpdate) {
			var last = dm.getCount() - 1;

			if (!isUpdate && firstRow === 0 && lastRow >= last) {
				this.fire('beforerowsinserted', this, firstRow, lastRow);
				this.refresh();
				this.fire('rowsinserted', this, firstRow, lastRow);
			} else {
				if (!isUpdate) {
					this.fire('beforerowsinserted', this, firstRow, lastRow);
				}
				var html = this.renderRows(firstRow, lastRow),
					before = this.getRow(firstRow);
				if (before) {
					if (firstRow === 0) {
						Q.Element.removeClass(this.getRow(0), this.firstRowCls);
					}
					Q.Element.insertAjacentHTML(before, 'beforeBegin', html);
				} else {
					var r = this.getRow(last - 1);
					if (r) {
						Q.Element.removeClass(r, this.lastRowCls);
					}
					Q.Element.insertAjacentHTML(this.mainBody.dom, 'beforeEnd', html);
				}
				if (!isUpdate) {
					this.processRows(firstRow);
					this.fire('rowsinserted', this, firstRow, lastRow);
				} else if (firstRow === 0 || firstRow >= last) {
					Q.Element.addClass(this.getRow(firstRow),
						firstRow === 0 ? this.firstRowCls : this.lastRowCls);
				}
			}
			this.syncFocusEl(firstRow);
		},

		deleteRows: function(dm, firstRow, lastRow) {
			if (dm.getRowCount() < 1) {
				this.refresh();
			} else {
				this.fire('beforerowsdeleted', this, firstRow, lastRow);

				this.removeRows(firstRow, lastRow);

				this.processRows(firstRow);
				this.fire('rowsdeleted', this, firstRow, lastRow);
			}
		},

		getColumnStyle: function(colIndex, isHeader) {
			var colModel = this.cm,
				colConfig = colModel.config,
				style = isHeader ? '' : colConfig[colIndex].css || '',
				align = colConfig[colIndex].align;

			style += 'width:' + this.getColumnWidth(colIndex) + ';';

			if (colModel.isHidden(colIndex)) {
				style += 'display: none; ';
			}

			if (align) {
				style += "text-align:" + align;
			}

			return style;
		},

		getColumnWidth: function(column) {
			var columnWidth = this.cm.getColumnWidth(column),
				borderWidth = this.borderWidth;

			if (Q.isNumber(columnWidth)) {
				if (Q.support.boxSizing) {
					return columnWidth + "px";
				} else {
					return Math.max(columnWidth - borderWidth, 0) + "px";
				}
			} else {
				return columnWidth;
			}
		},

		getTotalWidth: function() {
			return this.cm.getTotalWidth() + 'px';
		},

		fitColumns: function(preventRefresh, onlyExpand, omitColumn) {
			var grid = this.grid,
				colModel = this.cm,
				totalColWidth = colModel.getTotalWidth(false),
				gridWidth = this.getGridInnerWidth(),
				extraWidth = gridWidth - totalColWidth,
				columns = [],
				extraCol = 0,
				width = 0,
				colWidth, fraction, i;

			// not initialized, so don't screw up the default widths
			if (gridWidth < 20 || extraWidth === 0) {
				return false;
			}

			var visibleColCount = colModel.getColumnCount(true),
				totalColCount = colModel.getColumnCount(false),
				adjCount = visibleColCount - (Q.isNumber(omitColumn) ? 1 : 0);

			if (adjCount === 0) {
				adjCount = 1;
				omitColumn = undefined;
			}

			//FIXME: the algorithm used here is odd and potentially confusing. Includes this for loop and the while after it.
			for (i = 0; i < totalColCount; i++) {
				if (!colModel.isFixed(i) && i !== omitColumn) {
					colWidth = colModel.getColumnWidth(i);
					columns.push(i, colWidth);

					if (!colModel.isHidden(i)) {
						extraCol = i;
						width += colWidth;
					}
				}
			}

			fraction = (gridWidth - colModel.getTotalWidth()) / width;

			while (columns.length) {
				colWidth = columns.pop();
				i = columns.pop();

				colModel.setColumnWidth(i, Math.max(grid.minColumnWidth, Math.floor(colWidth + colWidth * fraction)), true);
			}

			//this has been changed above so remeasure now
			totalColWidth = colModel.getTotalWidth(false);

			if (totalColWidth > gridWidth) {
				var adjustCol = (adjCount == visibleColCount) ? extraCol : omitColumn,
					newWidth = Math.max(1, colModel.getColumnWidth(adjustCol) - (totalColWidth - gridWidth));

				colModel.setColumnWidth(adjustCol, newWidth, true);
			}

			if (preventRefresh !== true) {
				this.updateAllColumnWidths();
			}

			return true;
		},

		autoExpand: function(preventUpdate) {
			var grid = this.grid,
				colModel = this.cm,
				gridWidth = this.getGridInnerWidth(),
				totalColumnWidth = colModel.getTotalWidth(false),
				autoExpandColumn = grid.autoExpandColumn;

			if (!this.userResized && autoExpandColumn) {
				if (gridWidth != totalColumnWidth) {
					//if we are not already using all available width, resize the autoExpandColumn
					var colIndex = colModel.getIndexById(autoExpandColumn);
					currentWidth = colModel.getColumnWidth(colIndex),
					desiredWidth = gridWidth - totalColumnWidth + currentWidth,
					newWidth = Math.min(Math.max(desiredWidth, grid.autoExpandMin), grid.autoExpandMax);

					if (currentWidth != newWidth) {
						colModel.setColumnWidth(colIndex, newWidth, true);

						if (preventUpdate !== true) {
							this.updateColumnWidth(colIndex, newWidth);
						}
					}
				}
			}
		},

		getGridInnerWidth: function() {
			return this.grid.getGridEl().width() - this.getScrollOffset();
		},

		getColumnData: function() {
			var columns = [],
				colModel = this.cm,
				colCount = colModel.getColumnCount(),
				fields = this.ds.fields,
				i, name;

			for (i = 0; i < colCount; i++) {
				name = colModel.getDataIndex(i);

				columns[i] = {
					name: name != undefined ? name : (fields.get(i) ? fields.get(i).name : undefined),
					renderer: colModel.getRenderer(i),
					scope: colModel.getRendererScope(i),
					id: colModel.getColumnId(i),
					style: this.getColumnStyle(i)
				};
			}

			return columns;
		},

		renderRows: function(startRow, endRow) {
			var grid = this.grid,
				store = grid.store,
				stripe = grid.stripeRows,
				colModel = grid.colModel,
				colCount = colModel.getColumnCount(),
				rowCount = store.getCount(),
				records;

			if (rowCount < 1) {
				return '';
			}

			startRow = startRow || 0;
			endRow = endRow != undefined ? endRow : rowCount - 1;
			records = store.getRange(startRow, endRow);

			return this.doRender(this.getColumnData(), records, store, startRow, colCount, stripe);
		},

		renderBody: function() {
			var markup = this.renderRows() || '&#160;';
			return this.templates.body.compile({
				rows: markup
			});
		},

		refreshRow: function(record) {
			var store = this.ds,
				colCount = this.cm.getColumnCount(),
				columns = this.getColumnData(),
				last = colCount - 1,
				cls = ['x-grid-row'],
				rowParams = {
					tstyle: 'width:' + this.getTotalWidth() + ';'
				},
				colBuffer = [],
				cellTpl = this.templates.cell,
				rowIndex, row, column, meta, css, i;

			if (Q.isNumber(record)) {
				rowIndex = record;
				record = store.getAt(rowIndex);
			} else {
				rowIndex = store.indexOf(record);
			}

			//the record could not be found
			if (!record || rowIndex < 0) {
				return;
			}

			//builds each column in this row
			for (i = 0; i < colCount; i++) {
				column = columns[i];

				if (i == 0) {
					css = 'x-grid-cell-first';
				} else {
					css = (i == last) ? 'x-grid-cell-last ' : '';
				}

				meta = {
					id: column.id,
					style: column.style,
					css: css,
					attr: "",
					cellAttr: ""
				};
				// Need to set this after, because we pass meta to the renderer
				meta.value = column.renderer.call(column.scope, record.data[column.name], meta, record, rowIndex, i, store);

				if (meta.value == undefined) {
					meta.value = '&#160;';
				}

				if (this.markDirty && record.dirty && typeof record.modified[column.name] != 'undefined') {
					meta.css += ' x-grid-dirty-cell';
				}

				colBuffer[i] = cellTpl.compile(meta);
			}

			row = this.getRow(rowIndex);
			row.className = '';

			if (this.grid.stripeRows && ((rowIndex + 1) % 2 === 0)) {
				cls.push('x-grid-row-alt');
			}

			if (this.getRowClass) {
				rowParams.cols = colCount;
				cls.push(this.getRowClass(record, rowIndex, rowParams, store));
			}

			this.fly(row).addClass(cls.join(' ')).css(rowParams.tstyle);
			rowParams.cells = colBuffer.join("");
			row.innerHTML = this.templates.rowInner.compile(rowParams);

			this.fire('rowupdated', this, rowIndex, record);
		},

		refresh: function(headersToo) {
			this.fire('beforerefresh', this);
			this.grid.stopEditing(true);

			var result = this.renderBody();
			this.mainBody.dom.innerHTML = result;
			this.mainBody.outerWidth(false, this.getTotalWidth());
			if (headersToo === true) {
				this.updateHeaders();
				this.updateHeaderSortState();
			}
			this.processRows(0, true);
			this.layout();
			this.applyEmptyText();
			this.fire('refresh', this);
		},

		applyEmptyText: function() {
			if (this.emptyText && !this.hasRows()) {
				this.mainBody.dom.innerHTML = '<div class="x-grid-empty">' + this.emptyText + '</div>';
			}
		},

		updateHeaderSortState: function() {
			var state = this.ds.getSorters()[0];

			if (!state) {
				return;
			}

			if (!this.sortState || (this.sortState.field != state.field || this.sortState.direction != state.direction)) {
				this.grid.fire('sortchange', this.grid, state);
			}

			this.sortState = state;

			var sortColumn = this.cm.findColumnIndex(state.property);
			if (sortColumn != -1) {
				var sortDir = state.direction;
				this.updateSortIcon(sortColumn, sortDir);
			}
		},

		clearHeaderSortState: function() {
			if (!this.sortState) {
				return;
			}

			this.grid.fire('sortchange', this.grid, null);

			Q.find('tb', this.mainHd.dom).each(function() {
				Q.Element.removeClass.removeClass(this.sortClasses.join(' '));
			});

			delete this.sortState;
		},


		destroy: function() {
			var me = this,
				grid = me.grid,
				gridEl = grid.getGridEl(),
				dragZone = me.dragZone,
				splitZone = me.splitZone,
				/*
				columnDrag = me.columnDrag,
				columnDrop = me.columnDrop,
				*/
				scrollToTopTask = me.scrollToTopTask;
			/*,
				columnDragData,
				columnDragProxy;
				*/

			if (scrollToTopTask && scrollToTopTask.destroy) {
				scrollToTopTask.destroy();
			}

			if (me.hmenu && me.hmenu.destroy) {
				me.hmenu.destroy();
				delete me.hmenu;
			}

			if (me.colMenu && me.colMenu.destroy) {
				me.colMenu.destroy();
				delete me.colMenu;
			}
			me.initData(null, null);
			me.unbind();

			Q.Element.off(me.innerHd, "click", me.handleHdDown, me);

			/*
			if (grid.enableColumnMove) {
				columnDragData = columnDrag.dragData;
				columnDragProxy = columnDrag.proxy;

				Q.Abstract.destroy(
					columnDrag.el,
					columnDragProxy.ghost,
					columnDragProxy.el,
					columnDrop.el,
					columnDrop.proxyTop,
					columnDrop.proxyBottom,
					columnDragData.ddel,
					columnDragData.header
				);


				delete columnDragProxy.ghost;
				delete columnDragData.ddel;
				delete columnDragData.header;
				columnDrag.destroy();

				//delete Ext.dd.DDM.locationCache[columnDrag.id];
				delete columnDrag._domRef;

				delete columnDrop.proxyTop;
				delete columnDrop.proxyBottom;
				columnDrop.destroy();
				//delete Ext.dd.DDM.locationCache["gridHeader" + gridEl.id];
				delete columnDrop._domRef;
				delete Ext.dd.DDM.ids[columnDrop.ddGroup];
			}
			*/
			if (splitZone) { // enableColumnResize
				splitZone.destroy();
				delete splitZone._domRef;
				//delete Ext.dd.DDM.ids["gridSplitters" + gridEl.id];
			}

			Q.Element.remove(me.innerHd)
			delete me.innerHd;

			Q.Abstract.destroy(
				me.el,
				me.mainWrap,
				me.mainHd,
				me.scroller,
				me.mainBody,
				me.focusEl,
				me.resizeMarker,
				me.resizeProxy,
				me.activeHdBtn,
				me._flyweight,
				dragZone,
				splitZone
			);

			delete grid.container;

			if (dragZone) {
				dragZone.destroy();
			}

			//Ext.dd.DDM.currentTarget = null;
			//delete Ext.dd.DDM.locationCache[gridEl.id];
		},

		onDenyColumnHide: Q.noop,

		render: function() {
			if (this.autoFill) {
				var ct = this.grid.ownerCt;

				if (ct && ct.getLayout()) {
					ct.bind('afterlayout', function() {
						this.fitColumns(true, true);
						this.updateHeaders();
						this.updateHeaderSortState();
					}, this, {
						single: true
					});
				}
			} else if (this.forceFit) {
				this.fitColumns(true, false);
			} else if (this.grid.autoExpandColumn) {
				this.autoExpand(true);
			}

			this.grid.getGridEl().dom.innerHTML = this.renderUI();

			this.afterRenderUI();
		},

		initData: function(newStore, newColModel) {
			var me = this;
			if (me.ds) {
				var oldStore = me.ds;

				oldStore.unbind('add', me.onStoreAddHandle, me);
				oldStore.unbind('load', me.onLoad, me);
				oldStore.unbind('clear', me.onClear, me);
				oldStore.unbind('remove', me.onRemove, me);
				oldStore.unbind('update', me.onUpdate, me);
				oldStore.unbind('datachanged', me.onDataChange, me);

				if (oldStore !== newStore && oldStore.autoDestroy) {
					oldStore.destroy();
				}
			}

			if (newStore) {
				newStore.bind({
					scope: me,
					load: me.onLoad,
					add: me.onStoreAddHandle,
					remove: me.onRemove,
					update: me.onUpdate,
					clear: me.onClear,
					datachanged: me.onDataChange
				});
			}

			if (me.cm) {
				var oldColModel = me.cm;

				oldColModel.unbind('configchange', me.onColConfigChange, me);
				oldColModel.unbind('widthchange', me.onColWidthChange, me);
				oldColModel.unbind('headerchange', me.onHeaderChange, me);
				oldColModel.unbind('hiddenchange', me.onHiddenChange, me);
				oldColModel.unbind('columnmoved', me.onColumnMove, me);
			}

			if (newColModel) {
				delete me.lastViewWidth;

				newColModel.bind({
					scope: me,
					configchange: me.onColConfigChange,
					widthchange: me.onColWidthChange,
					headerchange: me.onHeaderChange,
					hiddenchange: me.onHiddenChange,
					columnmoved: me.onColumnMove
				});
			}

			me.ds = newStore;
			me.cm = newColModel;
		},

		onDataChange: function() {
			this.refresh(true);
			this.updateHeaderSortState();
			this.syncFocusEl(0);
		},

		// private
		onClear: function() {
			this.refresh();
			this.syncFocusEl(0);
		},

		onUpdate: function(e, store, record) {
			this.refreshRow(record);
		},

		onStoreAddHandle: function(e, store, records, index) {
			this.onAdd(store, index, index + (records.length - 1));
		},
		// private
		onAdd: function(store, records, index) {
			this.insertRows(store, index, index + (records.length - 1));
		},

		onRemove: function(e, store, record, index, isUpdate) {
			if (isUpdate !== true) {
				this.fire('beforerowremoved', this, index, record);
			}

			this.removeRow(index);

			if (isUpdate !== true) {
				this.processRows(index);
				this.applyEmptyText();
				this.fire('rowremoved', this, index, record);
			}
		},


		onLoad: function() {
			if (Q.Browser.firfox) {
				if (!this.scrollToTopTask) {
					this.scrollToTopTask = new Timer(this.scrollToTop, this);
				}
				this.scrollToTopTask.delay(1);
			} else {
				this.scrollToTop();
			}
		},

		// private
		onColWidthChange: function(e, cm, col, width) {
			this.updateColumnWidth(col, width);
		},

		// private
		onHeaderChange: function(e, cm, col, text) {
			this.updateHeaders();
		},

		onHiddenChange: function(e, cm, col, hidden) {
			this.updateColumnHidden(col, hidden);
		},

		// private
		onColumnMove: function(e, cm, oldIndex, newIndex) {
			this.indexMap = null;
			this.refresh(true);
			this.restoreScroll(this.getScrollState());

			this.afterMove(newIndex);
			this.grid.fire('columnmove', oldIndex, newIndex);
		},

		// private
		onColConfigChange: function() {
			delete this.lastViewWidth;
			this.indexMap = null;
			this.refresh(true);
		},

		/* -------------------- UI Events and Handlers ------------------------------ */

		initUI: function(grid) {
			grid.bind('headerclick', this.onHeaderClick, this);
		},

		// private
		initEvents: Q.noop,

		// private
		onHeaderClick: function(e, grid, index) {
			if (this.headersDisabled || !this.cm.isSortable(index)) {
				return;
			}
			grid.stopEditing(true);
			grid.store.sort(this.cm.getDataIndex(index));
		},

		/**
		 * @private
		 * Adds the hover class to a row when hovered over
		 */
		onRowOver: function(e) {
			var row = this.findRowIndex(e.target);

			if (row !== false) {
				this.addRowClass(row, this.rowOverCls);
			}
		},

		/**
		 * @private
		 * Removes the hover class from a row on mouseout
		 */
		onRowOut: function(e) {
			var row = this.findRowIndex(e.target);
			if (row !== false && !Q.Element.contains(this.getRow(row), e.relatedTarget)) {
				this.removeRowClass(row, this.rowOverCls);
			}
		},

		onRowSelect: function(row) {
			this.addRowClass(row, this.selectedRowClass);
		},

		// private
		onRowDeselect: function(row) {
			this.removeRowClass(row, this.selectedRowClass);
		},

		// private
		onCellSelect: function(row, col) {
			var cell = this.getCell(row, col);
			if (cell) {
				this.fly(cell).addClass('x-grid-cell-selected');
			}
		},

		// private
		onCellDeselect: function(row, col) {
			var cell = this.getCell(row, col);
			if (cell) {
				this.fly(cell).removeClass('x-grid-cell-selected');
			}
		},

		// private
		handleWheel: function(e) {
			e.stopPropagation();
		},

		onColumnSplitterMoved: function(cellIndex, width) {
			this.userResized = true;
			this.grid.colModel.setColumnWidth(cellIndex, width, true);

			if (this.forceFit) {
				this.fitColumns(true, false, cellIndex);
				this.updateAllColumnWidths();
			} else {
				this.updateColumnWidth(cellIndex, width);
				this.syncHeaderScroll();
			}

			this.grid.fire('columnresize', cellIndex, width);
		},

		beforeColMenuShow: function() {
			var colModel = this.cm,
				colCount = colModel.getColumnCount(),
				colMenu = this.colMenu,
				i;

			colMenu.removeAll();

			for (i = 0; i < colCount; i++) {
				if (colModel.config[i].hideable !== false) {
					colMenu.add(new CheckItem({
						text: colModel.getColumnHeader(i),
						itemId: 'col-' + colModel.getColumnId(i),
						checked: !colModel.isHidden(i),
						disabled: colModel.config[i].hideable === false,
						hideOnClick: false
					}));
				}
			}
		},

		handleHdMenuClick: function(e, item) {
			var store = this.ds,
				dataIndex = this.cm.getDataIndex(this.hdCtxIndex);
			switch (item.getItemId()) {
				case 'asc':
					store.sort(dataIndex, 'ASC');
					break;
				case 'desc':
					store.sort(dataIndex, 'DESC');
					break;
				default:
					this.handleHdMenuClickDefault(item);
			}
			return true;
		},

		handleHdMenuClickDefault: function(item) {
			var colModel = this.cm,
				itemId = item.getItemId(),
				index = colModel.getIndexById(itemId.substr(4));

			if (index != -1) {
				if (item.checked && colModel.getColumnsBy(this.isHideableColumn, this).length <= 1) {
					this.onDenyColumnHide();
					return;
				}
				colModel.setHidden(index, item.checked);
			}
		},

		handleHdDown: function(e) {
			var target = e.target;
			if (Q.Element.hasClass(target, 'x-grid-hd-btn')) {
				e.stopPropagation();
				e.preventDefault();

				var colModel = this.cm,
					header = this.findHeaderCell(target),
					index = this.getCellIndex(header),
					sortable = colModel.isSortable(index),
					menu = this.hmenu,
					menuItems = menu.items,
					menuCls = this.headerMenuOpenCls,
					sep;

				this.hdCtxIndex = index;

				Q.Element.addClass(header, menuCls);

				if (this.hideSortIcons) {
					menuItems.get('asc').setVisible(sortable);
					menuItems.get('desc').setVisible(sortable);
					sep = menuItems.get('sortSep');
					if (sep) {
						sep.setVisible(sortable);
					}
				} else {
					menuItems.get('asc').setDisabled(!sortable);
					menuItems.get('desc').setDisabled(!sortable);
				}

				menu.bind('hide', function() {
					Q.Element.removeClass(header, menuCls);
				}, this, {
					single: true
				});

				menu.show(target, 'tl-bl?');
			}
		},

		handleHdMove: function(e) {
			var header = this.findHeaderCell(this.activeHdRef);

			if (header && !this.headersDisabled) {
				var handleWidth = this.splitHandleWidth || 5,
					activeRegion = this.activeHdRegion,
					headerStyle = header.style,
					colModel = this.cm,
					cursor = '',
					pageX = e.pageX;

				if (this.grid.enableColumnResize !== false) {
					var activeHeaderIndex = this.activeHdIndex,
						previousVisible = this.getPreviousVisible(activeHeaderIndex),
						currentResizable = colModel.isResizable(activeHeaderIndex),
						previousResizable = previousVisible && colModel.isResizable(previousVisible),
						inLeftResizer = pageX - activeRegion.left <= handleWidth,
						inRightResizer = activeRegion.right - pageX <= (!this.activeHdBtn ? handleWidth : 2);

					if (inLeftResizer && previousResizable) {
						cursor = Q.Browser.chrome ? 'e-resize' : 'col-resize';
					} else if (inRightResizer && currentResizable) {
						cursor = Q.Browser.chrome ? 'w-resize' : 'col-resize';
					}
				}

				headerStyle.cursor = cursor;
			}
		},

		/*检查前一列是否可见*/
		getPreviousVisible: function(index) {
			while (index > 0) {
				if (!this.cm.isHidden(index - 1)) {
					return index;
				}
				index--;
			}
			return undefined;
		},

		handleHdOver: function(e) {
			var header = this.findHeaderCell(e.target);

			if (header && !this.headersDisabled) {
				var fly = this.fly(header);

				this.activeHdRef = e.target;
				this.activeHdIndex = this.getCellIndex(header);
				this.activeHdRegion = Region.getRegion(header);

				if (!this.isMenuDisabled(this.activeHdIndex, fly)) {
					fly.addClass('x-grid-hd-over');
					this.activeHdBtn = fly.child('.x-grid-hd-btn');

					if (this.activeHdBtn) {
						this.activeHdBtn.dom.style.height = (header.firstChild.offsetHeight - 1) + 'px';
					}
				}
			}
		},

		handleHdOut: function(e) {
			var header = this.findHeaderCell(e.target);

			if (header && (!Q.Browser.ie || !Q.Element.contains(header, e.relatedTarget))) {
				this.activeHdRef = null;
				this.fly(header).removeClass('x-grid-hd-over');
				header.style.cursor = '';
			}
		},

		isMenuDisabled: function(cellIndex, el) {
			return this.cm.isMenuDisabled(cellIndex);
		},

		hasRows: function() {
			var fc = this.mainBody.dom.firstChild;
			return fc && fc.nodeType == 1 && fc.className != 'x-grid-empty';
		},

		isHideableColumn: function(c) {
			return !c.hidden;
		}
	});

	GridView.SplitDragZone = Q.Class.define(DDProxy, {

		init: function(grid, hd) {
			this.grid = grid;
			this.view = grid.getView();
			this.marker = this.view.resizeMarker;
			this.proxy = this.view.resizeProxy;

			this.callParent('init', [
				hd,
				'gridSplitters' + this.grid.getGridEl().id, {
					dragElId: Q.id(this.proxy.dom),
					resizeFrame: false
				}
			]);

			this.scroll = false;
			this.hw = this.view.splitHandleWidth || 5;
		},

		b4StartDrag: function(x, y) {
			this.dragHeadersDisabled = this.view.headersDisabled;
			this.view.headersDisabled = true;
			var h = this.view.mainWrap.outerWidth(false);
			this.marker.show();
			this.marker.outerHeight(false, h);
			this.marker.alignTo(this.view.getHeaderCell(this.cellIndex), 'tl-tl', [-1, 0]);
			this.proxy.outerHeight(false, h);
			var w = this.cm.getColumnWidth(this.cellIndex),
				minw = Math.max(w - this.grid.minColumnWidth, 0);
			this.resetConstraints();
			this.setXConstraint(minw, 1000);
			this.setYConstraint(0, 0);
			this.minX = x - minw;
			this.maxX = x + 1000;
			this.startPos = x;
			this.callParent(arguments);
		},

		allowHeaderDrag: function(e) {
			return true;
		},

		handleMouseDown: function(e) {
			var t = this.view.findHeaderCell(e.target);
			if (t && this.allowHeaderDrag(e)) {
				var xy = this.view.fly(t).offset(),
					x = xy.left,
					ex = e.pageX,
					w = t.offsetWidth,
					adjust = false;

				if ((ex - x) <= this.hw) {
					adjust = -1;
				} else if ((x + w) - ex <= this.hw) {
					adjust = 0;
				}

				if (adjust !== false) {
					this.cm = this.grid.colModel;
					var ci = this.view.getCellIndex(t);
					if (adjust == -1) {
						if (ci + adjust < 0) {
							return;
						}
						while (this.cm.isHidden(ci + adjust)) {
							--adjust;
							if (ci + adjust < 0) {
								return;
							}
						}
					}
					this.cellIndex = ci + adjust;
					this.split = t.dom;
					if (this.cm.isResizable(this.cellIndex) && !this.cm.isFixed(this.cellIndex)) {
						this.callParent(arguments);
					}
				}
				/*else if (this.view.columnDrag) {
					this.view.columnDrag.callHandleMouseDown(e);
				}*/
			}
		},

		endDrag: function(e) {
			this.marker.hide();
			this.proxy.css({
				top: 0,
				left: 0
			})
			/*
				TypeError: e is undefined
				endX = Math.max(this.minX, e.pageX),
			*/
			var v = this.view,
				endX = Math.max(this.minX, e.pageX),
				diff = endX - this.startPos,
				disabled = this.dragHeadersDisabled;

			v.onColumnSplitterMoved(this.cellIndex, this.cm.getColumnWidth(this.cellIndex) + diff);

			setTimeout(function() {
				v.headersDisabled = disabled;
			}, 50);
		},

		autoOffset: function() {
			this.setDelta(0, 0);
		}
	});

	return GridView;
});