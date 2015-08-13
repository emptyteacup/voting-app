'use strict';

angular.module('votingAppApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      })
      .when('/:name/:question', {
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      });
  });