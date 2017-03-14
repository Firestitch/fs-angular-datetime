'use strict';


angular.module('app')
  .controller('DemoCtrl', function ($scope) {


    $scope.text = '';
    
    $scope.submit = function() {
        alert('submit');
    }
});
