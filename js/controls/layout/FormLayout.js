define(['layout/AnchorLayout'], function(anchorLayout) {

  var FormLayout = Q.Class.define(anchorLayout, {

    type: 'Form',

    labelSeparator: ':',

    /*当字段隐藏的时候 是否隐藏容器*/
    trackLabels: true,

    setHost: function(host) {
      var pad, labelWidth;

      this.callParent(arguments);

      //标签位置
      host.labelAlign = host.labelAlign || this.labelAlign;

      if (host.labelAlign) {
        host.addClass('x-form-label-' + host.labelAlign);
      }

      //隐藏标签
      if (host.hideLabels || this.hideLabels) {
        Q.extend(this, {
          labelStyle: 'display:none',
          elementStyle: 'padding-left:0;',
          labelAdjust: 0
        });
      } else {
        //分隔符
        this.labelSeparator = host.labelSeparator !== undefined ?
          host.labelSeparator :
          this.labelSeparator;

        //标签宽度
        host.labelWidth = host.labelWidth || this.labelWidth || 100;

        if (Q.isNumber(host.labelWidth)) {
          pad = host.labelPad || this.labelPad;
          pad = Q.isNumber(pad) ? pad : 5;

          labelWidth = host.labelWidth + pad;

          Q.extend(this, {
            labelAdjust: host.labelWidth + pad,
            labelStyle: 'width:' + host.labelWidth + 'px;margin-right:-' + labelWidth + 'px',
            elementStyle: 'padding-left:' + labelWidth + 'px;'
          });
        }

        if (host.labelAlign == 'top') {
          Q.extend(this, {
            labelStyle: 'width:auto;',
            labelAdjust: 0,
            elementStyle: 'padding-left:0;'
          });
        }

      }
    },

    renderItem: function(cmp, position, target) {
      var args, itemCt, html, cmpCtId;

      //表单控件、设置了fieldLabel的控件 
      if (cmp && (cmp.isFormField || cmp.fieldLabel) && cmp.inputType != 'hidden') {
        args = this.getTemplateArgs(cmp);

        if (Q.isNumber(position)) {
          position = target.dom.childNodes[position] || null;
        }

        html = this.fieldTpl.compile(args);

        //将模板容器插入到DOM中
        if (position) {
          itemCt = Q.Element.insertAdjacentHTML(position, 'beforebegin', html)
        } else {
          itemCt = Q.Element.insertAdjacentHTML(target.dom, 'beforeend', html)
        }

        cmp.itemCt = Q.get(itemCt);

        //如果为非表单控件 扩展getItemCt
        if (!cmp.getItemCt) {
          Q.extend(cmp, {
            getItemCt: function() {
              return cmp.itemCt;
            },
            customItemCt: true
          });
        }

        //设置组件标签属性
        cmp.label = Q.get('label.x-form-item-label', itemCt);
        cmpCtId = '#x-form-el-' + cmp.getId();

        if (!cmp.rendered) {
          cmp.render(cmpCtId);
        } else {
          Q.get(cmpCtId, itemCt).append(cmp.getPositionEl());
        }

        //隐藏控件的时候也隐藏控件容器
        if (this.trackLabels) {
          if (cmp.hidden) {
            this.onFieldHide(cmp);
          }

          cmp.bind({
            scope: this,
            show: this.onFieldShow,
            hide: this.onFieldHide
          });
        }
        this.configureItem(cmp);
      } else {
        this.callParent(arguments);
      }
    },

    /*获取模板参数*/
    getTemplateArgs: function(field) {
      var noLabelSep = !field.fieldLabel || field.hideLabel,
        itemCls = (field.itemCls || this.host.itemCls || '') + (field.hideLabel ? 'x-hide-label' : '')

      return {
        id: field.getId(),
        label: field.fieldLabel,
        itemCls: itemCls,
        labelStyle: this.labelStyle || '',
        elementStyle: this.elementStyle || '',
        labelSeparator: noLabelSep ? '' : field.labelSeparator || this.labelSeparator
      };
    },

    onFieldHide: function(cmp) {
      c.getItemCt().addClass('x-hide-' + cmp.hideMode);
    },

    onFieldShow: function(cmp) {
      c.getItemCt.removeClass('x-hide-' + cmp.hideMode);
    },

    isHideLabel: function(cmp) {
      return cmp.hideLabel || this.host.hideLabels;
    },

    adjustWidthAnchor: function(value, cmp) {
      if (cmp.label && !this.isHideLabel(cmp) && (this.host.labelAlign != 'top')) {
        value = value - this.labelAdjust;
      }
      return value;
    },

    adjustHeightAnchor: function(value, cmp) {
      if (cmp.label && !this.isHideLabel(cmp) && (this.host.labelAlign == 'top')) {
        value = value - cmp.label.outerHeight(true);
      }
      return value;
    }
  });

  return FormLayout;
});