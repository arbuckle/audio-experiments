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

  .controller( 'MicCtrl', function MicController( $scope ) {

    if (window.AudioContext) {
      audioCtx = new window.AudioContext();
    } else if (window.webkitAudioContext) {
      audioCtx = new window.webkitAudioContext();
    }

    navigator.getUserMedia = (navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia);

    if (!audioCtx || !navigator.getUserMedia) {
      $scope.error = "AudioContext or getUserMedia is not supported by this browser.";
      return;
    }


    var audioCtx,
        canvasFreq = document.getElementById("Frequency"),
        canvasFreqCtx = canvasFreq.getContext("2d"),
        canvasWaveform = document.getElementById("Oscilliscope"),
        canvasWaveformCtx = canvasWaveform.getContext("2d");

    var analyser = audioCtx.createAnalyser();

    navigator.getUserMedia(
      {
        audio: true,
        video: false
      },

      function (stream) {
        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;

        var source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.connect(gainNode);

        gainNode.connect(audioCtx.destination);
        visualize();
      },

      function (err) {
        $scope.error = err;
      }
    );



function visualize() {
  function prepare(canvas, canvasCtx, target) {
     var WIDTH, HEIGHT, drawVisual;

      WIDTH = canvas.width;
      HEIGHT = canvas.height;


      // determines the precision of the console display
      analyser.fftSize = 2048;

      // determines some sort of data averaging between frames.  setting to 0. default is 0.8.
      analyser.smoothingTimeConstant = 0;
      console.log(analyser);

      // read only.  this figure is 1/2 the fft size.
      var bufferLength = analyser.frequencyBinCount;

      // place in which to store the time domain data - this is what gets drawn.
      var dataArray = new Uint8Array(bufferLength);

      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      function draw() {

        drawVisual = requestAnimationFrame(draw);

        if (target===1) {
          analyser.getByteTimeDomainData(dataArray);
        } else if (target===2) {
          analyser.getByteFrequencyData(dataArray);
        }

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();

        var sliceWidth = WIDTH * 1.0 / bufferLength;
        var v,
            y,
            x = 0;

        for(var i = 0; i < bufferLength; i++) {

          //why 128?
          v = dataArray[i] / 128.0;

          if (target == 1) {
            y = v * HEIGHT/2; // centers the line within the oscilliscope.
          } else {

            y = (-v * HEIGHT/2) + (HEIGHT-0.2*HEIGHT); // fixesthe line at the bottom and reverses the Y axis.
          }

          // idk what thsis is doing
          if(i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height/2);
        canvasCtx.stroke();
      }

      draw();
  }

  prepare(canvasWaveform, canvasWaveformCtx, 1);
  prepare(canvasFreq, canvasFreqCtx, 2);

}


  })

;

