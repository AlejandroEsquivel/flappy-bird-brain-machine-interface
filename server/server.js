const UDP_PORT = 12345;
const WS_PORT = 1234;
const HTTP_PORT = 8184;
const HOST = '127.0.0.1';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const express = require('express');

const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: WS_PORT });

const MODES = {
    'BANDPOWER': 'BANDPOWER',
    'FFT': 'FFT',
    'TIMESERIES': 'TIMESERIES'
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

    const eegData = JSON.parse(message.toString('utf8')).data;

    switch (mode) {
        case MODES.BANDPOWER:
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
            broadcastData = eegData;
        break;
    }

    if(wss.clients.size || Math.round(Math.random()*(10)) < 5){
        wss.broadcast(broadcastData);
        //console.debug(`Broadcasted to ${wss.clients.size} clients | ${new Date().getTime()}`);
    }

});

app.post('/record', (req, res) => {
    
    const { signalType, data } = req.body;

    return res.status(200).json({
        signalType
    });
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