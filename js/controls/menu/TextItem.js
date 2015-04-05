define(['menu/BaseItem'], function(BaseItem) {

	var TextItem = Q.Class.define(BaseItem, {

		type:'TextItem',
		
		hideOnClick: false,
		/**
		 * @cfg {String} itemCls The default CSS class to use for text items (defaults to "x-menu-text")
		 */
		itemCls: "x-menu-text",

		configuration: function(config) {
			if (typeof config == 'string') {
				config = {
					text: config
				};
			}
			this.callParent(arguments);
		},

		// private
		onRender: function() {
			var s = document.createElement("span");
			s.className = this.itemCls;
			s.innerHTML = this.text;
			this.el = s;
			this.callParent(arguments);
		}
	});

	return TextItem;
});