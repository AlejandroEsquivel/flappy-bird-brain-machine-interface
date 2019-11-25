
const Asset = require('./Asset');

module.exports = class Sprite extends Asset {
    constructor(src){
        super(src);
        this.coords = {
            x: 0,
            y: 0
        };
    }
    draw = (x,y) => {
        if(typeof x === 'number'){
            this.coords.x = x;
        }
        if(typeof y === 'number'){
            this.coords.y = y;
        }
        return window.ctx.drawImage(this.element,this.coords.x, this.coords.y);
    }

    dx = (offset) => {
        return this.draw(this.coords.x+offset,this.coords.y);
    }
    dy = (offset) => {
        return this.draw(this.coords.x,this.coords.y+offset);
    }
    
    moveRight = (offset) => this.dx(Math.abs(offset || 1));
    moveLeft = (offset) => this.dx(-Math.abs(offset || 1));
    moveUp = (offset) => this.dy(-Math.abs(offset || 1));
    moveDown = (offset) => this.dy(Math.abs(offset || 1));
}