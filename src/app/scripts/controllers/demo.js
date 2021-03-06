'use strict';


angular.module('app')
.controller('DemoCtrl', function ($scope, fsModal) {


    $scope.text = '';
    $scope.disabledDays = [ [moment(),moment().add(7,'day')] ];
    $scope.disabledHours = [ [0,13],20 ];
    $scope.disabledMinutes = [ [0,33],45 ];

    $scope.submit = function() {
        alert('submit');
    }

    $scope.model1 = undefined;
    $scope.model3 = undefined;
    $scope.model6 = moment();

    $scope.modelUpdate = Date.now();

    $scope.updateInvalid = function() {
        //$scope.model2 = moment();
        $scope.modelUpdate = '34298y7432gbfsd';
    }

    $scope.updateInt = function() {
        $scope.modelUpdate = Date.now() - (60*60*24*10)*1000;
    }

    $scope.open = function() {
        fsModal.show('','views/patterns/include.html');
    }

    $scope.change = function() {
    	console.log('Change',$scope.modelChange);
    }
});
