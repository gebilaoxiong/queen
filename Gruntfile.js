/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-03-28 14:56:16
 * @description
 */

module.exports = function(grunt) {


  grunt.initConfig({
    moduledir: {
      build: {
        src: ['js/controls/**/*.js'],

        dest: "js",

        options: {
          moduleName: 'controls',
          baseUrl: "controls",
          rootDir: "js",
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
        }
      }
    },

    requirejs: {
      compile: {
        options: {

          name: "controls",

          baseUrl: 'js',

          mainConfigFile: "js/build.js",

          out: 'dest/controls.min.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-moduledir');
  grunt.loadNpmTasks('grunt-contrib-requirejs');


  grunt.registerTask('default', ['moduledir', 'requirejs']);
}