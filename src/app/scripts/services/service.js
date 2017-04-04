(function () {

    angular.module('fs-angular-datetime')
	.provider("fsDatetime",function() {

		this.$get = function(fsUtil) {

			var service = {
				parse: parse,
				moment: _moment
			 };

			return service;

			function parse(value) {
				return Date.parse(value);
			}

			function _moment(value) {

				if(moment.isMoment(value)) {
					return value;
				}

				var date = undefined;
				if(value instanceof Date) {
					date = moment(value);
				} else if(fsUtil.isString(value)) {
					date = Date.parse(value);
				} else if(fsUtil.isInt(value)) {
					date = new Date(value);
				}

				if(date) {
					return moment(date);
				}

				return date;
			}
		}
	});
})();
