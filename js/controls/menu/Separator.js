define(['menu/BaseItem'], function(BaseItem) {

  var Separator = Q.Class.define(BaseItem, {

    type: 'Separator',

    itemCls: "x-menu-sep",
    /**
     * @cfg {Boolean} hideOnClick True to hide the containing menu after this item is clicked (defaults to false)
     */
    hideOnClick: false,

    /** 
     * @cfg {String} activeClass
     * @hide
     */
    activeClass: '',

    // private
    onRender: function(li) {
      var s = document.createElement("span");
      s.className = this.itemCls;
      s.innerHtml = '&nbsp;'
      this.el = s;
      li.addClass("x-menu-sep-li");
      this.callParent(arguments);
    }

  });

  return Separator;
});