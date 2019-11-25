/*
    Notes:
    To change width we will have to edit the bg, fg (ground) image dimensions.
*/

require("babel-polyfill");
require('bootstrap/dist/css/bootstrap.min.css');

window.$ = require("jquery");
const Sprite = require('./classes/Sprite');
const WebSocket = require('isomorphic-ws');
const BarChart = require('./classes/BarChart');

// coordinates measured from top-left (0,0) origin
const cvs = document.getElementById('canvas');
const ctx = cvs.getContext('2d');

// establish connection to websocket server
const ws = new WebSocket('ws://localhost:1234');

ws.onopen = function open() {
    console.log('Connected to websocket server');
};
ws.onclose = function close() {
    console.log('Disconnected to websocket server');
};

// global configuration
window.assets = [];
window.ctx = ctx;
ctx.font = "20px Arial";

// define images
const bird = new Sprite('./images/bird.png');
const background = new Sprite('./images/bg.png');
const ground = new Sprite('./images/fg.png');

// initilize Game State & Constants
const PIPE_SPEED = 1;
const BIRD_PROPEL_ACCELERATION = 50;
const MAX_PIPE_HEIGHT_PROPORTION = 0.50;
const DRAW_ONCE = 'DRAW_ONCE';
const CHANNEL = 6;
const ACTION_TYPES = {
    'UP': 'UP',
    'DOWN': 'DOWN'
}

let GROUND_POSITION; //calculated once assets load

// state and game methods
window.game = {
    pipes: [],
    state: {
        assetsLoaded: false,
        started: false,
        over: false, 
        score: 0,
        bandpowerRatio: 0
    },
    play: () => {
        if(game.state.started){ return; }
        game.state.started = true;
        return generateNewPipe().then(drawFrame);
    },
    reset: () => {
        if(!game.state.assetsLoaded){ return; }
        setDefaultState();
        return drawFrame(DRAW_ONCE);
    },
    stop: (waitTime) => {
        game.state.over = true;
        return waitTime ? 
            setTimeout(game.reset, waitTime || 1000) : 
            game.reset();
    }
}

function setDefaultState() {
    game.state.score = 0;
    game.pipes = [];
    game.state.over = false;
    game.state.started = false;
    bird.coords = { x: bird.element.width, y: GROUND_POSITION };
}

// Utility functions

const generateNewPipe = async () => {
    const pipe = new Sprite('images/pipeSouth.png');
    //wait until asset loads
    await pipe.onLoad();
    pipe.coords = {
        x: cvs.width,
        y: cvs.height - Math.round(Math.random() * pipe.element.height * MAX_PIPE_HEIGHT_PROPORTION) - ground.element.height
    }

    game.pipes.push(pipe);
}

// ------- Draw Frame Method
async function drawFrame(cmd) {

    const { x: bX, y: bY } = bird.coords;
    const { width: bW, height: bH } = bird.element;

    // draw scene
    background.draw();
    ground.draw(0, cvs.height - ground.element.height);

    // draw bird
    bird.draw();

    // draw pipes
    let pipe, pX, pY;
    for (var i = game.pipes.length - 1; i >= 0; i--) {
        pipe = game.pipes[i];
        pX = pipe.coords.x;
        pY = pipe.coords.y;
        pW = pipe.element.width;
        pH = pipe.element.height;
        pipe.moveLeft(PIPE_SPEED);

        // detect collision, else count score once if bird past pipe.
        if (bX + bW >= pX && bX <= pX + pW && bY + bH >= pY) {
            game.stop(1000);
        }
        else if (bX + bW >= pX + pW && !pipe.counted) {
            pipe.counted = true;
            game.state.score++;
        }

        if (pipe.coords.x <= - pipe.element.width) {
            //create a new pipe
            await generateNewPipe();
            //remove pipe that has passed
            game.pipes.splice(i, 1);
        }
    }

    ctx.fillText(`Score : ${game.state.score}`, 10, cvs.height - 20, 100);
    ctx.fillText(`Beta/Alpha = ${game.state.bandpowerRatio.toFixed(3)}`, 10, cvs.height - 50,150)

    if (cmd !== DRAW_ONCE && !game.state.over) {
        requestAnimationFrame(drawFrame);
    }

};

// load assets
Promise
    .allSettled(window.assets.map(asset => asset.onLoad()))
    .then(async (all) => {

        game.state.assetsLoaded = true;

        GROUND_POSITION = cvs.height - ground.element.height - bird.element.height;

        // set default state now that we have asset dimensions available.
        setDefaultState();
        
        // draw one frame before user clicks 'Play'
        drawFrame(DRAW_ONCE);

    });

// Event Listeners

$('#start-game-btn').click(() => {
    game.play();
});

 ws.onmessage = function incoming({data}) {

    data = JSON.parse(data);
    
    const channelBandpower = data.find(channelData => channelData.channel === CHANNEL);

    let action;

    if(channelBandpower){
        const { alpha, beta } = channelBandpower;

        game.state.bandpowerRatio = beta/alpha;

        if(game.state.bandpowerRatio > 1){
            action = ACTION_TYPES.UP;
        }
        else {
            action = ACTION_TYPES.DOWN;
        }
    }

    if (game.state.over || !game.state.started) return;

    if (action === ACTION_TYPES.UP) {
        if (bird.coords.y - BIRD_PROPEL_ACCELERATION > 0) {
            bird.moveUp(BIRD_PROPEL_ACCELERATION);
        }
        else {
            bird.draw(null, 0);
        }

    }
    if (action === ACTION_TYPES.DOWN) {
        if (bird.coords.y + BIRD_PROPEL_ACCELERATION < GROUND_POSITION) {
            bird.moveDown(BIRD_PROPEL_ACCELERATION);
        }
        else {
            bird.draw(null, GROUND_POSITION);
        }

    }
    
};