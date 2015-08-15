'use strict';

angular.module('votingAppApp')
  .controller('MainCtrl', function ($scope, $http, Auth) {
  
    //Initial Settings
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.getCurrentUser = Auth.getCurrentUser;
    $scope.polls = [];
    $scope.expanded = false;
    $scope.voted = false;
    $scope.error = false;
    
    
    //used with twitter to get link to a specific poll
    $http.get('/api/polls').success(function(polls) {
      $scope.polls = polls;
      $scope.name = $(location).attr('pathname');
      var pollRegex = /^(\/)(.+)(\/)(.+)$/;
	  if ($scope.name.match(pollRegex)) {
		$scope.name = $scope.name.substr(1);
		var madeBy = $scope.name.split('/')[0];
		var question = $scope.name.split('/')[1].toLowerCase();
		for (var index = 0; index < $scope.polls.length; index++) {
		  var scopeQuestion = $scope.polls[index].question.replace(/[ \?]/g,'').toLowerCase();
		  if ($scope.polls[index].madeBy === madeBy && scopeQuestion === question) {
			$scope.expandPoll(polls[index]);
			break;
		  }
		}
	  }
    });
    
    
    $scope.deletePoll = function(poll) {
      $http.delete('/api/polls/' + poll._id);
      $http.get('/api/polls').success(function(polls) {
        $scope.polls = polls;
      });
    };
    
    
    $scope.isMyPoll = function(poll){
      return Auth.isLoggedIn() && poll.user && (poll.user._id === Auth.getCurrentUser()._id);
    };


    //chart setup
	var canvas = document.getElementById('chart'),
      ctx = canvas.getContext('2d'),
      startingData = {
		labels: ['option'],
		datasets: [
			{
				fillColor: 'rgba(220,220,220,0.2)',
				strokeColor: 'rgba(220,220,220,1)',
				pointColor: 'rgba(220,220,220,1)',
				pointStrokeColor: '#fff',
				data: [1]
			}
		]
	  };
	$scope.pollChart = new Chart(ctx).Bar(startingData, {animationSteps: 15}); 
	

    //dynamically change the url a tweet will link to when the tweet button is clicked
    $scope.updateTwitterValues = function(shareUrl) {
	  $('#twitter-share-section').html('&nbsp;'); 
	  $('#twitter-share-section').html('<a href="https://twitter.com/share" class="twitter-share-button" data-url="' + shareUrl + '" data-size="large" data-text="Check out the polls I made: " data-count="none">Tweet</a>');
	  twttr.widgets.load();
	};


    //expand selected poll to show poll choice options, chart area, and tweet button
    $scope.expandPoll = function(poll) {
      $scope.expandedPoll = poll;
      //dynamically changing url in tweet is only possible when logged in
      if (Auth.isLoggedIn()) {
        var url = 'https://voting-app-emptyteacup.herokuapp.com/';
		  url += Auth.getCurrentUser().name + '/';
		  url += $scope.expandedPoll.question.replace(/[ \?]/g,'').toLowerCase();
		$scope.updateTwitterValues(url);
      }
      //initial settings
      $scope.expanded = false;
      $scope.voted = false;
      $scope.votedByUser = false;
      $scope.error = false;
      $('#poll-options').empty();
      //shows the poll's choice options
      for (var option in $scope.expandedPoll.options) {
        var input = '<input type="radio" name="vote-options" value="' + option + '">  ' + option + '</input><br>';
        $('#poll-options').append(input);
      }
      //stops users from voting on a poll twice
      for (var index = 0; index < $scope.expandedPoll.votedBy.length; index++) {
        if ($scope.expandedPoll.votedBy[index] === Auth.getCurrentUser().name) {
          $scope.votedByUser = true;
          break;
        }
      }
      //update chart to show selected poll's voting information
      if ($scope.expandedPoll.votedBy.length > 0) {
		for (var index2 = 0; index2 < $scope.pollChart.datasets[0].bars.length; index2++) {
		  $scope.pollChart.removeData();
		}  
		for (var option in $scope.expandedPoll.options) {
		  $scope.pollChart.addData([$scope.expandedPoll.options[option]], option);
		}
		if ($scope.pollChart.datasets[0].bars.length > Object.keys($scope.expandedPoll.options).length) {
		  $scope.pollChart.removeData();
		}
		$scope.pollChart.update();
			   
		$scope.voted = true;
	  }
      //if expanded is true, ng-show will show all of the info above
      $scope.expanded = true;
    };
		

    //executes when Vote button is clicked
    $scope.votePoll = function(expandedPoll) {
      //stops users from voting if no option is chosen or created
      if (!$('#extra-option').val() && !$('#poll-options input[type=radio]:checked').val()) {
        $scope.error = true;
        return;
      }
      $scope.expandedPoll = expandedPoll;
      var option;
      if ($('#extra-option').val()) { //if an option is created
        option = $('#extra-option').val();
        $scope.expandedPoll.options[option] = 1;
      } else { //if an existing option is chosen
        option = $('#poll-options input[type=radio]:checked').val();
        $scope.expandedPoll.options[option] += 1;
      }
      $scope.expandedPoll.votedBy = [Auth.getCurrentUser().name];
      $http.patch('/api/polls/' + $scope.expandedPoll._id, $scope.expandedPoll);
      //update $scope.polls which will automatically update in html as well
      $http.get('/api/polls').success(function(polls) {
        $scope.polls = polls;
      });
      //show the voted poll's update information
      $scope.expandPoll($scope.expandedPoll);
    };
  
  
    //fancy animation to allow user to create an option
    $scope.toggleExtraOption = function() {
      if (!$('#extra-option').hasClass('clicked')) {
        $('#extra-option').addClass('clicked');
      }
      $('#add-option').hide();
      var checkedOption = $('#poll-options input[type=radio]:checked');
      $(checkedOption).attr('checked', false);
    };
    //the input field to create a new option disappears when user clicks anywhere else
    $(document).mouseup(function (e) {
	  if (!$('#extra-option').is(e.target) && $('#extra-option').has(e.target).length === 0) {
		$('#extra-option').removeClass('clicked');
		$('#add-option').show();
		if (!$('#vote').is(e.target)) {
		  $('#extra-option').val('');
		}
	  }
	});
	
	
	$scope.totalVotes = function() {
      var totalVotes = 0;
      for (var index = 0; index < $scope.polls.length; index++) {
        if ($scope.isMyPoll($scope.polls[index])) {
          totalVotes += $scope.polls[index].votedBy.length;
        }
      }
      $('#total-voters').text('Total Voters: ' + totalVotes);
    };

});