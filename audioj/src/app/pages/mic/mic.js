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
    var scriptBufferSize = 4096;
    var buf = audioCtx.createScriptProcessor(scriptBufferSize, 2, 2);



    /*
    * TODO:
    * 1.  Implement an autocorrelation algorithm to extract the natural tone from the PCM data.
    * 2.  Implement a spectrogram style visualization in which Khz is charted on the Y axis against time on the X axis.
    *     http://www.wildlife-sound.org/equipment/technote/micdesigns/ultrasonic.html
    * 3.  Research experiments with Morse, AM, FM for data transmission
    * 4.  Author own oscilloscope to unlock access to frequencies in excess of 24khz
    *
    * */


    /*
     * Autocorrelation:
     *
     * 1.  you take the sum of the dot-product of the input buffer with itself.  ie, sum(inData * inData)
     * 2.  you take the sum of the dot-product of the input buffer, shifted N samples (lag).  ie sum(inData[-N+1:-N] * inData[N:])
     *      - noting that a higher lag value is required to detect the pitch of a lower frequency.
     *      - PCM takes 2 samples for each Hz - 44100 sample rate is required to sample the variance between the crest and trough of a 22050Hz sine wave.
     *      - (1000ms / 40Hz) * 2 = 50 samples
     *      - (1000ms / 19000Hz) * 2 = 0.1 samples??
     * 3.  For each script buffer sampling period, N==50.
     * 4.  Walk the array of correlate values for each N offset and estimate the decimal # of samples between peak and trough
     * 5.  Divide this estimate into 44,100
     * 6.  Store the estimate as well as the variance (-1 to +1) in an array
     * 7.  Every second or so, take the moving average of the peak observed variance in all the data processed during that period.
     * 8.  This is your fundamental frequency.
     */
    var correlate = function(inData, lag) {
      var i,
          inCopy,
          bin = 0;

      inCopy = inData.subarray(lag);
      inData = inData.subarray(0, (-1*lag || undefined));

      for (i=0; i < scriptBufferSize-lag; i ++) {
        bin += inData[i] * inCopy[i];
      }

      return bin;
    };

    var frequencyBin = [];
    buf.onaudioprocess = function(e){

      var chan, sample,
          outData,
          inData,
          inputBuffer = e.inputBuffer,
          outputBuffer = e.outputBuffer,
          dLen = outputBuffer.length;

      // array filtering functions.
      var sum = function(a,b) {return a+b;};
      var zeros = function(a) {return a!==0;};


      // Writing the input data directly to the output buffer.
      // At some point, this may be a good place to plug in streaming measurement functions.
      for (chan=0; chan < outputBuffer.numberOfChannels; chan ++) {
        inData = inputBuffer.getChannelData(chan);
        outData = outputBuffer.getChannelData(chan);
        for (sample = 0; sample < dLen; sample++) {
          outData[sample] = inData[sample];
        }
      }


      // Autocorrelation algorithm begins here.
      //
      var c,
          channelData = inputBuffer.getChannelData(0),
          correlateValues = [0],
          d = 0,
          variance = [],
          deltas = [];
      for (var i=1; i < 201; i ++) {
        c = correlate(channelData, i);
        correlateValues.push(c);
        if (c < correlateValues[i-1]) {
          d += 1;
        } else {
          deltas.push(d);
          variance.push(correlateValues[i-d] - correlateValues[i-1]);
          d = 0;
        }
      }


      // Removing zero values from list of correlated deltas.
      // The delta calculation component only measures the delta between the top of a wave and the downslope.
      // This is technically an oversight, but the frequency measurements are good enough without accounting for the
      // upward slope that it's easier to filter the array on the basis of
      deltas = deltas.filter(zeros);

      //console.log("values", correlateValues);
      //console.log("deltas", deltas);
      //console.log("average delta", deltas.reduce(sum) / deltas.length );
      //console.log("frequency estimate", 44100 / (deltas.reduce(sum) / deltas.length) / 2 );
      //console.log(freq.reduce(sum) / freq.length);
      //console.log("variance", variance);

      frequencyBin.push(44100 / (deltas.reduce(sum) / deltas.length) / 2 );
      if (frequencyBin.length > 5) {
        frequencyBin.shift();
      }
      $scope.$apply(function(scope){
        scope.fundamental_frequency = Math.round(frequencyBin.reduce(sum) / frequencyBin.length);
      });

    };

    navigator.getUserMedia(
      {
        audio: true,
        video: false
      },

      function (stream) {
        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;

        var source = audioCtx.createMediaStreamSource(stream);
        source.connect(buf);
        buf.connect(analyser);
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

          //why 128?  is this some sort of averaging / easing coefficient?
          v = dataArray[i] / 128.0;

          if (target == 1) {
            y = v * HEIGHT/2; // centers the line within the oscilliscope.
          } else {

            y = (-v * HEIGHT/2) + (HEIGHT-0.2*HEIGHT); // fixesthe line at the bottom and reverses the Y axis.
          }

          // draws the line.
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

