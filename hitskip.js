const AUDIO_CTX = new (window.AudioContext || window.webkitAudioContext)();

const AUDIO = {
    bass: {
        filename: 'samples/bass.ogg',
        buffer: null,
        source: null
    },

    hit: {
        filename: 'samples/hit.ogg',
        buffer: null,
        source: null
    },

    tick: {
        filename: 'samples/tick.ogg',
        buffer: null,
        source: null
    }
};

const TRACK_LENGTH = 8;

const SKIP_THRESHOLD = {
    always: 0.0,
    often: 0.25,
    sometimes: 0.50,
    rarely: 0.75,
    never: 1.0
};

let PLAY = false;

function init() {
    for (var drumType in AUDIO) {
        initAudio(drumType);
    }

    stop();

    updateBPM();
}

function refreshSource(drumType) {
    let buffer = AUDIO[drumType].buffer;
    source = AUDIO_CTX.createBufferSource();
    source.buffer = buffer;
    source.connect(AUDIO_CTX.destination);
    AUDIO[drumType].source = source;
}

function initAudio(drumType) {
    let request = new XMLHttpRequest();

    let filename = AUDIO[drumType].filename;
    request.open('GET', filename, true);
    request.responseType = 'arraybuffer';
    request.onload = () => {
        let audioData = request.response;
        AUDIO_CTX.decodeAudioData(audioData).then(buffer => {
            AUDIO[drumType].buffer = buffer;
            refreshSource(drumType);
        });
    };

    request.send();
}

function playHandler() {
    if (PLAY) {
        stop();
    } else {
        start();
    }
}

function start() {
    PLAY = true;
    document.getElementById('playToggle').innerHTML = 'stop';
    setTimeout(scheduleBeat, 0, Date.now(), 0);
}

function stop() {
    PLAY = false;
    document.getElementById('playToggle').innerHTML = 'start!';
}

function getDrum(drumType, trackIndex) {
    let id = drumType + trackIndex;
    return document.getElementById(id).checked;
}

function getBPM() {
    let bpmValue = document.getElementById('bpmSlider').value;
    return parseInt(bpmValue);
}

function updateBPM() {
    let newBPM = document.getElementById('bpmSlider').value;
    let bpmIndicator = document.getElementById('bpmIndicator');
    bpmIndicator.innerHTML = newBPM;
}

function getSkipRate(drumType) {
    let id = drumType + 'Rate';
    let rates = document.getElementById(id);
    let rate = rates.options[rates.selectedIndex].value;
    return rate;
}

function scheduleBeat(startTime, trackIndex) {
    if (!PLAY)
        return;

    if (trackIndex === TRACK_LENGTH)
        trackIndex = 0;

    const beatDur = 30000 / getBPM();

    let msElapsed = null;
    let msToNextBeat = null;
    for (var drumType in AUDIO) {
        msElapsed = Date.now() - startTime;
        msToNextBeat = beatDur - (msElapsed % beatDur);
        maybePlay(drumType, trackIndex, msToNextBeat);
    }

    const msToNextSchedule = (beatDur / 2) + msToNextBeat;
    setTimeout(scheduleBeat, msToNextSchedule, startTime, trackIndex + 1);
}

function maybePlay(drumType, trackIndex, delay) {
    let drumOn = getDrum(drumType, trackIndex);
    if (!drumOn) {
        return;
    }

    let skipRate = getSkipRate(drumType);
    let threshold = SKIP_THRESHOLD[skipRate];
    if (Math.random() < threshold) {
        return;
    }

    let source = AUDIO[drumType].source;
    delay = AUDIO_CTX.currentTime + (delay / 1000);
    source.start(delay);

    refreshSource(drumType);
}

window.onload = () => {
    init();
};
