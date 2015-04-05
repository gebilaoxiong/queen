define(['form/Field'],function(field){

	var Hidden=Q.Class.define(field,{

		type:'hidden',

		inputType:'hidden',

		shouldLayout:false,

		initValue:function(){
			this.orgValue=this.getValue();
		},

		setSize:Q.noop,

		setWidth:Q.noop,

		setHeight:Q.noop,

		setPosition:Q.noop,

		setPagePosition:Q.noop,

		markInvalid:Q.noop,

		clearInvalid:Q.noop
	});

	return Hidden;
});