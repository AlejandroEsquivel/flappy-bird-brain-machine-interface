/*
    Notes:
    To change width we will have to edit the bg, fg (ground) image dimensions.
*/

require("babel-polyfill");

window.$ = require("jquery");
const Sprite = require('./classes/Sprite');
const WebSocket = require('isomorphic-ws');

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
betaToAlphaRatio = 0;

// define images
const bird = new Sprite('./images/bird.png');
const background = new Sprite('./images/bg.png');
const ground = new Sprite('./images/fg.png');


// load assets
Promise
    .allSettled(window.assets.map(asset => asset.onLoad()))
    .then(async (all) => {

        // Initilize Game State & Constants
        const PIPE_SPEED = 1;
        const BIRD_PROPEL_ACCELERATION = 50;
        const MAX_PIPE_HEIGHT_PROPORTION = 0.50;
        const GROUND_POSITION = cvs.height - ground.element.height - bird.element.height;
        const DRAW_ONCE = 'DRAW_ONCE';

        // state
        let GAME_OVER;
        let GAME_STARTED;
        let pipes;
        let score;

        setDefaultState();

        function setDefaultState() {
            pipes = [];
            score = 0;
            bird.coords = { x: bird.element.width, y: GROUND_POSITION };
            GAME_OVER = false;
            GAME_STARTED = false;
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

            pipes.push(pipe);
        }

        // Event Listeners

        ws.onmessage = function incoming({data}) {

            if (GAME_OVER || !GAME_STARTED) return;

            data = JSON.parse(data);
            
            const CHANNEL = 1;
            const channelBandpower = data.find(channelData => channelData.channel === CHANNEL);
            const ACTION_TYPES = {
                'UP': 'UP',
                'DOWN': 'DOWN'
            }

            let action;
  
            if(channelBandpower){
                const { alpha, delta } = channelBandpower;
                betaToAlphaRatio = delta/alpha;
                if(betaToAlphaRatio > 1){
                    action = ACTION_TYPES.UP;
                }
                else {
                    action = ACTION_TYPES.DOWN;
                }
                console.log(betaToAlphaRatio)
            }

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
            for (var i = pipes.length - 1; i >= 0; i--) {
                pipe = pipes[i];
                pX = pipe.coords.x;
                pY = pipe.coords.y;
                pW = pipe.element.width;
                pH = pipe.element.height;
                pipe.moveLeft(PIPE_SPEED);

                // detect collision, else count score once if bird past pipe.
                if (bX + bW >= pX && bX <= pX + pW && bY + bH >= pY) {
                    GAME_OVER = true;
                    // restart the game after one second
                    return setTimeout(function () {
                        setDefaultState();
                        drawFrame(DRAW_ONCE);
                    }, 1000)

                }
                else if (bX + bW >= pX + pW && !pipe.counted) {
                    pipe.counted = true;
                    score++;
                }

                if (pipe.coords.x <= - pipe.element.width) {
                    await generateNewPipe();
                    //remove pipe
                    //pipe.element.parentNode.removeChild(pipe.element);
                    pipes.splice(i, 1);
                }
            }

            ctx.fillText(`Score : ${score}`, 10, cvs.height - 20, 100);
            ctx.fillText(`Beta/Alpha = ${betaToAlphaRatio.toFixed(3)}`, 10, cvs.height - 50,150)

            if (cmd !== DRAW_ONCE && !GAME_OVER) {
                requestAnimationFrame(drawFrame);
            }

        };
        // draw one frame before user clicks 'Play'
        drawFrame(DRAW_ONCE);

        // create the first pipe, then draw first frame.
        window.playGame = () => {
            if(GAME_STARTED){ return; }
            GAME_STARTED = true;
            generateNewPipe().then(drawFrame);
        }

    });

$('#start-game-btn').click(() => {
    window.playGame();
});
