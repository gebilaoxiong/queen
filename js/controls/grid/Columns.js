define([
  'util/Observable',
  'controls/ComponentMgr',
  'grid/GridEditor',
  'util/Template'
], function(Observable, ComponentMgr, GridEditor, Template) {

  var Column, BooleanColumn, NumberColumn, DateColumn, TemplateColumn;

  Column = Q.Class.define(Observable, {

    type: 'Column',

    isColumn: true,
    /*
      resizable
      
      sortable 

      tooltip 

      hideable

      editable {bool} 是否可编辑

      renderer {string/function} 会返回可显示的数据

      scope {Object}  在作用域(this 参考值)中执行渲染。默认值为Column配置对象。 
      */
    init: function(config) {
      var editor;

      Q.extend(this, config);

      //如果传入的renderer为格式字符串
      if (Q.isString(this.renderer)) {
        this.renderer = Q.String.format(this.renderer, true);
      } else if (Q.isObject(this.renderer)) { //传入的对象
        /*
          {
            scope:xxx,
            fn:function(){}
          }
        */
        this.scope = this.renderer.scope;
        this.renderer = this.renderer.fn;
      }

      //呈现作用域
      if (!this.scope) {
        this.scope = this;
      }

      //编辑器
      editor = this.editor;
      delete this.editor;
      this.setEditor(editor);

      //绑定事件
      this.callParent(arguments);
    },

    processEvent: function(name, e, grid, rowIndex, colIndex) {
      return this.fire(name, this, grid, rowIndex, e);
    },

    destroy: function() {
      if (this.setEditor) {
        this.setEditor(null);
      }
      this.unbind();
      delete this.renderer;
    },

    /*默认*/
    renderer: function(value) {
      return value;
    },

    getEditor: function(rowIndex) {
      return this.editable !== false ? this.editor : null;
    },

    setEditor: function(editor) {
      var me = this,
        ed = me.editor;

      if (ed) { //销毁旧的editor
        if (ed.gridEditor) {
          ed.gridEditor.destroy();
          delete ed.gridEditor;
        } else {
          ed.destroy();
        }
      }

      me.editor = null;

      if (editor) {
        if (Q.isPlainObject(editor)) { //配置对象
          editor = ComponentMgr.create(editor);
        }
        //构造函数
        if (Q.isFunction(editor)) {
          editor = new editor();
        }
        me.editor = editor;
      }
    },

    /*获取gridEditor*/
    getCellEditor: function(rowIndex) {
      var editor = this.getEditor(rowIndex);
      if (editor) {
        if (!editor.gridEditor) {
          editor.gridEditor = new GridEditor(editor);
        }
        editor = editor.gridEditor;
      }

      return editor;
    }
  });


  BooleanColumn = Q.Class.define(Column, {
    type: 'BooleanColumn',

    trueText: '是',

    falseText: '否',

    undefinedText: '&#160;',

    init: function(cfg) {
      this.callParent(arguments);

      var trueText = this.trueText,
        falseText = this.falseText,
        undefinedText = this.undefinedText;

      this.renderer = function(v) {
        if (v === undefined) {
          return undefinedText;
        }
        if (!v || v === 'false') {
          return falseText;
        }
        return trueText;
      };
    }
  });

  NumberColumn = Q.Class.define(Column, {
    type: 'NumberColumn',

    format: '0,000.00',

    init: function(cfg) {
      this.callParent(arguments);

      var format = this.format;

      this.renderer = function(value) {
        return Q.Number.format(value, format);
      };
    }
  });

  DateColumn = Q.Class.define(Column, {
    type: 'DateColumn',

    format: 'YYYY/MM/dd',

    init: function(cfg) {
      this.callParent(arguments);

      var format = this.format;

      this.renderer = function(value) {
        if (Q.isString(value)) {
          value = Q.Date.parse(value, format);
        }
        return Q.Date.format(value, format);
      };
    }
  });

  TemplateColumn = Q.Class.define(Column, {
    type: 'TemplateColumn',

    init: function(cfg) {
      this.callParent(arguments);

      var tpl = (this.tpl && this.tpl.compile) ? this.tpl : new Template(this.tpl);

      this.renderer = function(value, p, r) {
        return tpl.compile(r.data);
      };

      this.tpl = tpl;
    }
  });

  return {
    Column: Column,
    Boolean: BooleanColumn,
    Number: NumberColumn,
    Date: DateColumn,
    Template: TemplateColumn
  };
})