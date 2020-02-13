const $ = require("jquery");
const eeg = require('./eeg.js');

// Generate DOM
(function generateChannelOptions (){ 
    [...Array(8)].forEach((n,index)=>{
        const channel = index+1;
        const option = $('<option></option>').text(`Channel ${channel}`).val(channel);
        option.appendTo($('#channel-selection'));
    })
})();

// Event Listeners
const relaxationSignalBtn = $('#relaxation-signal-btn');
const attentionSignalBtn = $('#attention-signal-btn');
const startGameBtn = $('#start-game-btn');
const channelSelection = $('#channel-selection');
const dataSelection = $('#data-selection');
const clearRecordedDataBtn = $('#clear-recorded-data-btn');
const sendRecordedDataBtn = $('#send-recorded-data-btn');

startGameBtn.click(() => {
    window.game.play();
});

channelSelection.change(function(){
    console.log({eeg})
    eeg.setChannel(this.value);
})

clearRecordedDataBtn.click(function(){
    const signalType = dataSelection.val();
    if(signalType){
        eeg.setRecordingSignalType(eeg.SignalTypes.NULL);
        eeg.recording[signalType] = [];
        dataSelection.val(eeg.SignalTypes.NULL);
        $('.data').hide();
    }
});

sendRecordedDataBtn.click(function(){
    const signalType = dataSelection.val();
    eeg.sendDataToServer(signalType);
})

relaxationSignalBtn.click(function(){

    const currentSignalType = eeg.recording.signalType;
    let newSignalType;

    if(currentSignalType === eeg.SignalTypes.RELAXATION){
        newSignalType = eeg.SignalTypes.NULL;
        relaxationSignalBtn.text('Record Relaxation Signal');
    }
    else {
        newSignalType = eeg.SignalTypes.RELAXATION;
        relaxationSignalBtn.text('Stop Recording Relaxation Signal');
        attentionSignalBtn.text('Record Attention Signal')
    }
    eeg.setRecordingSignalType(newSignalType);
})

attentionSignalBtn.click(function(){

    const currentSignalType = eeg.recording.signalType;
    let newSignalType;

    if(currentSignalType === eeg.SignalTypes.ATTENTION){
        newSignalType = eeg.SignalTypes.NULL;
        attentionSignalBtn.text('Record Attention Signal');
    }
    else {
        newSignalType = eeg.SignalTypes.ATTENTION;
        attentionSignalBtn.text('Stop Recording Attention Signal');
        relaxationSignalBtn.text('Record Relaxation Signal')
    }
    eeg.setRecordingSignalType(newSignalType);
})

// Display Recording data
dataSelection.change(function(){

    const signalType = this.value;

    if([eeg.SignalTypes.RELAXATION,eeg.SignalTypes.ATTENTION].indexOf(signalType) !== -1){
        $('.data').show();
        eeg.displayRecordingData(signalType);
    }
    else {
        $('.data').hide();
    }
})
