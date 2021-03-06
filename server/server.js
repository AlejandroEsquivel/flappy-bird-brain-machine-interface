const UDP_PORT = 12345;
const WS_PORT = 1234;
const HTTP_PORT = 8184;
const HOST = '127.0.0.1';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const express = require('express');
const fs = require('fs');
const cors = require('cors');

const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(cors());

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: WS_PORT });

const MODES = {
    'BANDPOWER': 'BANDPOWER',
    'FFT': 'FFT',
    'TIMESERIES': 'TIMESERIES',
    'FOCUS_WIDGET': 'FOCUS_WIDGET'
}

const SIGNAL_TYPES = {
    'ATTENTION': 'attention',
    'RELAXATION': 'relaxation'
}

const mode = MODES.BANDPOWER;


wss.broadcast = (data) =>{
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    })
}

wss.on('connection', function connection(ws) {
    console.log('Established connection with websocket client.')
    ws.isAlive = true;
    ws.on('pong', ()=> {
        ws.isAlive = true
    });
  });


server.on('message', (message, remote)=> {

    let broadcastData;
    let eegData;

    switch (mode) {
        case MODES.BANDPOWER:
            
        eegData = JSON.parse(message.toString('utf8')).data;

            eegData.forEach((channelData, channelIndex) => {
                broadcastData = broadcastData || [];
                const [delta, theta, alpha, beta, gamma] = channelData;
                broadcastData.push({
                    delta,
                    theta,
                    alpha,
                    gamma,
                    beta,
                    channel: channelIndex + 1
                });
            });
        break;
        default:
            eegData =  JSON.parse(message.toString('utf8').replace(']','')).data;
            broadcastData = eegData;
        break;
    }

    if(wss.clients.size){
        wss.broadcast(broadcastData);
    }

});

app.post('/record', (req, res) => {

    const { signalType, data } = req.body;

    try {

        if(Object.values(SIGNAL_TYPES).indexOf(signalType) === -1){
            throw new Error('Invalid signalType');
        }
        
        const datasetPath = `./../datasets/${signalType}.json`;
        const datasetExists = fs.existsSync(datasetPath);
    
        if(datasetExists){
            let existingData = JSON.parse(fs.readFileSync(datasetPath));
            existingData = existingData.concat(data);
            fs.writeFileSync(datasetPath,JSON.stringify(existingData));
        }
        else {
            fs.writeFileSync(datasetPath,JSON.stringify(data));
        }
    
        return res.status(200).json({
            message: 'Wrote to corresponding dataset path',
            datasetPath
        });

    } catch(err){

        return res.status(400).json({
            message: err.message
        });
        
    }

});

// sever connections with inactive clients.
setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
            console.log('Closed inactive connection with websocket client.');
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping(()=>{});
    });
}, 1000*10);

server.bind(UDP_PORT, HOST);

app.listen(HTTP_PORT, ()=> {
    console.log(`HTTP Server listening on port: ${HTTP_PORT}...`)
});

server.on('listening', () => {
    console.log(`UDP Server listening on port: ${UDP_PORT}...`);
});

wss.on('listening',() => {
    console.log(`Waiting for Websocket client connections on port: ${WS_PORT}...`);
})