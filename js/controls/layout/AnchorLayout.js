define(['layout/ContainerLayout'], function(ContainerLayout) {

	var AnchorLayout = Q.Class.define(ContainerLayout, {

		type: 'Anchor',

		monitorResize: true,

		defaultAnchor: '100%',

		parseAnchorRE: /^(r|right|b|bottom)$/i,

		getLayoutTargetSize: function() {
			var target = this.host.getLayoutTarget(),
				ret;

			if (target) {
				ret = {
					width: target.width(),
					height: target.height()
				};
			} else {
				ret = {
					width: 0,
					height: 0
				};
			}

			return ret;
		},

		onLayout: function(host, target) {
			this.callParent(arguments);

			var size = this.getLayoutTargetSize(),
				containerWidth = size.width, //内容区域大小
				containerHeight = size.height,
				overflow = target.css('overflow'), //CSS溢出
				components = this.getRenderedItems(host), //获取已呈现的子控件
				len = components.length,
				boxes = [],
				box,
				anchorWidth,
				anchorHeight,
				component,
				anchorSpec,
				calcWidth,
				calcHeight,
				anchorsArray,
				totalHeight = 0,
				i,
				el;

			if (containerWidth < 20 && containerHeight < 20) {
				return;
			}

			if (host.anchorSize) {
				if (typeof host.anchorSize == 'number') {
					anchorWidth = host.anchorSize;
				} else {
					anchorWidth = host.anchorSize.width;
					anchorHeight = host.anchorSize.height;
				}
			} else {
				anchorWidth = host.initCfg.width;
				anchorHeight = host.initCfg.height;
			}

			i = 0;
			while (component = components[i++]) {
				el = component.getPositionEl();

				//设置默认anchor
				if (!component.anchor && component.items && !Q.isNumber(component.width)) {
					component.anchor = this.defaultAnchor;
				}

				//有anchor
				if (component.anchor) {

					anchorSpec = component.anchorSpec;

					if (!anchorSpec) {
						anchorsArray = component.anchor.split(/\s+/g);
						//解析anchor 转换成相应的right bottom
						component.anchorSpec = anchorSpec = {
							right: this.parseAnchor(anchorsArray[0], component.initCfg.width, anchorWidth),
							bottom: this.parseAnchor(anchorsArray[1], component.initCfg.height, anchorHeight)
						};
					}

					calcWidth = anchorSpec.right ? this.adjustWidthAnchor(anchorSpec.right(containerWidth), component) : undefined;
					calcHeight = anchorSpec.bottom ? this.adjustHeightAnchor(anchorSpec.bottom(containerHeight), component) : undefined;

					if (calcWidth || calcHeight) {
						boxes.push({
							component: component,
							width: calcWidth || undefined,
							height: calcHeight || undefined
						});
					}

				}
			}

			i = 0;
			while (box = boxes[i++]) {
				box.component.setSize(box.width, box.height);
			}

			//允许溢出
			if (overflow && overflow != 'hidden' && !this.adjustmentPass) {
				var newTargetSize = this.getLayoutTargetSize();
				if (newTargetSize.width != size.width || newTargetSize.height != size.height) {
					this.adjustmentPass = true;
					this.onLayout(host, target);
				}
			}

			delete this.adjustmentPass;

		},

		parseAnchor: function(a, start, cstart) {
			if (a && a != 'none') {
				var last;

				if (this.parseAnchorRE.test(a)) { // right/bottom
					var diff = cstart - start;
					return function(v) {
						if (v !== last) {
							last = v;
							return v - diff;
						}
					};

				} else if (a.indexOf('%') != -1) { // 百分比
					var ratio = parseFloat(a.replace('%', '')) * .01;
					return function(v) {
						if (v !== last) {
							last = v;
							return Math.floor(v * ratio);
						}
					};
				} else { //增量 +/-10
					a = parseInt(a, 10);
					if (!isNaN(a)) {
						return function(v) {
							if (v !== last) {
								last = v;
								return v + a;
							}
						};
					}
				}
			}
			return false;
		},

		adjustWidthAnchor: function(value, cmp) {
			return value;
		},

		adjustHeightAnchor: function(value, cmp) {
			return value;
		}
	});



	return AnchorLayout;
});