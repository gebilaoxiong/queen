define(['grid/selectModel/AbStractSelectionModel'], function(AbStractSelectionModel) {

	var CellSelectionModel = Q.Class.define(AbStractSelectionModel, {

		type:'CellSelectionModel',

		init: function(config) {
			Q.extend(this, config);

			this.selection = null;

			this.callParent(arguments);
		},
		initEvents: function() {
			this.grid.bind('cellmousedown', this.handleMouseDown, this);
			
			this.grid.getView().bind({
				scope: this,
				refresh: this.onViewChange,
				rowupdated: this.onRowUpdated,
				beforerowremoved: this.clearSelections,
				beforerowsinserted: this.clearSelections
			});

			if (this.grid.isEditor) {
				this.grid.bind('beforeedit', this.beforeEdit, this);
			}
		},

		beforeEdit: function(e) {
			this.select(e.row, e.column, false, true, e.record);
		},

		onRowUpdated: function(e, v, index, r) {
			if (this.selection && this.selection.record == r) {
				v.onCellSelect(index, this.selection.cell[1]);
			}
		},

		onViewChange: function() {
			this.clearSelections(true);
		},

		getSelectedCell: function() {
			return this.selection ? this.selection.cell : null;
		},

		clearSelections: function(preventNotify) {
			var s = this.selection;
			if (s) {
				if (preventNotify !== true) {
					this.grid.view.onCellDeselect(s.cell[0], s.cell[1]);
				}
				this.selection = null;
				this.fire("selectionchange", this, null);
			}
		},

		hasSelection: function() {
			return !!this.selection;
		},

		handleMouseDown: function(event, g, row, cell, e) {
			if ((e.which !== 1) || this.isLocked()) {
				return;
			}
			this.select(row, cell);
		},

		select: function(rowIndex, colIndex, preventViewNotify, preventFocus, /*internal*/ record) {
			var view;
			if (this.fire("beforecellselect", this, rowIndex, colIndex) !== false) {
				//清空选项
				this.clearSelections();

				record = record || this.grid.store.getAt(rowIndex);
				this.selection = {
					record: record,
					cell: [rowIndex, colIndex]
				};
				if (!preventViewNotify) {
					view = this.grid.getView();
					view.onCellSelect(rowIndex, colIndex);
					if (preventFocus !== true) {
						view.focusCell(rowIndex, colIndex);
					}
				}
				this.fire("cellselect", this, rowIndex, colIndex);
				this.fire("selectionchange", this, this.selection);
			}
		},

		isSelectable: function(rowIndex, colIndex, cm) {
			return !cm.isHidden(colIndex);
		}

	});

	return CellSelectionModel;
});