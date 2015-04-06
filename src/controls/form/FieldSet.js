/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2015-03-09 23:39:50
 * @description
 */
define([
  'controls/Panel',
  'form/TextField'
], function(Panel, TextField) {

  var FieldSet;

  FieldSet = Q.Class.define(Panel, {
    type: 'FieldSet',

    baseCls: 'x-fieldset',

    layout: 'form'
  });


  FieldSet.prototype.defaultType = TextField;

  return FieldSet;
})