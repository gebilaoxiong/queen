define([
  'controls/Panel',
  'controls/LoadMask',
  'data/StoreManager',
  'grid/ColumnModel',
  'grid/selectModel/CellSelectionModel',
  'grid/GridView',
  'util/Timer'
], function(Panel, LoadMask, StoreManager, ColumnModel, CellSelectionModel, GridView, Timer) {

  var GridPanel = Q.Class.define(Panel, {

    type: 'GridPanel',

    autoExpandColumn: false,

    autoExpandMax: 1000,

    autoExpandMin: 50,

    /*是否显示列线*/
    columnLines: false,

    ddText: '{0} selected row{1}',

    /*延迟行呈现*/
    deferRowRender: true,

    /*是否允许列隐藏*/
    enableColumnHide: true,

    enableHdMenu: true,

    loadMask: false,

    minColumnWidth: 25,

    /*基数行样式*/
    stripeRows: false,

    trackMouseOver: true,

    /*状态事件*/
    stateEvents: ['columnmove', 'columnresize', 'sortchange', 'groupchange'],

    view: null,

    bubbleEvents: [],

    rendered: false,

    viewReady: false,

    configuration: function(config) {
      this.callParent(arguments);

      if (this.columnLines) {
        this.cls = (this.cls || '') + ' x-grid-with-col-lines';
      }

      this.autoScroll = false;
      this.autoWidth = false;

      //将列转换为ColumnModel
      if (Q.isArray(this.columns)) {
        this.colModel = new ColumnModel(this.columns);
        this.columns = null;
      }

      //短配置
      if (this.ds) {
        this.store = this.ds;
        this.ds = null;
      }

      if (this.cm) {
        this.colModel = this.cm;
        this.cm = null;
      }

      if (this.sm) {
        this.selModel = this.sm;
        this.sm = null;
      }

      this.store = StoreManager.lookup(this.store);
    },

    onRender: function(container, position) {
      var gridEl, view;

      this.callParent(arguments);

      gridEl = this.getGridEl();

      gridEl.on('mousedown', this.onMouseDown, this);
      gridEl.on('click', this.onClick, this);
      gridEl.on('dblclick', this.onDblClick, this);
      gridEl.on('contextmenu', this.onContextMenu, this);

      this.el.addClass('x-grid-panel');

      //转播
      this.relayEvents(gridEl, ['mousedown', 'mouseup', 'mouseover', 'mouseout', 'keypress', 'keydown']);

      view = this.getView();
      view.initialize(this);
      view.render();
      this.getSelectionModel().initialize(this);
    },

    initEvents: function() {

      this.callParent(arguments);

      this.initLoadMask();
    },

    initLoadMask: function() {
      var loadMaskConfig;

      if (Q.isObject(this.loadMask)) {

        loadMaskConfig = Q.extend({
          store: this.store
        }, this.loadMask)

      } else {

        loadMaskConfig = {
          store: this.store
        };

      }

      //遮罩
      if (this.loadMask) {
        this.loadMask = new LoadMask(this.bwrap, loadMaskConfig)
      }
    },

    /*--------------------------状态管理----------------------------------*/

    initStateEvents: function() {
      this.callParent(arguments);
      this.colModel.bind('hiddenchange', this.saveState, this, {
        delay: 100
      });
    },

    applyState: function(state) {
      var cm = this.colModel,
        cs = state.columns,
        store = this.store,
        s,
        c,
        colIndex;

      if (cs) {
        for (var i = 0, len = cs.length; i < len; i++) {
          s = cs[i];
          c = cm.getColumnById(s.id);
          if (c) {
            colIndex = cm.getIndexById(s.id);
            cm.setState(colIndex, {
              hidden: s.hidden,
              width: s.width,
              sortable: c.sortable,
              editable: c.editable
            });
            if (colIndex != i) {
              cm.moveColumn(colIndex, i);
            }
          }
        }
      }
      /*
			if (store) {
				s = state.sort;
				if (s) {
					store[store.remoteSort ? 'setDefaultSort' : ](s.field, s.direction);
				}
				s = state.group;
				if (store.groupBy) {
					if (s) {
						store.groupBy(s);
					} else {
						store.clearGrouping();
					}
				}

			}
			*/
      var o = Q.extend({}, state);
      delete o.columns;
      delete o.sort;

      this.callParent('applyState', [o]);
    },

    getState: function() {
      var o = {
          columns: []
        },
        store = this.store,
        ss,
        gs;

      for (var i = 0, c;
        (c = this.colModel.config[i]); i++) {
        o.columns[i] = {
          id: c.id,
          width: c.width
        };
        if (c.hidden) {
          o.columns[i].hidden = true;
        }
      }
      if (store) {
        ss = store.getSorters();
        if (ss) {
          o.sort = ss;
        }
        if (store.getGroupState) {
          gs = store.getGroupState();
          if (gs) {
            o.group = gs;
          }
        }
      }
      return o;
    },

    afterRender: function() {

      this.callParent(arguments);

      var v = this.view;

      this.bind('bodyresize', v.layout, v);

      v.layout(true);

      if (this.deferRowRender) {
        if (!this.deferRowRenderTask) {
          this.deferRowRenderTask = new Timer(v.afterRender, this.view);
        }
        this.deferRowRenderTask.delay(10);
      } else {
        v.afterRender();
      }
      this.viewReady = true;
    },

    reconfigure: function(store, colModel) {
      var rendered = this.rendered;
      if (rendered) {
        if (this.loadMask) {
          this.loadMask.destroy();
          this.initLoadMask();
        }
      }

      if (this.view) {
        this.view.initData(store, colModel);
      }

      this.store = store;
      this.colModel = colModel;
      if (rendered) {
        this.view.refresh(true);
      }
      this.fire('reconfigure', this, store, colModel);
    },
    onDestroy: function() {
      if (this.deferRowRenderTask && this.deferRowRenderTask.destroy) {
        this.deferRowRenderTask.destroy();
      }
      if (this.rendered) {
        Q.destroy(this.view, this.loadMask);
      } else if (this.store && this.store.autoDestroy) {
        this.store.destroy();
      }

      Q.destroy(this.colModel, this.selModel);
      this.store = this.selModel = this.colModel = this.view = this.loadMask = null;
      this.callParent(arguments);
    },

    processEvent: function(name, e) {
      this.view.processEvent(name, e);
    },

    // private
    onClick: function(e) {
      this.processEvent('click', e);
    },

    // private
    onMouseDown: function(e) {
      this.processEvent('mousedown', e);
    },

    // private
    onContextMenu: function(e, t) {
      this.processEvent('contextmenu', e);
    },

    // private
    onDblClick: function(e) {
      this.processEvent('dblclick', e);
    },

    walkCells: function(row, col, step, fn, scope) {
      var cm = this.colModel,
        clen = cm.getColumnCount(),
        ds = this.store,
        rlen = ds.getCount(),
        first = true;

      if (step < 0) {
        if (col < 0) {
          row--;
          first = false;
        }
        while (row >= 0) {
          if (!first) {
            col = clen - 1;
          }
          first = false;
          while (col >= 0) {
            if (fn.call(scope || this, row, col, cm) === true) {
              return [row, col];
            }
            col--;
          }
          row--;
        }
      } else {
        if (col >= clen) {
          row++;
          first = false;
        }
        while (row < rlen) {
          if (!first) {
            col = 0;
          }
          first = false;
          while (col < clen) {
            if (fn.call(scope || this, row, col, cm) === true) {
              return [row, col];
            }
            col++;
          }
          row++;
        }
      }
      return null;
    },

    getGridEl: function() {
      return this.body;
    },

    stopEditing: Q.noop,

    getSelectionModel: function() {
      if (!this.selModel) {
        this.selModel = new CellSelectionModel(
          this.disableSelection ? {
            selectRow: Q.noop
          } : null);
      }
      return this.selModel;
    },

    getStore: function() {
      return this.store;
    },

    getColumnModel: function() {
      return this.colModel;
    },

    getView: function() {
        if (!this.view) {
          this.view = new GridView(this.viewConfig);
        }

        return this.view;
      }
      /*,

		getDragDropText: function() {
			var count = this.selModel.getCount ? this.selModel.getCount() : 1;
			return String.format(this.ddText, count, count == 1 ? '' : 's');
		}
		*/

  });

  return GridPanel;
});