define(['util/Observable'], function(Observable) {

  var AbstractSelectionModel = Q.Class.define(Observable, {

    type: 'AbstractSelectionModel',

    init: function() {
      this.locked = false;
      this.callParent(arguments);
    },

    initEvents: Q.noop,

    initialize: function(grid) {
      this.grid = grid;

      if (this.lockOnInit) {
        delete this.lockOnInit;
        this.locked = false;
        this.lock();
      }

      this.initEvents();
    },

    lock: function() {
      if (!this.locked) {
        this.locked = true;

        var grid = this.grid;
        if (grid) {
          grid.getView().bind({
            scope: this,
            beforerefresh: this.sortUnLock,
            refresh: this.sortLock
          });
        } else {
          this.lockOnInit = true;
        }
      }
    },

    sortLock: function() {
      this.locked = true;
    },

    // set the lock states before and after a view refresh
    sortUnLock: function() {
      this.locked = false;
    },

    unlock: function() {
      if (this.locked) {
        this.locked = false;
        var grid = this.grid,
          gridView;

        // If the grid has been set, then the view is already initialized.
        if (grid) {
          gridView = grid.getView();
          gridView.unbind('beforerefresh', this.sortUnLock, this);
          gridView.unbind('refresh', this.sortLock, this);
        } else {
          delete this.lockOnInit;
        }
      }
    },

    isLocked: function() {
      return this.locked;
    },

    destroy: function() {
      this.unlock();
      this.unbind();
    }

  });

  return AbstractSelectionModel;
});