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