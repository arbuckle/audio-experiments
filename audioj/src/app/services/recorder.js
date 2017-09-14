angular.module("audioj")

  .factory("RecorderService", function($q){
    /*
     * This service provides a facility for grabbing and processing audio data from the user's microphone
     */


    var audioCtx,
        analyser,
        scriptBufferSize,
        buf,
        sampleRate,
        fundamentalFrequency,
        frequencyBin,
        audioProcessHandler,
        initialized,
        errors = [];

    /*
     * HTML5 Bullshit - normalizing cross-browser identifiers for loosely specified garbage features.
     */
    if (window.AudioContext) {
      audioCtx = new window.AudioContext();
    } else if (window.webkitAudioContext) {
      audioCtx = new window.webkitAudioContext();
    }

    navigator.getUserMedia = (navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia);



    /*
     * Autocorrelation Algorithm / Handlers.
     */

    var correlate = function(inData, lag) {
      // Accepts an array of PCM data and a lag value and calculates the dot product within the array for the
      // specified offset.
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


    frequencyBin = [];
    audioProcessHandler = function(e){

      var chan, sample,
          outData,
          inData,
          sum, zeros,
          inputBuffer = e.inputBuffer,
          outputBuffer = e.outputBuffer,
          dLen = outputBuffer.length;

      // array filtering functions.
      sum = function(a,b) {return a+b;};
      zeros = function(a) {return a!==0;};


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

      frequencyBin.push(sampleRate / (deltas.reduce(sum) / deltas.length) / 2 );
      if (frequencyBin.length > 5) {
        frequencyBin.shift();
      }

      fundamentalFrequency = Math.round(frequencyBin.reduce(sum) / frequencyBin.length);
    };



    /*
     * Public methods
     */
    return {
      die: function(){
        audioCtx = undefined;
      },
      init: function(){
        if (initialized) {
          return;
        }

        if (!audioCtx || !navigator.getUserMedia) {
          errors.push("AudioContext or getUserMedia is not supported by this browser.");
          return;
        }

        // Application constants
        scriptBufferSize = 4096;
        sampleRate = 44100;

        // Audio nodes.
        analyser = audioCtx.createAnalyser();
        buf = audioCtx.createScriptProcessor(scriptBufferSize, 2, 2);
        buf.onaudioprocess = audioProcessHandler;

        navigator.getUserMedia(
          {
            audio: true,
            video: false
          },

          function (stream) {
            initialized = true;

            var gainNode = audioCtx.createGain(),
                source = audioCtx.createMediaStreamSource(stream);

            // Turn off the volume for the inbound recorded stream.
            gainNode.gain.value = 0;

            // Connect the inbound stream to the script buffer.
            source.connect(buf);

            // Connect the buffer to an analyser node which will apply FFTs in C.
            buf.connect(analyser);

            // Connect the volume node (set to 0) and point the whole shebang at the audioCtx.
            analyser.connect(gainNode);
            gainNode.connect(audioCtx.destination);

          },

          function (err) {
            errors.push(err);
          }
        );

      },
      getFrequency: function() {
        return fundamentalFrequency;
      },
      isInitialized: function(){
        return initialized;
      },
      visualize: function(canvas, canvasCtx, target) {
       var WIDTH, HEIGHT, drawVisual;

        WIDTH = canvas.width;
        HEIGHT = canvas.height;


        // determines the precision of the console display
        // analyser.fftSize = 8192; 
        // an fft sized @ 8192 will yeild 4096 frequency buckets for your 44100/2 available frequencies
        // this means that each bucket represents a window with 5Hz of accuracy.
        // to find the specific bucket for a frequency, 16000/(44100/2) * 4096

        analyser.fftSize = 32768; 
        // an fft sized @ 32768 will yeild 16384 frequency buckets for your 44100/2 available frequencies
        // this means that each bucket represents a window with 1.34Hz of accuracy.
        // to find the specific bucket for a frequency, 16000/(44100/2) * 16384

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

          var sliceWidth = WIDTH * 1.0 / (13000-12600);
          var v,
              y,
              x = 0;

          for(var i = 12600; i < 13000; i++) {

            //why 128?  is this some sort of averaging / easing coefficient?
            v = dataArray[i] / 32.0;

            if (target == 1) {
              y = v * HEIGHT/2; // centers the line within the oscilliscope.
            } else {

              y = (-v * HEIGHT/2) + (HEIGHT-0.2*HEIGHT); // fixesthe line at the bottom and reverses the Y axis.
            }

            // draws the line.
            if(i === 12600) {
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



    };
  })

;
