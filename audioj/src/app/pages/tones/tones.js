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

  .controller( 'ToneCtrl', function ToneController( $scope ) {
    var audioCtx,
        oscillator,
        oscillators,
        gainNode;

    $scope.freq = 440;
    $scope.volume = 0.5;
    $scope.mute = true;

    if (window.AudioContext) {
      audioCtx = new window.AudioContext();
    } else if (window.webkitAudioContext) {
      audioCtx = new window.webkitAudioContext();
    }

    if (!audioCtx) {
      $scope.error = "AudioContext is not supported by this browser.";
      return;
    }

    oscillators = {
      sine: 0,
      square: 1,
      sawtooth: 2,
      triangle: 3,
      custom: 4
    };


    // create Oscillator and gain node
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    // connect oscillator to gain node to speakers
    oscillator.connect(gainNode);
    if (!$scope.mute) {
      gainNode.connect(audioCtx.destination);
    }

    // set options for the oscillator
    oscillator.type = oscillators.square;
    oscillator.frequency.value = $scope.freq;
    oscillator.start();

    gainNode.gain.value = $scope.volume;

    $scope.$watch("freq", function(current, previous) {
      oscillator.frequency.value = $scope.freq;
    });
    $scope.$watch("volume", function(current, previous) {
      gainNode.gain.value = $scope.volume;
    });
    $scope.$watch("mute", function(current, previous) {
      if (current) {
        gainNode.disconnect(audioCtx.destination);
      } else {
        gainNode.connect(audioCtx.destination);
      }
    });



  })

;

