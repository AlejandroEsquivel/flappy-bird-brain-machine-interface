const PORT = 12345;
const WS_PORT = 1234;
const HOST = '127.0.0.1';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: WS_PORT });

const MODES = {
    'BANDPOWER': 'BANDPOWER',
    'FFT': 'FFT',
    'TIMESERIES': 'TIMESERIES'
}

const mode = MODES.BANDPOWER;

server.on('listening', () => {
    console.log(`UDP Server listening on port: ${PORT}...`);
});

wss.on('listening',() => {
    console.log(`Waiting for Websocket client connections on port: ${WS_PORT}...`);
})

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

    if(wss.clients.size || Math.round(Math.random()*(10)) === 5){
        wss.broadcast(broadcastData);
        console.debug(`Broadcasted to ${wss.clients.size} clients | ${new Date().getTime()}`);
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

server.bind(PORT, HOST);