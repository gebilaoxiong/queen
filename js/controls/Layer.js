define(function() {
	var iframeUrl = (/^https/i.test(window.location.protocol) && Q.Browser.ie) ?
		'javascript:""' : 'about:blank',

		doc = document,

		isStrict = doc.compatMode == "CSS1Compat";

	var Layer = Q.Class.define(Q.Element, {

		statics: {
			shims: []
		},

		constrain: true,

		init: function(config, existingEl) {
			var parentEl, domConfig, me = this;

			config = config || {};

			parentEl = Q.get(config.parentEl ? config.parentEl : document.body);

			/*如果提供了existingEl*/
			if (existingEl) {
				me.dom = Q.dom.get(existingEl);
			}

				
			/*如果没有提供元素*/
			if (!me.dom) {
				domConfig = config.domConfig || {
					target: 'div',
					'class': 'x-layer'
				};
				me.dom = parentEl.createChild(domConfig).dom;

			}

			//class
			if (config.cls) {
				me.addClass(config.cls);
			}

			/*false禁用对齐到parentEl*/
			me.constrain = config.constrain !== false;

			me.id = me.dom.id = config.id || Q.id();

			me.zindex = config.zindex || config.zIndex || me.getZIndex();
			
			me.css({
				position: 'absolute',
				zIndex: me.zindex,
				top:0,
				left:0
			});

			me.useShim = config.shim !== false && Layer.useShim;
			me.hide();
		},

		getZIndex: function() {
			var me = this;
			return me.zindex || (parseInt((me.getShim() || me).css('z-index'), 10)) || 11000;
		},

		/*获取垫片*/
		getShim: function() {
			var shim, parentNode;

			if (!this.useShim) {
				return null;
			}
			
			if (this.shim) {
				return this.shim;
			}

			shim = Layer.shims.shift();

			if (!shim) {
				shim = this.createShim();
				shim.hide();
			}

			parentNode = this.dom.parentNode;
			if (shim.dom.parentNode != parentNode) {
				parentNode.insertBefore(shim.dom, this.dom);
			}
			shim.css('z-index', this.getZIndex() - 2);
			this.shim = shim;
			return shim;
		},
		/*
			为该元素创建一个iframe垫片 保证元素在IE6下不被form元素遮挡
		*/
		createShim: function() {
			var el = document.createElement('iframe'),
				shim;

			el.frameBorder = '0';
			el.className = 'x-shim';
			el.src = iframeUrl;
			shim = Q.get(this.dom.parentNode.insertBefore(el, this.dom));
			return shim;
		},
		hideShim: function() {
			if (this.shim) {
				this.shim.hide();
				Layer.shims.push(this.shim);
				delete this.shim;
			}
		},

		sync: function(doShow) {
			var me = this,
				shim, w, h, l, t;
			if (!me.updating && me.isVisible() && me.useShim) {
				shim = me.getShim();
				w = me.outerWidth(true);
				h = me.outerHeight(true);
				l = me.getPosition('left');
				t = me.getPosition('top');

				if (doShow) {
					shim.show();
				}
				
				shim.outerWidth(true, w);
				shim.outerHeight(true, h);

				shim.css({
					top: t,
					left: l
				});
			}
		},
		getPosition: function(position) {
			return parseInt(this.css(position), 10) || 0;
		},
		isVisible: function() {
			return !this.isHidden();
		},
		destroy: function() {
			this.hideShim();
			Q.Element.prototype.remove.call(this);
			delete this.dom;
			delete this.parentEl;
		},
		beginUpdate: function() {
			this.updating = true;
		},
		endUpdate: function() {
			this.updating = false;
			this.sync(true);
		},
		/*约束位置*/
		constrainPosition: function() {
			var me = this,
				viewWidth, viewHeight, viewScroll,
				offset, w, h, offsetLeft, offsetTop,
				moved = false,
				point;

			if (me.constrain) {
				viewWidth = me.getViewWidth();
				viewHeight = me.getViewHeight();
				viewScroll = me.getScroll();
				offset = me.offset(); //相对于窗口左上角的偏移量
				offsetTop = offset.top;
				offsetLeft = offset.left;
				w = me.dom.offsetWidth;
				h = me.dom.offsetHeight;

				/*right/bottom定位*/
				//元素的左偏移量+元素的宽度(元素右上角距离窗口左边距离)  
				//大于  
				//页面的宽度+页面滚动距离
				//(ps:元素的右上角超过了页面的右边距)
				if ((offsetLeft + w) > (viewWidth + viewScroll.left)) {
					offsetLeft = viewWidth - w;
					moved = true;
				}
				
				if ((offsetTop + h) > (viewHeight + viewScroll.top)) {
					offsetTop = viewHeight - h;
					moved = true;
				}

				if (offsetLeft < scroll.left) {
					offsetLeft = scroll.left;
					moved = true;
				}

				if (offsetTop < scroll.top) {
					offsetTop = scrollTop;
					moved = true;
				}

				if (moved) {
					point = {
						left: offsetLeft,
						top: offsetTop
					};
					me.storeXY(point)
					me.offset(point);
					me.sync();
				}
			}
		},

		getViewWidth: function() {
			return Math.max(doc.body.clientWidth, doc.documentElement.clientWidth);
		},

		getViewHeight: function() {
			return Math.max(doc.body.clientHeight, doc.documentElement.clientHeight);
		},

		//页面相对坐标
		storeXY: function(xy) {
			delete this.lastLT;
			this.lastXY = xy;
		},

		//定位坐标
		storeLeftTop: function(xy) {
			delete this.lastXY;
			this.lastLT = xy;
		},
		setLeft: function(left) {
			var me = this,
				position = {
					left: left,
					top: me.css('top')
				};
			me.storeLeftTop(position);
			me.css('left', left);
			me.sync();
			return me;
		},
		setTop: function(top) {
			var me = this,
				position = {
					left: me.css('left'),
					top: top
				};
			me.storeLeftTop(position);
			me.css('top', top);
			me.sync();
			return me;
		},
		setLeftTop: function(left, top) {
			var me = this,
				position = {
					left: left,
					top: top
				};
			me.storeLeftTop(position);
			me.css(position);
			me.sync();
			return me;
		},
		setPosition: function(xy) {
			var me = this;
			me.storeXY(xy);
			me.offset(xy);

			me.constrainPosition();
			me.sync(true);
		},
		setX: function(x) {
			this.setPosition({
				left: x,
				top: this.offset().top
			});
		},
		setY: function(y) {
			this.setPosition({
				left: this.offset().left,
				top: y
			});
		},
		setSize: function(width, height) {
			var me = this;

			me.outerWidth(true, width);
			me.outerHeight(true, height);

			me.constrainPosition();
			me.sync(true);
		},
		setWidth: function(width) {
			var me = this;
			me.outerWidth(true, width);

			me.constrainPosition();
			me.sync(true);
		},
		setHeight: function(height) {
			var me = this;
			me.outerHeight(true, height);

			me.constrainPosition();
			me.sync(true);
		},
		setZIndex: function(zindex) {
			this.zindex = zindex;
			this.css('z-index', zindex + 2);
			if (this.shim) {
				this.shim.css('z-index', zindex)
			}
		}
	});

	Layer.prototype.remove = Layer.prototype.destroy;

	Layer.useShim = Q.Browser.ie && !window.XMLHttpRequest; //Q.Browser.ie == 6;

	return Layer;
});