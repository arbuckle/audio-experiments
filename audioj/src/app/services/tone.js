angular.module("audioj")

  .factory("ToneService", function($q){
    /*
     * This service provides a facility for grabbing and processing audio data from the user's microphone
     */


    var audioCtx,
        oscillator,
        oscillators,
        gainNode,
        error,
        freq = 440,
        volume = 0.5,
        mute = true;


    if (window.AudioContext) {
      audioCtx = new window.AudioContext();
    } else if (window.webkitAudioContext) {
      audioCtx = new window.webkitAudioContext();
    }

    if (!audioCtx) {
      error = "AudioContext is not supported by this browser.";
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

    oscillator.type = oscillators.square;
    oscillator.frequency.value = freq;
    oscillator.start();

    // set volume
    gainNode.gain.value = volume;

    /*
     * Public methods
     */
    return {
      setFrequency: function(freq) {
        oscillator.frequency.value = freq;
      },
      setGain: function(volume) {
        gainNode.gain.value = volume;
      },
      mute: function(){
        gainNode.disconnect(audioCtx.destination);
      },
      unmute: function(){
        gainNode.connect(audioCtx.destination);
      },
      init: function(){

      },
      reset: function(){
        freq = 440;
        volume = 0.5;
        mute = true;

        gainNode.disconnect(audioCtx.destination);
        gainNode.gain.value = volume;
        oscillator.frequency.value = freq;

      }



    };
  })

;
