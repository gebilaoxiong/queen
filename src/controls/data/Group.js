define(['util/Observable'], function(Observable) {

  var core_push = Array.prototype.push,

    Group = Q.Class.define(Observable, {

      type: 'Group',

      key: undefined,

      dirty: true,

      init: function(config) {
        Q.extend(this, config);
        this.callParent(arguments);
        this.records = [];
      },

      contains: function(record) {
        return Q.inArray(record, this.records) !== -1;
      },

      add: function(records) {
        if (!Q.isArray(records)) {
          records = [records];
        }

        core_push.apply(this.records, records);
        this.dirty = true;

      },

      remove: function(records) {
        if (!Q.isArray(records)) {
          records = [records];
        }

        var record, i = 0,
          index;

        while (record = records[i++]) {
          index = Q.inArray(record);
          if (index !== -1) {
            this.records.splice(index, 1);
          }
        }
      },
      isDirty: function() {
        return this.dirty;
      },

      hasAggregate: function() {
        return !!this.aggregate;
      },

      setDirty: function() {
        this.dirty = true;
      },

      commit: function() {
        this.dirty = false;
      },

      isCollapsed: function() {
        return this.collapsed;
      },

      getAggregateRecord: function(forceNew) {
        var me = this,
          recordTypel;

        if (forceNew === true || me.dirty || !me.aggregate) {
          recordType = me.store.recordType;
          me.aggregate = new recordType();
          me.aggregate.isSummary = true;
        }
        return me.aggregate;
      }

    });

  return Group;
});