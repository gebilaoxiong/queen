define([
  'data/Field',
  'data/RecordManager'
], function(field, recordManager) {

  var Record = Q.Class.define(Q.Abstract, {

    type: 'Record',

    isRecord: true,

    /*当前Reocrd是否被更改 true为被更改*/
    dirty: false,

    /*编辑状态*/
    editing: false,

    error: null,

    /*
			此对象包含一个键和值 存储着所有修改的原始值
		*/
    modified: null,

    /*新增的record为true 尚未储存到数据库中*/
    phantom: false,

    init: function(data, id) {
      this.id = (id || id === 0) ? id : Record.id(this);
      this.data = data || {};
    },

    join: function(store) {
      this.store = store;
    },

    get: function(name) {
      return this.data[name];
    },

    set: function(name, value) {
      var encode = Q.isString(value) || Q.isNumber(value) || Q.isBool(value) ?
        String : Q.JSON.stringify;

      //判断值如果相等 则返回
      if (encode(this.data[name]) == encode(value)) {
        return;
      }

      //标记值已变更
      this.dirty = true;

      if (!this.modified) {
        this.modified = {};
      }

      if (this.modified[name] === undefined) {
        this.modified[name] = this.data[name];
      }

      this.data[name] = value;

      //处于编辑状态
      if (!this.editing) {
        this.afterEdit();
      }
    },

    /*
			由拥有此record的 Store调用
			取消从创建以来的所有变更操作(或最后一次提交之前)
		*/
    reject: function(silent) {
      var modified = this.modified,
        name;

      for (name in modified) {
        if (typeof modified[name] != 'function') {
          this.data[name] = modified[name];
        }
      }

      this.dirty = false;
      delete this.modified;
      this.editing = false;
      if (silent !== true) {
        this.afterReject();
      }
    },

    afterReject: function() {
      if (this.store) {
        this.store.afterReject(this);
      }
    },

    /*编辑*/
    beginEdit: function() {
      this.editing = true;
      this.modified = this.modified || {};
    },

    cancelEdit: function() {
      this.editing = false;
      delete this.modified;
    },

    /*结束编辑状态*/
    endEdit: function() {
      this.editing = false;
      if (this.dirty) {
        this.afterEdit();
      }
    },

    afterEdit: function() {
      if (this.store != undefined && typeof this.store.afterEdit == 'function') {
        this.store.afterEdit(this);
      }
    },

    /*提交*/
    commit: function(silent) {
      this.dirty = false;
      //删除变更记录
      delete this.modified;
      this.editing = false;
      if (silent !== true) {
        this.afterCommit();
      }
    },

    afterCommit: function() {
      if (this.store) {
        this.store.afterCommit(this);
      }
    },

    /*获取变更*/
    getChanges: function() {
      var modified = this.modified,
        changes = {},
        name;

      for (name in modified) {
        if (modified.hasOwnProperty(name)) {
          changes[name] = this.data[name];
        }
      }

      return changes;
    },

    hasError: function() {
      return this.error !== null;
    },

    clearError: function() {
      this.error = null;
    },

    isModified: function(fieldName) {
      return !!(this.modified && this.modified.hasOwnProperty(fieldName));
    },

    isValid: function() {
      var invalidField = this.fields.find(function(_, field) {
        var ret = false,
          value;

        if (field.allowBlank === false) {
          value = this.data[field.name];
          ret = value == null || ((Q.isArray(value) && !value.length))
        }

        return ret;
      });

      return !invalidField;
    },

    markDirty: function() {
      this.dirty = true;

      if (!this.modified) {
        this.modified = {};
      }

      this.fields.each(function(_, field) {
        this.modified[field.name] = this.data[field.name];
      }, this);
    }
  });

  Record.uniqueId = 1;
  Record.prefix = 'record';
  Record.EDIT = 'edit';
  Record.REJECT = 'reject';
  Record.COMMIT = 'commit';

  /*
		静态方法 创建一个新的 record类型
	*/
  Record.create = function(name, fields) {
    var newRecord = Q.Class.define(Record, {}),
      proto = newRecord.prototype;

    if (Q.isArray(name)) {
      fields = name;
      name = undefined;
    }

    //添加fields 同一类型共享
    proto.fields = new Q.MixCollection('name');

    Q.each(fields, function() {
      proto.fields.add(new field(this));
    });

    proto.getField = function(name) {
      return proto.fields.find(function(index, item) {
        return item.name == name;
      });
    };

    if (name) {
      recordManager.regist(name, newRecord);
    }

    return newRecord;
  }

  Record.id = function(rec) {
    rec.phantom = true;
    return [Record.prefix, '-', Record.uniqueId++].join('');
  }

  return Record;
});