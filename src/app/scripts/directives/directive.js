(function () {
    'use strict';

    angular.module('fs-angular-datetime',[])
    .directive('fsDatetime', function($timeout,$templateCache,$http,$compile) {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/datetime.html',
            scope: {
               model: '=fsModel',
               label: '@?fsLabel',
               hasTime: '=?fsTime',
               hasDate: '=?fsDate',
            },
            controller: function($scope) {

            	if($scope.hasDate===undefined) {
            		$scope.hasDate = true;
            	}

            	$scope.open = false;
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

            	$scope.inputChange = function() {
            		var date = Date.parse($scope.input);
            		if(date) {
            			$scope.model = moment(date);
            			if($scope.model) {
            				setDate($scope.model,{ inputUpdate: false });
            				drawMonths($scope.model);
            				showMonth($scope.model);
            			}
            		}
            	}

            	$scope.inputBlur = function(e) {
            		setDate($scope.model);
            		if(!parentDialog(e.relatedTarget)) {
            			$scope.close();
            		}
            	}

     			$scope.inputFocus = function() {
            		$scope.open = true;
           			showMonth($scope.model);
            	}

            	$scope.inputKeyup = function(e) {
            		if(e.keyCode == 13) {
            			$scope.inputBlur(e);
            		}
            	}

            	$scope.inputClick = function(e) {

            		var input = e.target;
            		var pos = null;
            		if ('selectionStart' in input) {
			            // Standard-compliant browsers
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

					$scope.open = true;
           			showMonth($scope.model);
        		}

            	function parentDialog(el) {
            		if(el) {
            			if(angular.element(el).hasClass('dialog')) {
            				return true;
            			} else {
            				return parentDialog(el.parentElement);
            			}
            		}

            		return false;
            	}

            	function createMonth(moment) {
            		var moment = moment.clone().date(1);

        			var days = [], weeks = [];
        			var week = [];
        			var md = moment.clone();

        			md.subtract(moment.day(),'day');
        			var daysInMonth = moment.daysInMonth();

        			for(var d=0;d<daysInMonth + moment.day() + (6 - moment.clone().add(1,'month').day() + 1);d++) {
        				var number = md.format('DD');
        				days.push({ number: number });

        				if(d % 7==0) {
        					week = [];
        					weeks.push(week);
        				}

        				week.push({ mute: (d - moment.day()<0 || ((d - moment.day() + 1) > daysInMonth)),
									date: md.format('YYYY-MM-DD'),
									number: md.format('D'),
        							month: md.format('M'),
									year: md.format('YYYY') });

        				md.add(1,'day');
        			}

            		return {name: moment.format('MMMM'),
							number: moment.format("M"),
							year: moment.format("YYYY"),
							time: moment.format("x"),
							moment: moment,
							weeks: weeks,
							months: [{ name: moment.format('MMMM'), value: moment.format('M')}],
							years: [moment.format("YYYY")] }
            	}

            	$scope.monthClick = function(month) {
            		angular.extend(month.months,$scope.monthList);
            	}

            	$scope.yearClick = function(month) {
            		angular.extend(month.years,$scope.yearList);
            	}

            	function drawMonths(moment) {
            		var depth = 6;
	        		$scope.months = [];
	        		var m = moment.clone().startOf('month').subtract(depth/2,'months');
	        		for(var i=0;i<=depth;i++) {
	        			$scope.months.push(createMonth(m));
	        			m.add(1,'month');
	        		}
	        	}

	        	function showMonth(moment) {
	        		setTimeout(function() {
	               		var selected = service.$date.querySelector('.calendar-' + moment.clone().startOf('month').format('x'));

	               		if(selected) {
	               			service.$date.scrollTop = selected.offsetTop - 52;
	               		}
	               	});
            	}

            	function setDate(moment,options) {
            		var format = [],
            			options = options || {};

            		if($scope.hasDate) {
            			format.push('MMM D, YYYY');
            		}

            		if($scope.hasTime) {
            			format.push('h:mm a')
            		}

            		if(options.inputUpdate===undefined) {
            			$scope.input = $scope.model.format(format.join(' '));
            		}

            		$scope.selectedDate = $scope.model.format('YYYY-MM-DD');
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

            	$scope.daySelect = function(year,month,day) {
            		$scope.model
            				.year(year)
            				.month(month - 1)
            				.date(day);
            		setDate($scope.model);
            		$scope.close();
            	}

            	$scope.close = function() {
					$scope.open = false;
            	}

            	$scope.yearSelect = function(year) {
            		$scope.model
            				.year(year);
            		setDate($scope.model);
            		drawMonths($scope.model);
            		showMonth($scope.model);
            	}

            	$scope.monthSelect = function(month) {
            		$scope.model.month(month - 1);
            		setDate($scope.model);
            		drawMonths($scope.model);
            		showMonth($scope.model);
            	}

            	$scope.$watch('model',function(moment) {
            		if(moment) {
            			var year = parseInt(moment.format('YYYY'));
            			$scope.yearList = [];
            			for(var y=year + 100;y>(year-100);y--) {
            				$scope.yearList.push(y);
            			}
            		}
            	});

            	var service = {
            		wrap: null,
            		createMonth: createMonth,
            		appendBottom: appendBottom,
            		appendTop: appendTop,
            		showMonth: showMonth,
            		drawMonths: drawMonths,
            		setDate: setDate
            	};

            	return service;
            },
            link: function($scope, $el, attrs, ctrl) {

            	$scope.$watchGroup(['hasTime','hasDate'],function(value) {
            		value[0] ? $el.addClass("has-time") : $el.removeClass("has-time");
            		value[1] ? $el.addClass("has-date") : $el.removeClass("has-date");
            	});

               	if(!$scope.model) {
               		$scope.model = moment();
               	}

               	var el = $el[0];

               	setTimeout(function() {
	               	$http.get('views/directives/datetimedialog.html', {
	                    cache: $templateCache
	                }).then(function(response) {
	                    $el.append(response.data);
	                    $compile(angular.element(el.querySelector('.dialog')))($scope);

	                    if($scope.hasTime) {
							var clock = el.querySelector('.time .clock');
							for (var i=1; i<=12; i++) {
								var nmb = document.createElementNS("http://www.w3.org/2000/svg","text");
							  	var ang = 90 - 30 * i,
							  		nx = 48 + 38 * Math.cos(ang*Math.PI/180),
							  		ny = 52 - 38 * Math.sin(ang*Math.PI/180);
							 	nmb.setAttributeNS(null,"x",nx);
							  	nmb.setAttributeNS(null,"y",ny);
							 	nmb.setAttributeNS(null,"font-size","8");
								nmb.appendChild(document.createTextNode(i));
								clock.appendChild(nmb);
							}

							var movingElem = null;
							function mouseDown(e) {
								movingElem = e.target;
							}

							function mouseUp(e) {
								movingElem = null;
							}

							function mouseMove(e) {
							  	if (movingElem) {
								    // get mouse coords in the svg coordinate system and
								    // calculate angle in relation to the mid-point (50, 50)
								    // more info: https://developer.mozilla.org/en/docs/Web/API/SVGMatrix
									var vwp = movingElem.nearestViewportElement,
										ctm = vwp.getScreenCTM(),
								        pnt = vwp.createSVGPoint();
										pnt.x = e.clientX;
										pnt.y = e.clientY;
								    var loc = pnt.matrixTransform(ctm.inverse());
										var deg = 90 - Math.atan2(50 - loc.y, loc.x - 50) * 180 / Math.PI;
										movingElem.setAttribute('transform', 'rotate(' + deg + ' 50 50)');
							  	}
							}
							var min = el.querySelector('.time .hands .min');
							var hour = el.querySelector('.time .hands .hour');
							min.addEventListener('mousedown', mouseDown, false);
							hour.addEventListener('mousedown', mouseDown, false);
							document.addEventListener('mouseup', mouseUp, false);
							document.addEventListener('mousemove', mouseMove, false);
						}

	                    ctrl.drawMonths($scope.model);
	                    var padding = 400;
	                    //var timeout = null;
	               		ctrl.$date = el.querySelector('.date');
	               		angular.element(ctrl.$date).on('scroll',function(e) {
	               			if(e.target.scrollTop<padding) {
	               				ctrl.appendBottom();
	               				//clearTimeout(timeout);
	               				//timeout = setTimeout(calendarEnable,100);
	               			} else if((e.target.scrollHeight)<(e.target.scrollTop + e.target.offsetHeight + padding)) {
	               				ctrl.appendTop();
	               				//clearTimeout(timeout);
	               				//timeout = setTimeout(calendarEnable,100);
	               			}
	               		});
	                });
	            });

               	/*function calendarEnable() {
               		//debugger;
               	}*/

               	if($scope.model) {
               		ctrl.setDate($scope.model);
              	}

                $scope.$on('$destroy',function() {
					ctrl.$date.off('scroll');
				});
            }
        };
    });
})();