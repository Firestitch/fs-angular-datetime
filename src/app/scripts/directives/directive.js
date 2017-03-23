(function () {
    'use strict';

    angular.module('fs-angular-datetime',['fs-angular-util'])
    .directive('fsDatetime', function($timeout,$templateCache,$http,$compile,fsUtil) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/datetime.html',
            scope: {
               model: '=fsModel',
               label: '@?fsLabel',
               hasTime: '=?fsTime',
               hasDate: '=?fsDate',
               defaultTime: '@fsDefaultTime',
               hasRange: '=?fsRange',
               disabled: '=?fsDisabled',
               disabledDays: '=?fsDisabledDays',
               dateSelect: '@fsDateSelect',
               required: '=?fsRequired',
            },
            controller: function($scope) {

            	if($scope.hasDate===undefined) {
            		$scope.hasDate = true;
            	}

            	$scope.opened = false;
            	$scope.input = '';
            	$scope.depth = 6;
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

            	$scope.inputChange = function(type) {
            		var date = Date.parse($scope.input);
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
            			}
            		}
            	}

            	function createModel() {
            		if(!$scope.model) {
            			$scope.model = moment();
            		}
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

            	$scope.open = function() {
            		drawMonths($scope.model);
            		showMonth($scope.model);
            		positionDialog();
            		$scope.opened = true;
            	}

            	$scope.inputClick = function(e) {

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
/*
            		var s = document.querySelectorAll( ":hover" );

            		debugger;

            		if(e) {
            			debugger;
            		}
*/
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

            		if($scope.dateSelect) {
            			$timeout(function() {
            				$scope.$parent.$eval($scope.dateSelect);
            			});
            		}

            		if(!$scope.hasTime) {
            			$scope.close();
            		}
            	}

            	$scope.yearChange = function(year) {

            		if(!$scope.model) {
            			createModel();
            		}

            		setDate($scope.model.clone().year(year));

            		if($scope.dateSelect) {
            			$scope.$parent.$eval($scope.dateSelect);
            		}
            	}

            	$scope.monthChange = function(month) {

            		if(!$scope.model) {
            			createModel();
            		}

            		setDate($scope.model.clone().month(month - 1));

            		if($scope.dateSelect) {
            			$scope.$parent.$eval($scope.dateSelect);
            		}
            	}

            	$scope.minuteClick = function(minute) {

            		if(!$scope.model) {
            			createModel();
            		}

            		setDate($scope.model.clone().minute(minute));
            	}

            	$scope.hourClick = function(hour) {

            		if(!$scope.model) {
            			createModel();
            		}

            		setDate($scope.model.clone().hour(hour));
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
							time: date.format("x"),
							moment: date,
							weeks: weeks,
							months: [{ name: date.format('MMMM'), value: date.format('M')}],
							years: [date.format("YYYY")] }
            	}

            	function drawMonths(date) {

            		if(queryMonth(date)) {
            			return;
            		}

            		var date = date ? date : moment();
            		var month = date.clone().startOf('month').subtract($scope.depth/2,'months');

	        		$scope.months = [];
	        		for(var i=0;i<=$scope.depth;i++) {
	        			$scope.months.push(createMonth(month));
	        			month.add(1,'month');
	        		}
	        	}

	        	function showMonth(date) {

	        		setTimeout(angular.bind(this,function(d) {

	        			var d = d ? d : moment();
	        			var month = queryMonth(d);

	               		if(month) {
	               			service.$date.scrollTop = month.offsetTop - 52;
	               		}
	               	},date));
            	}

            	function queryMonth(date) {
            		if(!service.$date || !date) {
            			return undefined;
            		}

            		return service.$date.querySelector('.calendar-' + date.clone().startOf('month').format('x'));
            	}

            	function setDate(date) {
            		$scope.model = date;
            	}

            	var appending = false;
            	function append(value) {
            		if(appending) {
            			return;
            		}

            		var month = $scope.months[0];
            		if(value>0) {
            			month = $scope.months[$scope.months.length - 1];
            		}

            		if(month) {
            			var m = month.moment.clone().add(value,'month');

            			$scope.$apply(function() {
            				if(value>0) {
            					$scope.months.push(createMonth(m));
            					$scope.months.shift();
            				} else {
            					$scope.months.unshift(createMonth(m));
            					$scope.months.pop();
            				}
            				appending = false;
            			});
        			}
            	}

				function appendBottom() {
					append(-1);
            	}

            	function appendTop() {
            		append(1);
            	}

            	function positionDialog() {
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

            	$scope.$watch('model',function(date,odate) {

            		var format = [],
            			options = options || {};

               		if(date instanceof Date) {
               			date = moment(date);
               		}

            		if($scope.hasDate) {
            			format.push('MMM D, YYYY');
            		}

            		if($scope.hasTime) {
            			format.push('h:mm a');
            		}

            		if(date) {
	            		if(!$scope.focused) {
	            			$scope.input = date.format(format.join(' '));
	            			$scope.inputLength = $scope.input.length;
	            		}

		        		//if(!odate || !date.isSame(odate.clone().startOf('month').subtract($scope.depth/2,'months'))) {
		            		drawMonths(date);
		            	//}

		            	var year = parseInt(date.format('YYYY'));
		            	if(parseInt($scope.selectedYear)!=year) {
	            			$scope.yearList = [];
	            			for(var y=year + 100;y>(year-100);y--) {
	            				$scope.yearList.push(y);
	            			}
	            		}

	            		showMonth(date);
	            		$scope.selectedDate = date.format('YYYY-MM-DD');
	            		$scope.selectedHour = date.format('H');
	            		$scope.selectedMinute = date.format('m');
	            		$scope.selectedYear = date.format('YYYY');
            		}
            	});

            	var service = {
            		wrap: null,
            		createMonth: createMonth,
            		appendBottom: appendBottom,
            		appendTop: appendTop,
            		showMonth: showMonth,
            		drawMonths: drawMonths,
            		setDate: setDate,
            		positionDialog: positionDialog
            	};

            	return service;
            },
            link: function($scope, $el, attrs, ctrl) {

            	$scope.$el = $el;
               	$scope.$dialog = null;

               	var padding = 400;
               	var dateScroll = function(e) {
           			if(e.target.scrollTop<padding) {
           				ctrl.appendBottom();
           			} else if((e.target.scrollHeight)<(e.target.scrollTop + e.target.offsetHeight + padding)) {
           				ctrl.appendTop();
           			}
           		}

           		var windowScroll = function() {
           			ctrl.positionDialog();
           		}

               	setTimeout(function() {
	               	$http.get('views/directives/datetimedialog.html', {
	                    cache: $templateCache
	                }).then(function(response) {
	                	$scope.$dialog = angular.element(response.data);
	                    angular.element(document.body).append($scope.$dialog);
	                    $compile($scope.$dialog)($scope);
	                    var date = $scope.model ? $scope.model : moment();
	                    ctrl.$date = $scope.$dialog[0].querySelector('.date');
	               		angular.element(ctrl.$date).on('scroll',dateScroll);
	                });
	            });

	            angular.element(window).on('scroll resize',fsUtil.throttle(windowScroll,2));

                $scope.$on('$destroy',function() {
					angular.element(ctrl.$date).off('scroll',dateScroll);
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
               required: '=?fsRequired'
            },
            controller: function($scope) {

            	$scope.fromSelect = function() {
            		if($scope.from) {
            			$scope.toDisabledDays = [[moment().subtract(99,'year'),$scope.from.clone()]];
            		} else {
            			$scope.toDisabledDays = [];
            		}
            	}

            	$scope.toSelect = function() {
            		if($scope.to) {
            			$scope.fromDisabledDays = [[$scope.to.clone().add(1,'day'),moment().add(99,'year')]];
            		} else {
            			$scope.fromDisabledDays = [];
            		}
            	}
            }
       	}
    });

})();