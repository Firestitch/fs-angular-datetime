
(function () {
	'use strict';

	angular.module('fs-angular-datetime',['fs-angular-util','fs-angular-browser','fs-angular-model','fs-angular-tabnav'])
	.directive('fsDatetime', function(fsUtil, $templateCache, $http, $compile, fsBrowser, $timeout, $q, fsDatetime) {
		return {
			restrict: 'E',
			templateUrl: 'views/directives/datetime.html',
			require: '^fsModel',
			scope: {
			   model: '=fsModel',
			   label: '@?fsLabel',
			   hasTime: '=?fsTime',
			   hasDate: '=?fsDate',
			   hasCalendar: '=?fsCalendar',
			   defaultTime: '@fsDefaultTime',
			   hasRange: '=?fsRange',
			   disabled: '=?fsDisabled',
			   disabledDays: '=?fsDisabledDays',
			   disabledHours: '=?fsDisabledHours',
			   disabledMinutes: '=?fsDisabledMinutes',
			   disabledTimes: '=?fsDisabledTimes',
			   view: '@fsView',
			   change: '@fsChange',
			   required: '=?fsRequired',
			   class: '@fsClass',
			   minYear: '@fsMinYear',
			   maxYear: '@fsMaxYear',
               hint: '@fsHint'
			},
			link: function($scope, $el, attrs, model) {

				$scope.$el = $el;
				$scope.$dialog = null;
				$scope.hasDate = $scope.hasDate || $scope.hasDate===undefined;
				$scope.tab = $scope.hasDate ? 'date' : 'time';

				var isFirefox = fsBrowser.firefox();
				var monthPadding = 3;

				$scope.minYear = $scope.minYear || (parseInt(moment().format('YYYY')) - 100);
				$scope.maxYear = $scope.maxYear || (parseInt(moment().format('YYYY')) + 100);
				$scope.years = [];

				for(var y=$scope.minYear;y<$scope.maxYear;y++) {
					$scope.years.push(y);
				}

				$scope.hasDate = $scope.hasDate===undefined ? true : $scope.hasDate;
				$scope.hasCalendar = $scope.hasCalendar===undefined ? true : $scope.hasCalendar;

				$scope.dateDays = [];
				$scope.opened = false;
				$scope.input = '';
				$scope.selected = {};
				$scope.name = fsUtil.guid();
				$scope.monthList = [{ value: 1, name: 'January' },
									{ value: 2, name: 'February' },
									{ value: 3, name: 'March' },
									{ value: 4, name: 'April' },
									{ value: 5, name: 'May' },
									{ value: 6, name: 'June' },
									{ value: 7, name: 'July' },
									{ value: 8, name: 'August' },
									{ value: 9, name: 'September' },
									{ value: 10, name: 'October' },
									{ value: 11, name: 'November' },
									{ value: 12, name: 'December' }];
				$scope.timeHours = [[0,12],[1,13],[2,14],[3,15],[4,16],[5,17],[6,18],[7,19],[8,20],[9,21],[10,22],[11,23]];
				$scope.timeMinutes = [	[0,1,2,3,4],
										[5,6,7,8,9],
										[10,11,12,13,14],
										[15,16,17,18,19],
										[20,21,22,23,24],
										[25,26,27,28,29],
										[30,31,32,33,34],
										[35,36,37,38,39],
										[40,41,42,43,44],
										[45,46,47,48,49],
										[50,51,52,53,54],
										[55,56,57,58,59]];

				$scope.$watch('disabledDays',function(disabled) {
					if(disabled!==undefined) {
						angular.forEach($scope.month.weeks,function(week) {
							angular.forEach(week,function(day) {
								day.disabled = isDayDisabled(moment(day.date));
							});
						});
					}
				});

				$scope.$watchGroup(['disabledMinutes','disabledHours','disabledTimes'],function(data) {
					$scope.disabledTimeMinutes = {};
					$scope.disabledTimeHours = {};
					$scope.disabledGroupedMinutes = {};
					if(data[0]!==undefined) {
						angular.forEach(data[0],function(range) {
							addDisabledMinutes(range);
						});
					}

					if(data[1]!==undefined) {
						angular.forEach(data[1],function(range) {
							addDisabledHours(range);
						});
					}

					if(data[2]!==undefined) {
						angular.forEach(data[2],function(range) {

							var min = Math.min(range[0],range[1]);
							var max = Math.max(range[0],range[1]);
							var minMinutes = min % 60;
							var maxMinutes = max % 60;

							var minHour = Math.floor(min/60);
							var maxHour = Math.floor(max/60);

							for(var h=0;h<=24;h++) {

								$scope.disabledGroupedMinutes[h] = {};

								if(h>minHour && h<maxHour)  {
									addDisabledHours(h,h);
								} else if(h==minHour && !minMinutes) {
									addDisabledHours(h,h);
								}

								if(h==minHour) {
									for(var m=minMinutes;m<60;m++) {
										$scope.disabledGroupedMinutes[h][m] = true;
									}
								}

								if(h==maxHour) {
									for(var m=0;m<maxMinutes;m++) {
										$scope.disabledGroupedMinutes[h][m] = true;
									}
								}
							}
						});
					}
				});

				function addDisabledMinutes(range) {
					var min = Math.min(range[0],range[1]);
					var max = Math.max(range[0],range[1]);
					if(fsUtil.isArray(range)) {
						for(var i=min;i<=max;i++) {
							$scope.disabledTimeMinutes[i] = true;
						}
					} else {
						$scope.disabledTimeMinutes[range] = true;
					}
				}

				function addDisabledHours(range) {
					var min = Math.min(range[0],range[1]);
					var max = Math.max(range[0],range[1]);
					if(fsUtil.isArray(range)) {
						for(var i=min;i<=max;i++) {
							$scope.disabledTimeHours[i] = true;
						}
					} else {
						$scope.disabledTimeHours[range] = true;
					}
				}

				updateDateDays();

				function createModel() {
					if(!$scope.model) {
						$scope.model = createMoment();
					}
				}

				function createMoment() {
					return moment().startOf('day');
				}

				$scope.inputKeyup = function(e) {
					if(e.keyCode == 13) {
						$scope.inputBlur(e);
					}
				}

				$scope.calendarView = function() {
					$scope.view = 'calendar';
				}

				$scope.monthView = function(month) {
					$scope.view = 'month';
				}

				$scope.yearView = function(year) {
					$scope.view = 'year';
					setTimeout(angular.bind(this,function() {
						var el = service.$date.querySelector('.years [data-year="' + year + '"]');
						if(el) {
							angular.element(service.$date.querySelector('.years')).prop('scrollTop',el.offsetTop);
						}
					}),50);
				}

				function documentKeyup(e) {
				   	if(e.keyCode == 27) {
				    	$scope.$apply(function() {
				    		$scope.close();
				    	});
				    }
				}

				$scope.open = function() {
					drawMonths($scope.model);
					positionDialog();
					$scope.opened = true;
					$scope.view = 'calendar';

					if(!$scope.hasCalendar) {
						$scope.view = 'date';
					}

					setTimeout(positionDialog);
					angular.element(document).on('keyup',documentKeyup);
				}

				$scope.inputClick = function(e) {

					var x = e.clientX,
				        y = e.clientY,
				        stack = [],
				        el = document.elementFromPoint(x, y);

				    stack.push(el);

				    while(el.tagName !== 'HTML'){

				        el.classList.add('pointerEventsNone');
				        el = document.elementFromPoint(x, y);

				        stack.push(el);

				        if(angular.element(el).hasClass('backdrop')) {
				        	setTimeout(function() {
				        		angular.element(el).triggerHandler('click');
				        	});
				        	break;
				        }
				    }

				    for (var i=0;i < stack.length; i += 1) {
				        stack[i].classList.remove('pointerEventsNone');
				    }

				    $scope.open();
				}

				$scope.monthClick = function(month) {
					angular.extend(month.months,$scope.monthList);
				}

				$scope.yearClick = function(month) {
					angular.extend(month.years,$scope.yearList);
				}

				$scope.close = function(e) {
					$scope.opened = false;
					angular.element(document).off('keyup',documentKeyup);
				}

				$scope.dayClick = function(day) {

					if(day.disabled) {
						return;
					}

					if(!$scope.model) {
						createModel();
					}

					var date = $scope.model
								.clone()
								.year(day.year)
								.month(day.month - 1)
								.date(day.number);

					setDate(date);
					change();

					if(!$scope.hasTime) {
						$scope.close();
					}
				}

				$scope.yearChange = function(year) {

					if(!$scope.model) {
						createModel();
					}

					setDate($scope.model.clone().year(year));
					change();
				}

				$scope.dayChange = function(day) {

					if(!$scope.model) {
						createModel();
					}

					setDate($scope.model.clone().date(day));
					change();
				}

				$scope.monthChange = function(month) {

					if(!$scope.model) {
						createModel();
					}

					setDate($scope.model.clone().month(month - 1));
					change();
				}

				$scope.monthDateViewChange = function() {
					updateDateDays();
					updateDate();
				}

				$scope.dayDateViewChange = function() {
					updateDateDays();
					updateDate();

				}

				$scope.yearDateViewChange = function() {
					updateDateDays();
					updateDate();
				}

				$scope.yearViewChange = function(year) {
					$scope.yearChange(year);
					$scope.calendarView();
				}

				$scope.monthViewChange = function(month) {
					$scope.monthChange(month);
					$scope.calendarView();
				}

				$scope.minuteClick = function(minute) {

					if($scope.disabledTimeMinutes[minute]) {
						return;
					}

					if(!$scope.model) {
						createModel();
					}

					setDate($scope.model.clone().minute(minute));
					change();
				}

				$scope.hourClick = function(hour) {

					if($scope.disabledTimeHours[hour]) {
						return;
					}

					if(!$scope.model) {
						createModel();
					}

					setDate($scope.model.clone().hour(hour));
					change();
				}

				$scope.previousMonth = function(month) {
					drawMonths(month.moment.subtract(1,'months'));
				}

				$scope.nextMonth = function(month) {
					drawMonths(month.moment.add(1,'months'));
				}

				function updateDate() {

					var m = moment([$scope.selected.year, $scope.selected.month - 1, $scope.selected.day]);
					var max = new Date($scope.selected.year || 1904,$scope.selected.month, 0).getDate();

					if(max<$scope.selected.day) {
						$scope.selected.day = undefined;
					}

					if(m.isValid()) {
						setDate(m);
					}
				}

				function updateDateDays() {
					var year = $scope.selected.year || 1904;
					var month = $scope.selected.month || 1;
					var max = new Date(year, month, 0).getDate();
					$scope.dateDays = [];
					for(var d=1;d<=max;d++) {
						$scope.dateDays.push(d);
					}

					return $scope.dateDays;
				}

				function parentDialog(el) {
					if(el) {
						if(angular.element(el).hasClass('fs-datetime-dialog')) {
							return true;
						} else {
							return parentDialog(el.parentElement);
						}
					}

					return false;
				}

				function isDayDisabled(md) {
					if(!$scope.disabledDays) {
						return false;
					}

					var len;
					for(var i=0, len = $scope.disabledDays.length; i < len; i++) {
						var value = $scope.disabledDays[i];
						if(moment.isMoment(value)) {
							if(value.format('YYYY-MM-DD')==md.format('YYYY-MM-DD')) {
								return true;
							}
						} else {
							if(md.isBetween(value[0].startOf('day'),value[1].startOf('day')) || md.format('YYYY-MM-DD')==value[0].format('YYYY-MM-DD')) {
								return true;
							}
						}
					}

					return false;
				}

				function change() {
					if($scope.change) {
						setTimeout(function() {
							$scope.$parent.$eval($scope.change);
						});
					}
				}

				function createMonth(date) {
					var date = date.clone().date(1);

					var days = [], weeks = [];
					var week = [];
					var md = date.clone();

					md.subtract(date.day(),'day');
					var daysInMonth = date.daysInMonth();

					for(var d=0;d<daysInMonth + date.day() + (6 - date.clone().add(1,'month').day() + 1);d++) {
						var number = md.format('DD');
						days.push({ number: number });

						if(d % 7==0) {
							week = [];
							weeks.push(week);
						}

						week.push({ mute: (d - date.day()<0 || ((d - date.day() + 1) > daysInMonth)),
									date: md.format('YYYY-MM-DD'),
									number: md.format('D'),
									month: md.format('M'),
									year: md.format('YYYY'),
									disabled: isDayDisabled(md) });

						md.add(1,'day');
					}

					return {name: date.format('MMMM'),
							number: date.format("M"),
							year: date.format("YYYY"),
							moment: date,
							date: date.format("YYYY") + '-' + date.format("M"),
							weeks: weeks,
							months: [{ name: date.format('MMMM'), value: date.format('M')}],
							years: [date.format("YYYY")] }
				}

				function drawMonths(date) {
					if(!date) {
						date = createMoment();
					}

					$scope.month = createMonth(date);
				}

				function queryMonth(date) {
					if(!service.$date || !date) {
						return undefined;
					}

					return service.$date.querySelector('.calendar-' + date.clone().startOf('month').format('YYYY-M'));
				}

				function setDate(date) {
					$scope.model = date;
				}

				function positionDialog() {

					if(!$scope.$dialog || !$scope.$dialog.length || window.innerWidth<500)
						return;

					var input = $scope.$el.find('input');
					var inputBound = input[0].getBoundingClientRect();
					var dialogBound = $scope.$dialog[0].getBoundingClientRect();

					var top = parseInt(inputBound.top) + inputBound.height;
					var left = parseInt(inputBound.left);

					var css = { top: '', bottom: '', left: '', right: '' };

					if((top + dialogBound.height)>window.innerHeight) {
						css.bottom = '10px';
						$scope.$dialog.addClass('vertical-reposition');
					} else {
						css.top = top + 'px';
						$scope.$dialog.removeClass('vertical-reposition');
					}

					if((left + dialogBound.width)>window.innerWidth) {
						css.right = '10px';
						$scope.$dialog.addClass('horizontal-reposition');
					} else {
						css.left = left + 'px';
						$scope.$dialog.removeClass('horizontal-reposition');
					}

					$scope.$dialog.css(css);
				}

				var service = {
					wrap: null,
					createMonth: createMonth,
					drawMonths: drawMonths,
					setDate: setDate,
					positionDialog: positionDialog
				};

				function render() {

					var format = [],
						options = options || {},
						value = $scope.model;

					if(fsUtil.isInt(value)) {
						value = moment(new Date(value));
					} else if(fsUtil.isString(value)) {
						if(moment(value).isValid()) {
							value = moment(value);
						} else {
							value = moment(Date.parse(value));
						}
					}

					if(value && moment(value).isValid()) {

						if($scope.hasDate) {
							format.push('MMM D, YYYY');
						}

						if($scope.hasTime) {
							format.push('h:mm a');
						}

						if(!$scope.focused) {
							$scope.input = value.format(format.join(' '));
							$scope.inputLength = $scope.input.length;
						}

						service.drawMonths(value);

						var year = parseInt(value.format('YYYY'));
						if(parseInt($scope.selected.year)!=year) {
							$scope.yearList = [];
							for(var y=year + 100;y>(year-100);y--) {
								$scope.yearList.push(y);
							}
						}

						$scope.selected.date = value.format('YYYY-MM-DD');
						$scope.selected.hour = parseInt(value.format('H'));
						$scope.selected.minute = parseInt(value.format('m'));
						$scope.selected.year = parseInt(value.format('YYYY'));
						$scope.selected.month = parseInt(value.format('M'));
						$scope.selected.day = parseInt(value.format('D'));

					} else {
						$scope.input = '';
						$scope.inputLength = $scope.input.length;

						$scope.selected.date = undefined;
						$scope.selected.hour = undefined;
						$scope.selected.minute = undefined;
						$scope.selected.year = undefined;
						$scope.selected.month = undefined;
						$scope.selected.day = undefined;
					}
				}

				model.watch = function(value) {

					if(value && moment(value).isValid()) {
						this.value(moment(value));
					} else {
						this.value(undefined);
					}

					this.commit();
					$scope.model = this.value();
					render();
				}

				var dateScroll = fsUtil.throttle(function(e) {
					$scope.$apply(function() {
						if(e.wheelDelta>0) {
							$scope.nextMonth($scope.month);
						} else {
							$scope.previousMonth($scope.month);
						}
					});
				},50);

				var windowResize = fsUtil.throttle(function(e) {
					service.positionDialog();
				},50);

				var appendPromises = [];
				var runningAppenedPromises = false;
				var again = false;
				var  running = false;
				setTimeout(function() {
					$http.get('views/directives/datetimedialog.html', {
						cache: $templateCache
					}).then(function(response) {
						$scope.$dialog = angular.element(response.data);
						angular.element(document.body).append($scope.$dialog);
						$compile($scope.$dialog)($scope);
						service.$date = $scope.$dialog[0].querySelector('.date');
						angular.element(service.$date).on('mousewheel',dateScroll);
					});
				});

				angular.element(window).on('resize',windowResize);

				$scope.$on('$destroy',function() {
					angular.element(service.$date).off('mousewheel',dateScroll);
					angular.element(window).off('resize',windowResize);
					if($scope.$dialog) {
						$scope.$dialog.remove();
					}
				});

				$scope.$watchGroup(['hasTime','hasDate'],function(value) {
					value[0] ? $el.addClass("has-time") : $el.removeClass("has-time");
					value[1] ? $el.addClass("has-date") : $el.removeClass("has-date");
				});
			}
		};
	})
	.directive('fsDatetimeRange', function() {
		return {
			restrict: 'E',
			templateUrl: 'views/directives/datetimerange.html',
			scope: {
			   from: '=fsFrom',
			   to: '=fsTo',
			   fromLabel: '@fsFromLabel',
			   toLabel: '@fsToLabel',
			   hasTime: '=?fsTime',
			   hasDate: '=?fsDate',
			   disabled: '=?fsDisabled',
			   required: '=?fsRequired',
               hint: '@fsHint',
			   change: '@fsChange',
			   class: '@fsClass'
			},
			link: function($scope, $el) {
				$scope.$watch('class',function(value) {
					if(value) {
						value.match(/md-no-message/i) ? $el.addClass("md-no-message") : $el.removeClass("md-no-message");
						value.match(/md-no-label/i) ? $el.addClass("md-no-label") : $el.removeClass("md-no-label");
					}
				});
			},
			controller: function($scope,fsUtil) {

            	$scope.$watch('from',function() {
            		if($scope.from && $scope.to) {
            			if($scope.to.isBefore($scope.from)) {
            				$scope.to = undefined;
            			}
            		}
            	});

            	$scope.$watch('from',function() {
            		$scope.toDisabledDays = $scope.from ? [[moment().subtract(99,'year'),$scope.from.clone()]] : [];
            	});

            	$scope.$watchGroup(['from','to'],function() {
            		$scope.toDisabledTimes = [];

            		if($scope.from && $scope.to && $scope.from.isSame($scope.to, 'day')) {

            			var from = fsUtil.int($scope.from.format('m')) + (fsUtil.int($scope.from.format('H'))*60);
            			var to = fsUtil.int($scope.to.format('m')) + (fsUtil.int($scope.to.format('H'))*60);

            			if(from) {
            				$scope.toDisabledTimes.push([0,from]);
            			}
            		}
            	});

            	$scope.block = fsUtil.string($scope.class).indexOf('md-block')>=0;

				$scope.onChange = function() {
					if($scope.change) {
						$scope.$parent.$eval($scope.change);
					}
				}
			}
		}
	})
	.directive('fsDatetimeDate', function() {
		return {
			restrict: 'E',
			template: '<fs-datetime fs-model="model" fs-label="{{label}}" fs-calendar="false"></fs-datetime>',
			scope: {
			   model: '=fsModel',
			   label: '@?fsLabel'
			},
			controller: function($scope) {

			}
		}
	})
	.directive('fsDatetimeBirthdate', function() {
		return {
			restrict: 'E',
			template: '<fs-datetime fs-model="model" fs-label="{{label}}" fs-required="required" fs-calendar="false" fs-min-year="{{minYear}}" fs-max-year="{{maxYear}}"></fs-datetime>',
			scope: {
			   model: '=fsModel',
			   required: '=?fsRequired',
			   label: '@?fsLabel'
			},
			controller: function($scope) {
				$scope.minYear = parseInt(moment().format('YYYY')) - 100;
				$scope.maxYear = parseInt(moment().format('YYYY'));
			}
		}
	});

})();

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

angular.module('fs-angular-datetime').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('views/directives/datetime.html',
    "<md-input-container ng-class=\"{ 'has-time': hasTime, 'has-date': hasDate }\" class=\"{{class}}\"><label>{{label}}</label><input ng-model=\"input\" type=\"text\" ng-click=\"inputClick($event)\" ng-keyup=\"inputKeyup($event)\" ng-model-options=\"{ debounce: 300 }\" ng-required=\"required\" name=\"{{name}}\" aria-label=\"input\" size=\"{{inputLength || 1}}\" ng-disabled=\"disabled\" readonly><div class=\"hint\" ng-if=\"hint\">{{hint}}</div></md-input-container><div class=\"backdrop ng-hide\" ng-show=\"opened\" ng-click=\"close($event)\"></div>"
  );


  $templateCache.put('views/directives/datetimedialog.html',
    "<div class=\"fs-datetime-dialog\" tabindex=\"0\" ng-class=\"{ opened: opened, 'has-date': hasDate, 'has-time': hasTime, 'has-calendar': hasCalendar, viewYears: view=='year' }\"><div class=\"wrap\" layout=\"column\"><fs-tabnav fs-selected=\"tab\" ng-show=\"hasDate && hasTime\"><fs-tabnav-item fs-name=\"date\">Date</fs-tabnav-item><fs-tabnav-item fs-name=\"time\">Time</fs-tabnav-item></fs-tabnav><div layout=\"row\" class=\"date-time\" flex><div class=\"date\" ng-show=\"tab=='date'\" flex><div class=\"months\" ng-if=\"view=='month'\"><table><tr><td ng-click=\"monthViewChange(1)\" ng-class=\"{ selected: selected.month==1 }\">Jan</td><td ng-click=\"monthViewChange(2)\" ng-class=\"{ selected: selected.month==2 }\">Feb</td><td ng-click=\"monthViewChange(3)\" ng-class=\"{ selected: selected.month==3 }\">Mar</td></tr><tr><td ng-click=\"monthViewChange(4)\" ng-class=\"{ selected: selected.month==4 }\">Apr</td><td ng-click=\"monthViewChange(5)\" ng-class=\"{ selected: selected.month==5 }\">May</td><td ng-click=\"monthViewChange(6)\" ng-class=\"{ selected: selected.month==6 }\">Jun</td></tr><tr><td ng-click=\"monthViewChange(7)\" ng-class=\"{ selected: selected.month==7 }\">Jul</td><td ng-click=\"monthViewChange(8)\" ng-class=\"{ selected: selected.month==8 }\">Aug</td><td ng-click=\"monthViewChange(9)\" ng-class=\"{ selected: selected.month==9 }\">Sept</td></tr><tr><td ng-click=\"monthViewChange(10)\" ng-class=\"{ selected: selected.month==10 }\">Oct</td><td ng-click=\"monthViewChange(11)\" ng-class=\"{ selected: selected.month==11 }\">Nov</td><td ng-click=\"monthViewChange(12)\" ng-class=\"{ selected: selected.month==12 }\">Dec</td></tr></table></div><div class=\"years\" ng-if=\"view=='year'\"><div ng-repeat=\"year in years\" class=\"year\" data-year=\"{{::year}}\" ng-class=\"{ row : ($index % 4 == 0), selected: selected.year==year }\" ng-click=\"yearViewChange(year)\">{{::year}}</div></div><div ng-if=\"hasCalendar && view=='calendar'\" class=\"calendar\"><div class=\"month-year\" layout=\"row\" layout-align=\"start center\"><a href class=\"month-name\" ng-click=\"monthView(month)\">{{month.name}}</a> <a href class=\"year-name\" ng-click=\"yearView(month.year)\">{{month.year}}</a> <a href ng-click=\"yearView(month.year)\" class=\"more\"><md-icon>arrow_drop_down</md-icon></a><div flex class=\"actions\"><a href ng-click=\"previousMonth(month)\"><md-icon>navigate_before</md-icon></a> <a href ng-click=\"nextMonth(month)\"><md-icon>navigate_next</md-icon></a></div></div><table><thead><tr><th>Sun</th><th>Mon</th><th>Tues</th><th>Wed</th><th>Thurs</th><th>Fri</th><th>Sat</th></tr></thead><tbody class=\"calendar calendar-{{::month.date}}\"><tr class=\"week\" ng-repeat=\"week in month.weeks\"><td ng-repeat=\"day in week track by day.number\" class=\"day\" ng-class=\"{ mute: day.mute, selected: day.date==selected.date && !day.mute, disabled: day.disabled }\" ng-click=\"dayClick(day)\"><span>{{::day.number}}</span></td></tr></tbody></table></div><div ng-if=\"view=='date'\" layout=\"row\" class=\"inline-date\"><div flex=\"33\"><md-input-container class=\"md-block md-no-message md-no-label\" md-no-float=\"true\"><md-select placeholder=\"Month\" ng-model=\"selected.month\" aria-label=\"Month\" ng-change=\"monthDateViewChange()\"><md-option ng-repeat=\"item in monthList track by item.value\" ng-value=\"item.value\">{{::item.name}}</md-option></md-select></md-input-container></div><div flex=\"33\"><md-input-container class=\"md-block md-no-message md-no-label\" md-no-float=\"true\"><md-select placeholder=\"Day\" ng-model=\"selected.day\" aria-label=\"Day\" ng-change=\"dayDateViewChange()\"><md-option ng-repeat=\"(key,value) in dateDays\" ng-value=\"value\">{{::value}}</md-option></md-select></md-input-container></div><div flex=\"33\"><md-input-container class=\"md-block md-no-message md-no-label\" md-no-float=\"true\"><md-select placeholder=\"Year\" ng-model=\"selected.year\" aria-label=\"Year\" ng-change=\"yearDateViewChange()\"><md-option ng-repeat=\"item in years\" ng-value=\"item\">{{::item}}</md-option></md-select></md-input-container></div></div></div><div class=\"time\" ng-if=\"hasTime\" ng-show=\"tab=='time'\"><div layout=\"row\" layout-align=\"start start\"><div class=\"hours\"><div class=\"lbl\">Hour</div><table><tr ng-repeat=\"hours in timeHours\"><td ng-repeat=\"hour in hours\" class=\"hour\" ng-click=\"hourClick(hour)\" ng-class=\"{ disabled: disabledTimeHours[hour], selected: hour==selected.hour }\"><div class=\"number\"><span ng-if=\"hour<12\">{{hour ? hour : 12}}<span class=\"am-pm\">am</span></span> <span ng-if=\"hour>=12\">{{hour==12 ? 12 : hour-12}}<span class=\"am-pm\">pm</span></span></div></td></tr></table></div><div class=\"minutes\"><div class=\"lbl\">Minute</div><table><tr ng-repeat=\"minutes in timeMinutes\"><td ng-repeat=\"minute in minutes\" class=\"minute\" ng-class=\"{ disabled: disabledTimeMinutes[minute] || disabledGroupedMinutes[selected.hour][minute], selected: minute==selected.minute }\" ng-click=\"minuteClick(minute)\"><div class=\"number\">{{::minute}}</div></td></tr></table></div></div></div></div><div layout=\"row\" layout-align=\"end start\" ng-show=\"hasTime\" class=\"done\"><md-button class=\"md-accent\" ng-click=\"close($event)\">Done</md-button></div></div></div>"
  );


  $templateCache.put('views/directives/datetimerange.html',
    "<div layout=\"row\" class=\"datetime-row\" ng-class=\"{ 'datetime-block': block }\"><div class=\"datetime-from\"><fs-datetime fs-hint=\"{{hint}}\" fs-model=\"from\" fs-label=\"{{fromLabel}}\" fs-date=\"hasDate\" fs-time=\"hasTime\" fs-disabled-days=\"fromDisabledDays\" fs-disabled-times=\"fromDisabledTimes\" fs-disabled=\"disabled\" fs-required=\"required\" fs-change=\"onChange()\" fs-class=\"{{class}}\"></fs-datetime></div><div class=\"to\">to</div><div class=\"datetime-to\"><fs-datetime fs-model=\"to\" fs-label=\"{{toLabel}}\" fs-date=\"hasDate\" fs-time=\"hasTime\" fs-disabled-days=\"toDisabledDays\" fs-disabled-times=\"toDisabledTimes\" fs-disabled=\"disabled\" fs-required=\"required\" fs-change=\"onChange()\" fs-class=\"{{class}}\"></fs-datetime></div></div>"
  );

}]);
