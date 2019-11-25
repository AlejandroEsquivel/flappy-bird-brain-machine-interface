const PORT = 12345;
const WS_PORT = 1234;
const HOST = '127.0.0.1';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: WS_PORT });



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

    let bandpower = []; 

    const channels = JSON.parse(message.toString('utf8')).data;

    channels.forEach((channelData, channelIndex) => {
        const [delta,theta,alpha,beta,gamma] = channelData;
        bandpower.push({ 
            delta, 
            theta, 
            alpha, 
            gamma, 
            channel: channelIndex + 1
         });
    })

    if(wss.clients.size && Math.round(Math.random()*(10)) === 5){
        wss.broadcast(bandpower);
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