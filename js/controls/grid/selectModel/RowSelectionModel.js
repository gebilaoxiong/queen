define(['grid/selectModel/AbStractSelectionModel'], function(AbstractSelectionModel) {

	var RowSelectionModel = Q.Class.define(AbstractSelectionModel, {

		type: 'RowSelectionModel',

		singleSelect: false,

		statics: {
			getById: function(o) {
				return o.id;
			}
		},

		init: function(config) {
			Q.extend(this, config);

			/*所有选中项*/
			this.selections = new Q.MixCollection(RowSelectionModel.getById);

			this.last = false;

			this.lastActive = false;

			this.callParent(arguments);
		},

		/*初始化事件*/
		initEvents: function() {

			if (!this.grid.enableDragDrop && !this.grid.enableDrag) {
				this.grid.bind('rowmousedown', this.handleMouseDown, this);
			}

			//绑定视图的系列事件 用于更新 selections
			this.grid.getView().bind({
				scope: this,
				refresh: this.onRefresh,
				rowupdated: this.onRowUpdated,
				rowremoved: this.onRemove
			});
		},

		/*视图刷新*/
		onRefresh: function() {
			var ds = this.grid.store,
				slections = this.getSelections(),
				i = 0,
				len = slections.length,
				index, r;

			this.silent = true;
			this.clearSelections(true);

			for (; i < len; i++) {
				r = slections[i];
				if ((index = ds.indexOfId(r.id)) != -1) {
					this.selectRow(index, true);
				}
			}

			if (slections.length != this.selections.data.length) {
				this.fire('selectionchange', this);
			}
			this.silent = false;
		},

		onRemove: function(e, v, index, r) {
			if (this.selections.remove(r) !== false) {
				this.fire('selectionchange', this);
			}
		},

		onRowUpdated: function(e, v, index, r) {
			if (this.isSelected(r)) {
				v.onRowSelect(index);
			}
		},

		selectRecords: function(records, keepExisting) {
			if (!keepExisting) {
				this.clearSelections();
			}
			var ds = this.grid.store,
				i = 0,
				len = records.length;
			for (; i < len; i++) {
				this.selectRow(ds.indexOf(records[i]), true);
			}
		},

		getCount: function() {
			return this.selections.data.length;
		},

		selectFirstRow: function() {
			this.selectRow(0);
		},

		selectLastRow: function(keepExisting) {
			this.selectRow(this.grid.store.getCount() - 1, keepExisting);
		},

		selectNext: function(keepExisting) {
			if (this.hasNext()) {
				this.selectRow(this.last + 1, keepExisting);
				this.grid.getView().focusRow(this.last);
				return true;
			}
			return false;
		},

		selectPrevious: function(keepExisting) {
			if (this.hasPrevious()) {
				this.selectRow(this.last - 1, keepExisting);
				this.grid.getView().focusRow(this.last);
				return true;
			}
			return false;
		},

		hasNext: function() {
			return this.last !== false && (this.last + 1) < this.grid.store.getCount();
		},

		hasPrevious: function() {
			return !!this.last;
		},


		getSelections: function() {
			return [].concat(this.selections.data);
		},

		getSelected: function() {
			return this.selections.get(0);
		},

		each: function(fn, scope) {
			var s = this.getSelections(),
				i = 0,
				len = s.length;

			for (; i < len; i++) {
				if (fn.call(scope || this, s[i], i) === false) {
					return false;
				}
			}
			return true;
		},

		clearSelections: function(fast) {
			if (this.isLocked()) {
				return;
			}
			if (fast !== true) {
				var ds = this.grid.store,
					s = this.selections;
				s.each(function(_, r) {
					this.deselectRow(ds.indexOfId(r.id));
				}, this);

				s.clear();

			} else {
				this.selections.clear();
			}
			this.last = false;
		},

		selectAll: function() {
			if (this.isLocked()) {
				return;
			}
			this.selections.clear();
			for (var i = 0, len = this.grid.store.getCount(); i < len; i++) {
				this.selectRow(i, true);
			}
		},

		hasSelection: function() {
			return this.selections.data.length > 0;
		},

		isSelected: function(index) {
			var r = Q.isNumber(index) ? this.grid.store.getAt(index) : index;
			return (r && this.selections.keys[r.id] ? true : false);
		},

		isIdSelected: function(id) {
			return (this.selections.keys[id] ? true : false);
		},

		handleMouseDown: function(event, g, rowIndex, e) {
			if (e.which !== 1 || this.isLocked()) {
				return;
			}

			var view = this.grid.getView();

			if (e.shiftKey && !this.singleSelect && this.last !== false) {

				var last = this.last;
				this.selectRange(last, rowIndex, e.ctrlKey);
				this.last = last; // reset the last

				view.focusRow(rowIndex);

			} else {
				var isSelected = this.isSelected(rowIndex);

				if (e.ctrlKey && isSelected) {
					this.deselectRow(rowIndex);
				} else if (!isSelected || this.getCount() > 1) {
					this.selectRow(rowIndex, e.ctrlKey || e.shiftKey);
					view.focusRow(rowIndex);
				}
			}
		},

		selectRows: function(rows, keepExisting) {
			if (!keepExisting) {
				this.clearSelections();
			}
			for (var i = 0, len = rows.length; i < len; i++) {
				this.selectRow(rows[i], true);
			}
		},

		selectRange: function(startRow, endRow, keepExisting) {
			var i;
			if (this.isLocked()) {
				return;
			}
			if (!keepExisting) {
				this.clearSelections();
			}
			if (startRow <= endRow) {
				for (i = startRow; i <= endRow; i++) {
					this.selectRow(i, true);
				}
			} else {
				for (i = startRow; i >= endRow; i--) {
					this.selectRow(i, true);
				}
			}
		},

		deselectRange: function(startRow, endRow, preventViewNotify) {
			if (this.isLocked()) {
				return;
			}
			for (var i = startRow; i <= endRow; i++) {
				this.deselectRow(i, preventViewNotify);
			}
		},

		selectRow: function(index, keepExisting, preventViewNotify) {
			if (this.isLocked() || (index < 0 || index >= this.grid.store.getCount()) || (keepExisting && this.isSelected(index))) {
				return;
			}

			var record = this.grid.store.getAt(index);

			if (record && this.fire('beforerowselect', this, index, keepExisting, record) !== false) {

				if (!keepExisting || this.singleSelect) {
					this.clearSelections();
				}

				this.selections.add(record);
				this.last = this.lastActive = index;

				if (!preventViewNotify) {
					this.grid.getView().onRowSelect(index);
				}

				if (!this.silent) {
					this.fire('rowselect', this, index, record);
					this.fire('selectionchange', this);
				}
			}
		},

		deselectRow: function(index, preventViewNotify) {
			if (this.isLocked()) {
				return;
			}
			if (this.last == index) {
				this.last = false;
			}
			if (this.lastActive == index) {
				this.lastActive = false;
			}
			var r = this.grid.store.getAt(index);

			if (r) {
				this.selections.remove(r);
				if (!preventViewNotify) {
					this.grid.getView().onRowDeselect(index);
				}
				this.fire('rowdeselect', this, index, r);
				this.fire('selectionchange', this);
			}
		},

		acceptsNav: function(row, col, cm) {
			return !cm.isHidden(col) && cm.isCellEditable(col, row);
		},

		onEditorKey: function(field, e) {
			var k = e.getKey(),
				newCell,
				g = this.grid,
				last = g.lastEdit,
				ed = g.activeEditor,
				shift = e.shiftKey,
				ae, last, r, c;

			if (k == e.TAB) {
				e.stopEvent();
				ed.completeEdit();
				if (shift) {
					newCell = g.walkCells(ed.row, ed.col - 1, -1, this.acceptsNav, this);
				} else {
					newCell = g.walkCells(ed.row, ed.col + 1, 1, this.acceptsNav, this);
				}
			} else if (k == e.ENTER) {
				if (this.moveEditorOnEnter !== false) {
					if (shift) {
						newCell = g.walkCells(last.row - 1, last.col, -1, this.acceptsNav, this);
					} else {
						newCell = g.walkCells(last.row + 1, last.col, 1, this.acceptsNav, this);
					}
				}
			}
			if (newCell) {
				r = newCell[0];
				c = newCell[1];

				this.onEditorSelect(r, last.row);

				if (g.isEditor && g.editing) { // *** handle tabbing while editorgrid is in edit mode
					ae = g.activeEditor;
					if (ae && ae.field.triggerBlur) {
						// *** if activeEditor is a TriggerField, explicitly call its triggerBlur() method
						ae.field.triggerBlur();
					}
				}
				g.startEditing(r, c);
			}
		},

		onEditorSelect: function(row, lastRow) {
			if (lastRow != row) {
				this.selectRow(row); // *** highlight newly-selected cell and update selection
			}
		}
	});

	return RowSelectionModel;
});