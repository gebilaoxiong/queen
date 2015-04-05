/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-05-01 16:46:27
 * @description
 */
define(['data/Connection'], function(Connection) {
	return new Connection({
		autoAbort: false
	});
})