window.ToneService = function() {
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

    function reset(){
        freq = 440;
        volume = 0.5;
        mute = true;

        gainNode.disconnect(audioCtx.destination);
        gainNode.gain.value = volume;
        oscillator.frequency.value = freq;
    }

    /*
     * Public methods
     */
    return {
        aaa: function () {
            setInterval(function () {
                //gainNode.gain.value = (gainNode.gain.value==1) ? 0 : 1;
                //console.log(gainNode.gain.value);
            }, 40);
        },
        setFrequency: function (freq) {
            oscillator.frequency.value = freq;
        },
        setGain: function (volume) {
            gainNode.gain.value = volume;
        },
        toggleMute: function() {
            if (mute) {
                gainNode.connect(audioCtx.destination);
            } else {
                gainNode.disconnect(audioCtx.destination);
            }
            mute = !mute;
        },
        mute: function () {
            gainNode.disconnect(audioCtx.destination);
        },
        unmute: function () {
            gainNode.connect(audioCtx.destination);
        },
        init: function () {
            reset();
        },
        reset: function () {
            reset();
        }
    };
}()

