'use strict';


angular.module('app')
  .controller('DemoCtrl', function ($scope) {


    $scope.text = '';
    $scope.disabled = [ [moment(),moment().add('day',7)] ];

    $scope.submit = function() {
        alert('submit');
    }
});
