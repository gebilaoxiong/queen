define([
	'util/Observable',
	'grid/Columns'
], function(Observable, Columns) {

	var ColumnModel = Q.Class.define(Observable, {
		
		type:'ColumnModel',

		defaultWidth: 100,

		defaultSortable: false,

		init: function(config) {

			if (config.columns) {
				Q.extend(this.config);
				this.setConfig(config.columns, true);
			} else {
				this.setConfig(config, true);
			}

			this.callParent(arguments);
		},

		setConfig: function(config, initial) {
			var i, column, len,klass;

			if (!initial) {
				delete this.totalWidth;

				while (column = this.config[i]) {
					if (column.setEditor) {
						column.setEditor(null);
					}
				}
			}

			//column默认设置
			this.defaults = Q.extend({
				width: this.defaultWidth,
				sortable: this.defaultSortable
			}, this.defaults);


			this.config = config;
			this.lookup = {};

			for (i = 0, len = config.length; i < len; i++) {
				//应用默认
				column = Q.applyIf(config[i], this.defaults);

				if (column.id == undefined) {
					column.id = i;
				}

				if (!column.isColumn) {
					klass = Columns[column.xtype || 'Column'];
					column = new klass(column);
					config[i] = column;
				}

				this.lookup[column.id] = column;
			}

			if (!initial) {
				this.fire('configchange', this);
			}

		},

		getColumnId: function(index) {
			return this.config[index].id;
		},

		getColumnAt: function(index) {
			return this.config[index];
		},

		getColumnById: function(id) {
			return this.lookup[id];
		},
		getIndexById: function(id) {
			for (var i = 0, len = this.config.length; i < len; i++) {
				if (this.config[i].id == id) {
					return i;
				}
			}
			return -1;
		},

		moveColumn: function(oldIndex, newIndex) {
			var config = this.config,
				c = config[oldIndex];

			config.splice(oldIndex, 1);
			config.splice(newIndex, 0, c);
			this.dataMap = null;
			this.fire("columnmoved", this, oldIndex, newIndex);
		},

		getColumnCount: function(visibleOnly) {
			var length = this.config.length,
				c = 0,
				i;

			if (visibleOnly === true) {
				for (i = 0; i < length; i++) {
					if (!this.isHidden(i)) {
						c++;
					}
				}

				return c;
			}

			return length;
		},

		getColumnsBy: function(fn, scope) {
			var config = this.config,
				length = config.length,
				result = [],
				i, c;

			for (i = 0; i < length; i++) {
				c = config[i];

				if (fn.call(scope || this, c, i) === true) {
					result[result.length] = c;
				}
			}

			return result;
		},

		isSortable: function(col) {
			return !!this.config[col].sortable;
		},

		isMenuDisabled: function(col) {
			return !!this.config[col].menuDisabled;
		},

		getRenderer: function(col) {
			return this.config[col].renderer || ColumnModel.defaultRenderer;
		},

		getRendererScope: function(col) {
			return this.config[col].scope;
		},

		setRenderer: function(col, fn) {
			this.config[col].renderer = fn;
		},

		getColumnWidth: function(col) {
			var width = this.config[col].width;
			if (typeof width != 'number') {
				width = this.defaultWidth;
			}
			return width;
		},

		setColumnWidth: function(col, width, suppressEvent) {
			this.config[col].width = width;
			this.totalWidth = null;
			if (!suppressEvent) {
				this.fire("widthchange", this, col, width);
			}
		},

		getTotalWidth: function(includeHidden) {
			if (!this.totalWidth) {
				this.totalWidth = 0;
				for (var i = 0, len = this.config.length; i < len; i++) {
					if (includeHidden || !this.isHidden(i)) {
						this.totalWidth += this.getColumnWidth(i);
					}
				}
			}

			return this.totalWidth;
		},

		getColumnHeader: function(col) {
			return this.config[col].header;
		},

		setColumnHeader: function(col, header) {
			this.config[col].header = header;
			this.fire("headerchange", this, col, header);
		},

		getColumnTooltip: function(col) {
			return this.config[col].tooltip;
		},

		setColumnTooltip: function(col, tooltip) {
			this.config[col].tooltip = tooltip;
		},

		getDataIndex: function(col) {
			return this.config[col].dataIndex;
		},

		setDataIndex: function(col, dataIndex) {
			this.config[col].dataIndex = dataIndex;
		},

		findColumnIndex: function(dataIndex) {
			var c = this.config;
			for (var i = 0, len = c.length; i < len; i++) {
				if (c[i].dataIndex == dataIndex) {
					return i;
				}
			}
			return -1;
		},

		isCellEditable: function(colIndex, rowIndex) {
			var c = this.config[colIndex],
				ed = c.editable;

			//force boolean
			return !!(ed || (ed != undefined && c.editor));
		},

		getCellEditor: function(colIndex, rowIndex) {
			return this.config[colIndex].getCellEditor(rowIndex);
		},

		setEditable: function(col, editable) {
			this.config[col].editable = editable;
		},

		isHidden: function(colIndex) {
			return !!this.config[colIndex].hidden; // ensure returns boolean
		},

		isFixed: function(colIndex) {
			return !!this.config[colIndex].fixed;
		},

		isResizable: function(colIndex) {
			return colIndex >= 0 && this.config[colIndex].resizable !== false && this.config[colIndex].fixed !== true;
		},

		setHidden: function(colIndex, hidden) {
			var c = this.config[colIndex];
			if (c.hidden !== hidden) {
				c.hidden = hidden;
				this.totalWidth = null;
				this.fire("hiddenchange", this, colIndex, hidden);
			}
		},

		setEditor: function(col, editor) {
			this.config[col].setEditor(editor);
		},

		destroy: function() {
			var length = this.config.length,
				i = 0;

			for (; i < length; i++) {
				this.config[i].destroy(); // Column's destroy encapsulates all cleanup.
			}

			delete this.config;
			delete this.lookup;
			this.unbind();
		},

		setState: function(col, state) {
			state = Q.applyIf(state, this.defaults);
			Q.extend(this.config[col], state);
		}

	});

	ColumnModel.defaultRenderer = function(value) {
		if (typeof value == "string" && value.length < 1) {
			return "&#160;";
		}
		return value;
	};

	return ColumnModel;
});