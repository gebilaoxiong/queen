define(['state/Provider'], function(Provider) {

	var provider = new Provider();

	return {

		setProvider: function(stateProvider) {
			provider = stateProvider;
		},

		get: function(key, defaultValue) {
			return provider.get(key, defaultValue);
		},

		set: function(key, value) {
			provider.set(key, value);
		},

		clear: function(key) {
			provider.clear(key);
		},
		
		getProvider: function() {
			return provider;
		},

		log:function(){
			console.log(provider)
		}
	}


});