const $ = require("jquery");

const { LogisticRegression } = require('machinelearn/linear_model');

const config = require('./config');

const { HTTP_HOST } = config;

//instantiate lr model instance
const lr = new LogisticRegression();

try{
    const model = require('./../model.json');
    lr.fromJSON(model);
} catch(err){
    alert('Error: You must train the logistic regression model before running application.');
    console.error(err);
}

//signal type constants
const ATTENTION = 'attention';
const RELAXATION = 'relaxation'; 
const NULL = 'null';

const eegDataLog = $('#eeg-data');
const recordingDataLog = $('#recording-data');

const log = el => msg => {
    const tailData = el.val().split('\n').slice(0,50).join('\n');
    el.val(`${msg}\n${tailData}`);
}

const EEG = {
    SignalTypes: {
        ATTENTION,
        RELAXATION,
        NULL
    },
    channel: 1,
    recording: {
        signalType: null,
        [ATTENTION]: [],
        [RELAXATION]: []
    },
    sendDataToServer: async function(signalType){
        
        const url = new URL('/record',HTTP_HOST);
        const data = this.recording[signalType];

        if(signalType===NULL || !data.length) { 
            return; 
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                signalType,
                data
            })
        });

        return response.json();
    },
    logOutput: log(eegDataLog),
    setRecordingSignalType: function(signalType){
        if([ATTENTION,RELAXATION,NULL].indexOf(signalType) !==-1){
            this.recording.signalType = signalType;
        }
    },
    setChannel: function(channel){
        this.channel = parseInt(channel);
    },
    updateRecordingData: function(data){
        const signalType = this.recording.signalType;
        if(signalType && signalType !== NULL){
           this.recording[signalType].push(data);
        }
    },
    displayRecordingData: function(signalType){

        const data = this.recording[signalType];
        const log = data.map(({alpha, beta, delta})=>{
            return `Alpha: ${alpha}, Beta: ${beta}, Delta: ${delta}`
        });

        recordingDataLog.val(log.join('\n'));
    },
    classifySignal: function(data){

        const CHANNEL = this.channel;

        let prediction = NULL;

        const channelBandpower = data.find(channelData => channelData.channel == CHANNEL);

        if(channelBandpower){

            const { alpha, beta, delta, theta } = channelBandpower;
            const R = beta/alpha;

            game.state.bandpowerRatio = R;

            if(R > 1){
                prediction = ATTENTION
            }
            else {
                prediction = RELAXATION
            }

            this.updateRecordingData(channelBandpower);
            this.logOutput(`${CHANNEL}: Alpha: ${alpha.toFixed(4)}, Beta: ${beta.toFixed(4)}, Delta: ${delta} R: ${R.toFixed(4)}`)

        }

        return prediction;
    },
    isAttentive: function(data){
        return this.classifySignal(data) === ATTENTION;
    }
}

module.exports = EEG;