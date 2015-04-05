define(['controls/Editor'], function(Editor) {

  var GridEditor = Q.Class.define(Editor, {

    type: 'GridEditor',

    alignment: "tl-tl",

    autoSize: "width",

    hideEl: false,

    cls: "x-small-editor x-grid-editor",

    shim: false,

    init: function(field, config) {
      this.callParent(arguments);

      field.monitorTab = false;
    }
  });

  return GridEditor;
})