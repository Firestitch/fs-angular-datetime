'use strict';


angular.module('app')
.controller('DemoCtrl', function ($scope, fsModal) {


    $scope.text = '';
    $scope.disabled = [ [moment(),moment().add(7,'day')] ];

    $scope.submit = function() {
        alert('submit');
    }

    $scope.update = function() {
        $scope.model2 = moment();
    }

    $scope.open = function() {
        fsModal.show('','views/patterns/include.html');
    }
});
