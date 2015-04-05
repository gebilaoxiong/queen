/*
    启动文件
    配置require.js路径
*/
requirejs.config({

    enforceDefine: true,
    skipModuleInsertion: false,

    paths: {
        /*----------基础控件----------*/
        'dd': 'controls/dd',
        'data': 'controls/data',
        'direct': 'controls/direct',
        'form': 'controls/form',
        'grid': 'controls/grid',
        'layout': 'controls/layout',
        'state': 'controls/state',
        'util': 'controls/util',
        'menu': 'controls/menu',
        'list': 'controls/list',
        'tree': 'controls/tree'

    }
});