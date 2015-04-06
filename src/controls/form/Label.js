/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-03-27 14:33:32
 * @description
 */

define(['controls/BoxComponent'], function(BoxComponent) {

  var Label = Q.Class.define(BoxComponent, {

    onRender: function(container, position) {
      if (!this.el) {
        this.el = document.createElement('Label');
        this.el.id = this.getId();
        this.el.innerHTML = this.text ? Q.String.escapeHtml(this.text) : (this.html || '');

        if (this.forId) {
          this.e.attr('for', this.forId);
        }
      }

      this.callParent(arguments);
    },

    setText: function(text, encode) {
      var prop = !(encode === false) ? 'text' : 'html';
      this[prop] = t;
      delete this[prop];

      if (this.rendered) {
        this.el.dom.innerHTML = encode !== false ? Q.String.escapeHtml(text) : text;
      }
    }
  });

  return Label;
});