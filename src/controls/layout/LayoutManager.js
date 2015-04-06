define([
  'layout/ContainerLayout',
  'layout/AutoLayout',
  'layout/ColumnLayout',
  'layout/BorderLayout',
  'layout/FitLayout',
  'layout/CardLayout',
  'layout/AnchorLayout',
  'layout/FormLayout',
  'layout/TableLayout',
  'layout/AbsoluteLayout'
], function() {
  var layoutTypes = {};

  Q.each(arguments, function(index, layout) {
    register(layout);
  });

  function register(type, sortKey) {
    sortKey = (sortKey || type.prototype.type).toLowerCase();
    layoutTypes[sortKey] = type;
  }

  function create(sortKey, settings) {
    var type = layoutTypes[sortKey.toLowerCase()];
    return new type(settings);
  }

  function getLayout(sortKey) {
    return layoutTypes[sortKey.toLowerCase()];
  }

  function contains(sortKey) {
    return !!layoutTypes[sortKey.toLowerCase()];
  }

  return {
    register: register,
    create: create,
    get: getLayout,
    contains: contains
  }
});