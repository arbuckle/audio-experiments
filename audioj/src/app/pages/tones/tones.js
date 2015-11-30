angular.module( 'pages.tones', [
    'ui.router'
  ])

  .config(function config( $stateProvider ) {
    $stateProvider.state( 'tones', {
      url: '/tones',
      views: {
        "main": {
          controller: 'ToneCtrl',
          templateUrl: 'pages/tones/tones.tpl.html'
        }
      },
      data:{ pageTitle: 'Tone Generator' }
    });
  })

  .controller( 'ToneCtrl', function ToneController( $scope, ToneService ) {
    // set options for the oscillator
    $scope.freq = 440;
    $scope.volume = 0.5;
    $scope.mute = true;
    $scope.aaa = false;

    ToneService.init();


    $scope.$watch("aaa", function(current, previous) {
      ToneService.aaa();
    });

    $scope.$watch("freq", function(current, previous) {
      ToneService.setFrequency($scope.freq);
    });
    $scope.$watch("volume", function(current, previous) {
      ToneService.setGain($scope.volume);
    });
    $scope.$watch("mute", function(current, previous) {
      if (current) {
        ToneService.mute();
      } else {
        ToneService.unmute();
      }
    });


    $scope.$destroy = function(){
      ToneService.reset();
    };



  })

;

