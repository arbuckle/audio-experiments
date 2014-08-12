angular.module( 'pages.mic', [
    'ui.router'
  ])

  .config(function config( $stateProvider ) {
    $stateProvider.state( 'mic', {
      url: '/mic',
      views: {
        "main": {
          controller: 'MicCtrl',
          templateUrl: 'pages/mic/mic.tpl.html'
        }
      },
      data:{ pageTitle: 'Mic Capture' }
    });
  })
  .controller( 'MicCtrl', function MicController( $scope, $interval, RecorderService ) {

    var initInterval,
        freqInterval,
        rs = RecorderService,
        canvasFreq = document.getElementById("Frequency"),
        canvasFreqCtx = canvasFreq.getContext("2d"),
        canvasWaveform = document.getElementById("Oscilliscope"),
        canvasWaveformCtx = canvasWaveform.getContext("2d");

    rs.init();

    $scope.init = false;
    initInterval= $interval(function(){
      if (rs.isInitialized()) {
        $scope.init = true;

        $interval.cancel(initInterval);

        // Start a new interval to capture the frequency.
        freqInterval = $interval(function(){
          $scope.fundamental_frequency = rs.getFrequency();
        }, 50);

      }

    }, 100);

    $scope.$watch("init", function(current, prev){
      if (current && current !== prev) {
        // TODO:  when the scope reloads, performance here suffers greatly. Figure out why.
        // I'm not destroying the audio context when this unloads.
        rs.visualize(canvasWaveform, canvasWaveformCtx, 1);
        rs.visualize(canvasFreq, canvasFreqCtx, 2);
      }
    });

    $scope.$destroy = function(){

      if (freqInterval) {
        $interval.cancel(freqInterval);
      }
      if (initInterval) {
        $interval.cancel(initInterval);
      }
    };


  })

;

