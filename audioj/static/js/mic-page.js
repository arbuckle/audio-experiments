(function() {

    var initInterval,
        freqInterval,
        rs = RecorderService,
        freqElement = document.getElementById("freq"),
        canvasFreq = document.getElementById("Frequency"),
        canvasFreqCtx = canvasFreq.getContext("2d"),
        canvasWaveform = document.getElementById("Oscilliscope"),
        canvasWaveformCtx = canvasWaveform.getContext("2d");

    rs.init();

    rs.visualize(canvasWaveform, canvasWaveformCtx, 1);
    rs.visualize(canvasFreq, canvasFreqCtx, 2);

    setInterval(function () {
        freqElement.innerText = rs.getFrequency();
    }, 100);

}());