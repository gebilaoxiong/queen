define(['controls/Component'], function(Component) {

	/*
		抽象 具有尺寸的控件
		@param (float) width
		@param (float) height
		@param (float) minWidth
		@param (float) minHeight

		private 
			(bool) deferHeight 是否允许组件自己设置高度
			(bool) resizeEl 在调用setSize时控件真正设置高度的元素

	*/
	var BoxComponent = Q.Class.define(Component, {

		type: 'BoxComponent',

		autoEl: 'div',

		// afterRender 后为true 表示已渲染
		boxReady: false,

		autoWidth: false,

		autoHeight: false,

		deferHeight: false,

		getSize: function() {
			var el = this.getResizeEl();

			return {
				width: el.outerWidth(true),
				height: el.outerHeight(true)
			};
		},

		getBox: function(local) {
			var pos = local ? this.getPosition() : this.getPagePosition(),
				size = this.getSize();

			size.x = pos[0];
			size.y = pos[1];
			return size;
		},

		updateBox: function(box) {
			this.setSize(box.width, box.height);
			this.setPagePosition(box);
			return this;
		},

		setSize: function(width, height) {
			var adjustSize, adjustWidth, adjustHeight, resizeEl;

			if (typeof width == 'object') {
				height = width.height;
				width = width.width;
			}

			/*宽度 长度 最大值 最小值比较设定*/
			if (Q.isDefined(width) && Q.isDefined(this.maxWidth) && width > this.maxWidth) {
				width = this.maxWidth;
			}

			if (Q.isDefined(width) && Q.isDefined(this.minWidth) && width < this.minWidth) {
				width = this.minWidth;
			}

			if (Q.isDefined(height) && Q.isDefined(this.maxHeight) && height > this.maxHeight) {
				height = this.maxHeight;
			}

			if (Q.isDefined(height) && Q.isDefined(this.minHeight) && height < this.minHeight) {
				height = this.minHeight;
			}

			if (!this.boxReady) {
				this.width = width;
				this.height = height;
				return this;
			}

			//如果width 和height没改变 返回
			if (this.lastSize && this.lastSize.width == width && this.lastSize.height == height) {
				return;
			}

			this.lastSize = {
				width: width,
				height: height
			};

			adjustSize = this.adjustSize(width, height),
			adjustWidth = adjustSize.width,
			adjustHeight = adjustSize.height;

			if (adjustWidth != undefined || adjustHeight != undefined) {
				resizeEl = this.getResizeEl();

				//deferHeight为true时  为控件自己计算高度
				if (!this.deferHeight && adjustWidth !== undefined && adjustHeight !== undefined) {

					resizeEl.outerWidth(true, adjustWidth);
					resizeEl.outerHeight(false, adjustHeight);

				} else if (!this.deferHeight && adjustHeight !== undefined) {

					resizeEl.outerHeight(false, adjustHeight);

				} else if (adjustWidth !== undefined) {

					resizeEl.outerWidth(false, adjustWidth);

				}
				/*
					调用扩展方法
					扩展方法包含计算子控件高度等
				*/
				this.onResize(adjustWidth, adjustHeight, width, height);

				//触发事件
				this.fire('resize', this, adjustWidth, adjustHeight, width, height);
			}
		},

		/*调节尺寸 设置 autoWidth/Height 为auto*/
		adjustSize: function(width, height) {

			if (this.autoWidth) {
				width = 'auto';
			}

			if (this.autoHeight) {
				height = 'auto';
			}

			return {
				width: width,
				height: height
			};
		},

		getResizeEl: function() {
			return this.resizeEl || this.el;
		},

		onResize: Q.noop,

		/**
		 * 设置overflow
		 * @param {Boolean} scroll 溢出时是否显示滚动条
		 */
		setAutoScroll: function(scroll) {
			if (this.rendered) {
				this.getContentTarget().css('overflow', scroll ? 'auto' : '');
			}

			this.autoScroll = scroll;
			return this;
		},

		afterRender: function() {
			var me=this;
			
			me.callParent(arguments);
			me.boxReady = true;

			if (me.autoScroll != undefined) {
				me.setAutoScroll(me.autoScroll);
			}

			me.setSize(me.width, me.height);

			if(me.margin){
				me.el.css('margin',me.margin);
			}

			if (me.xy) {
				me.setPosition(me.xy);
			} else if (me.x || me.y) {
				me.setPosition({
					top: me.y,
					left: me.x
				});
				delete me.y;
				delete me.x;
			} else if (me.pageXY) {
				me.setPagePosition(me.pageXY);
			}
		},

		setPosition: function(xy) {
			var adj, el;

			this.xy = xy;

			if (!this.boxReady) {
				return this;
			}

			adj = this.adjustPosition(xy);
			el = this.getPositionEl();

			if (adj.left != undefined || adj.top != undefined) {
				if (adj.left != undefined && adj.top != undefined) {
					el.css(adj);
				} else if (adj.left == undefined && adj.top != undefined) {
					el.css('top', adj.top);
				} else if (adj.top == undefined && adj.left != undefined) {
					el.css('left', adj.left);
				}
				this.onPosition(adj.left, adj.top);
				this.fire('move', this, adj);
			}
			return this;
		},

		getPosition: function() {
			var el, ret;

			if (!this.rendered) {
				ret = [this.x, this.y];
			} else {
				el = this.getPositionEl();
				ret = [
					parseInt(el.css('left'), 10),
					parseInt(el.css('top'), 10)
				];
			}

			return ret;

		},

		getPagePosition: function() {
			var positionElOffset = this.getPositionEl().offset();

			return {
				top: positionElOffset.top,
				left: positionElOffset.left
			};
		},

		setPagePosition: function(xy) {
			var me = this,
				p;

			me.pageXY = xy;

			if (!me.boxReady) {
				return;
			}

			if (xy.top === undefined || xy.left === undefined) {
				return;
			}

			p = me.getPositionEl().translatePoints(xy.left, xy.top);
			me.setPosition(p);

			me.fire('move', me, xy);
		},

		adjustPosition: function(xy) {
			return xy;
		},

		onPosition: Q.noop
	});


	Q.each({
		height: 'Height',
		width: 'Width'
	}, function(key, name) {

		BoxComponent.prototype['get' + name] = function() {
			return this.getResizeEl()['outer' + name](false);
		};

		BoxComponent.prototype['set' + name] = function(value) {
			if (key == 'height') {
				this.setSize(undefined, value);
			} else {
				this.setSize(value);
			}
			return this;
		}
	});

	return BoxComponent;
})