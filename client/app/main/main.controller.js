'use strict';
//var Chart = require('~/Workspace/node-projects/voting-app/client/bower_components/Chart.js/Chart.js');

angular.module('votingAppApp')
  .controller('MainCtrl', function ($scope, $http, Auth) {
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.getCurrentUser = Auth.getCurrentUser;
    $scope.polls = [];
    $scope.expanded = false;
    $scope.voted = false;


    $http.get('/api/polls').success(function(polls) {
      $scope.polls = polls;
    });


    $scope.addPoll = function() {
      $('#error-message').remove();
      if($scope.question === '') {
        return;
      }
      
      for (var index = 0; index < $scope.polls.length; index++) {
        if ($scope.question === $scope.polls[index].question && Auth.getCurrentUser().name === $scope.polls[index].madeBy) {
		  var errorMessage = '<span id="error-message">You already made this question.</span>'
		  $('#question input').last().after(errorMessage);
		  return;
		}
      }
      
      $scope.options = {};
	  $('#options input[type=text]').each(function() {
	    $scope.options[$(this).val()] = 0;
	  });
      
      $http.post('/api/polls', { question: $scope.question, madeBy: Auth.getCurrentUser().name, options: $scope.options, votedBy: [] });
      $scope.question = '';
      
      $http.get('/api/polls').success(function(polls) {
        $scope.polls = polls;
        $scope.expandedPoll = $scope.polls[$scope.polls.length - 1];
        $scope.expandPoll($scope.expandedPoll);
      });
      
    };


    $scope.deletePoll = function(poll) {
      $http.delete('/api/polls/' + poll._id);
      $http.get('/api/polls').success(function(polls) {
        $scope.polls = polls;
      });
    };
    
    
    $scope.isMyPoll = function(poll){
      return Auth.isLoggedIn() && poll.user && (poll.user._id === Auth.getCurrentUser()._id);
    };
    
    
    $scope.moreOptions = function() {
      $('#options').append('<input type="text" class="form-control">');
    };

	 
	var canvas = document.getElementById('chart'),
      ctx = canvas.getContext('2d'),
      startingData = {
		labels: [],
		datasets: [
			{
				fillColor: "rgba(220,220,220,0.2)",
				strokeColor: "rgba(220,220,220,1)",
				pointColor: "rgba(220,220,220,1)",
				pointStrokeColor: "#fff",
				data: []
			}
		]
	  };
	var pollChart = new Chart(ctx).Bar(startingData, {animationSteps: 15}); 


    $scope.expandPoll = function(poll) {
      $scope.expandedPoll = poll;
      $scope.voted = false;
      $scope.expanded = false;
      $('#poll-options').empty();
      
      for (var index = 0; index < $scope.expandedPoll.votedBy.length; index++) {
        if ($scope.expandedPoll.votedBy[index] === Auth.getCurrentUser().name) {
         
		  for (var index2 = 0; index2 < pollChart.datasets[0].bars.length; index2++) {
			pollChart.removeData();
		  }  
		  for (var option in $scope.expandedPoll.options) {
			pollChart.addData([$scope.expandedPoll.options[option]], option);
		  }
		  if (pollChart.datasets[0].bars.length > Object.keys($scope.expandedPoll.options).length) {
			pollChart.removeData();
		  }
		  pollChart.update();
		 		 
		  $scope.voted = true;
          $scope.expanded = true;
          return;
        }
      }
     
      for (var option in poll.options) {
        var option = '<input type="radio" name="vote-options" value="' + option + '">' + option + '</input><br>';
        $('#poll-options').append(option);
      }
      $scope.expanded = true;
    };
		

    $scope.votePoll = function(expandedPoll) {
      $scope.expandedPoll = expandedPoll;
      
      var checkedOption = $('#poll-options input[type=radio]:checked').val();
      $scope.expandedPoll.options[checkedOption] += 1;
      
      $scope.expandedPoll.votedBy = [Auth.getCurrentUser().name];
      $http.patch('/api/polls/' + $scope.expandedPoll._id, $scope.expandedPoll);
      
      $http.get('/api/polls').success(function(polls) {
      $scope.polls = polls;
    });
    };
    
    
    $scope.totalVotes = function() {
      var totalVotes = 0;
      for (var index = 0; index < $scope.polls.length; index++) {
        if ($scope.isMyPoll($scope.polls[index])) {
          totalVotes += $scope.polls[index].votedBy.length;
        }
      }
      $('#total-voters').text('Total Voters: ' + totalVotes);
    };
    
    
    $scope.testFunction = function() {
      
    };
    
});