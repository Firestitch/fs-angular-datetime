'use strict';


angular.module('app')
.controller('DemoCtrl', function ($scope, fsModal) {


    $scope.text = '';
    $scope.disabled = [ [moment(),moment().add(7,'day')] ];

    $scope.submit = function() {
        alert('submit');
    }

    $scope.model1 = moment();
    $scope.model3 = new Date();
    $scope.model4 = Date.now();

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
