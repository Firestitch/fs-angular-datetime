(function () {
	'use strict';

	angular.module('fs-angular-datetime',['fs-angular-util','fs-angular-browser','fs-angular-model'])
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

				var isFirefox = fsBrowser.firefox();
				var monthPadding = 3;

				$scope.minYear = $scope.minYear || (parseInt(moment().format('YYYY')) - 100);
				$scope.maxYear = $scope.maxYear || (parseInt(moment().format('YYYY')) + 100);
				$scope.years = [];

				for(var y=$scope.maxYear;y>$scope.minYear;y--) {
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
						angular.forEach($scope.months,function(month) {
							angular.forEach(month.weeks,function(week) {
								angular.forEach(week,function(day) {
									day.disabled = isDayDisabled(moment(day.date));
								});
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

				$scope.inputChange = function(type) {
					var date = fsDatetime.parse($scope.input);
					if(date) {
						$scope.model = moment(date);

						if($scope.defaultTime) {
							if(!parseInt($scope.model.format('H')) && !parseInt($scope.model.format('m'))) {

								var match = $scope.defaultTime.match(/(\d)+:(\d)+/);

								if(match) {
									$scope.model.set({ hour: match[1], minute: match[2], second: 0, millisecond: 0 });
								}
							}
						}

						if($scope.model) {
							setDate($scope.model);
							change();
						}
					}
				}

				function createModel() {
					if(!$scope.model) {
						$scope.model = createMoment();
					}
				}

				function createMoment() {
					return moment().startOf('day');
				}

				$scope.inputBlur = function(e) {
					$scope.focused = false;
					if(!parentDialog(e.relatedTarget)) {
						$scope.close();
					}
				}

				$scope.inputFocus = function() {
					$scope.focused = true;
					$scope.open();
					showMonth($scope.model);
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

				$scope.open = function() {
					drawMonths($scope.model);
					showMonth($scope.model);
					positionDialog();
					$scope.opened = true;
					$scope.view = 'calendar';

					if(!$scope.hasCalendar) {
						$scope.view = 'date';
					}

					setTimeout(positionDialog);
				}

				$scope.inputClick = function(e) {

					$scope.open();
					showMonth($scope.model);

					var input = e.target;
					var pos = null;
					if ('selectionStart' in input) {
						pos = input.selectionStart;
					} else if (document.selection) {
						// IE
						input.focus();
						var sel = document.selection.createRange();
						var selLen = document.selection.createRange().text.length;
						sel.moveStart('character', - input.value.length);
						pos = sel.text.length - selLen;
					}

					var s1 = input.value.substring(0,pos);
					var s2 = input.value.substring(pos);

					s1 = s1.match(/[a-z0-9]+$/i);
					s2 = s2.match(/^[a-z0-9]+/i);

					if(s1 && s2) {

						var start = pos - s1[0].length;
						var end = pos + s2[0].length;

						if( input.createTextRange ) {
							var selRange = input.createTextRange();
							selRange.collapse(true);
							selRange.moveStart('character', start);
							selRange.moveEnd('character', end);
							selRange.select();
							input.focus();
						} else if( input.setSelectionRange ) {
							input.focus();
							input.setSelectionRange(start, end);
						} else if( typeof input.selectionStart != 'undefined' ) {
							input.selectionStart = start;
							input.selectionEnd = end;
							input.focus();
						}
					}
				}



				$scope.monthClick = function(month) {
					angular.extend(month.months,$scope.monthList);
				}

				$scope.yearClick = function(month) {
					angular.extend(month.years,$scope.yearList);
				}

				$scope.close = function(e) {
					$scope.opened = false;


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

					//If the month dom exists then don't redraw the months
					if(date) {
						if(queryMonth(date.clone().subtract(1,'month')) && queryMonth(date.clone().add(1,'month'))) {
							return;
						}
					}


					var date = date ? date : createMoment();
					var month = date.clone().startOf('month').subtract(monthPadding,'months');

					$scope.months = [];
					for(var i=0;i<=monthPadding * 2;i++) {
						$scope.months.push(createMonth(month));
						month.add(1,'month');
					}
				}

				function showMonth(date) {

					setTimeout(angular.bind(this,function(d) {

						var d = d ? d : createMoment();
						var month = queryMonth(d);

						if(month) {
							service.$date.scrollTop = month.offsetTop;
						}
					},date),50);
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

				var appending = false;

				function appendBottom() {
					return append(-1);
				}

				function appendTop() {
					return append(1);
				}

				function append(value) {

					return $q(function(resolve) {
						var month = value>0 ? $scope.months[$scope.months.length - 1] : $scope.months[0];

						if(month) {
							var m = month.moment.clone();
							var remove, height = 0;
							for(var i=1;i<=3;i++) {

								if(value>0) {
									$scope.months.push(createMonth(m.add(1,'month')));
									remove = $scope.months.shift();
								} else {
									$scope.months.unshift(createMonth(m.subtract(1,'month')));
									remove = $scope.months.pop();
								}

								if(isFirefox && remove) {
									height += service.$date.querySelector('.calendar-' + remove.moment.format('YYYY-M')).offsetHeight;
								}
							}

							$scope.$apply();

							if(height) {
								angular.element(service.$date)[0].scrollTop = height;
							}
						}
						resolve();
					});
				}

				function positionDialog() {
					if(!$scope.$dialog || !$scope.$dialog.length)
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
					appendBottom: appendBottom,
					appendTop: appendTop,
					showMonth: showMonth,
					drawMonths: drawMonths,
					setDate: setDate,
					positionDialog: positionDialog,
					disableScroll: false
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
						service.showMonth(value);

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

				model.watch = function() {

					if(this.value() && moment(this.value()).isValid()) {
						this.value(moment(this.value()));
					} else {
						this.value(undefined);
					}

					this.commit();
					render();
				}

				var disableWatch = false;
				$scope.$watch('model',function(value,ovalue) {

					/*if(disableWatch) {
						disableWatch = false;
						return;
					}*/

					service.disableScroll = true;



					/*if(value!=ovalue) {
						//Disable the next watch
						disableWatch = true;
					}*/

					setTimeout(function() {
						service.disableScroll = false;
					});
				});


				var padding = 300;
				var dateScroll = function(e) {

					if(e.target.scrollHeight<(e.target.scrollTop + e.target.offsetHeight + padding)) {
						return service.appendTop();
					} else if(e.target.scrollTop<padding) {
						return service.appendBottom();
					}

					return $q.resolve();
				}

				function windowScroll() {
					service.positionDialog();
				}

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
						angular.element(service.$date).on('scroll',function(e) {

							if(service.disableScroll) {
								return;
							}

							dateScroll(e);
						});
					});
				});

				function runAppenedPromises() {
					var func = appendPromises.shift();

					if(!func) {
						runningAppenedPromises = false;
						return;
					}

					func.then(function() {
						runAppenedPromises();
					})
				}

				angular.element(window).on('scroll resize',windowScroll);

				$scope.$on('$destroy',function() {
					angular.element(service.$date).off('scroll',dateScroll);
					angular.element(window).off('scroll',windowScroll);
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
