(function () {

    angular.module('fs-angular-datetime')
	.provider("fsDatetime",function() {

		this.$get = function() {

			var service = {
				parse: parse
			 };

			return service;

			function parse(value) {
				return Date.parse(value);
			}
		}
	});
})();
