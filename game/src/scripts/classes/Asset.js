module.exports = class Asset {

    constructor(src){
        this.element = new Image();
        this.element.src = src;
        window.assets.push(this);
    }

    onLoad = () => new Promise(resolve => {
        this.element.onload = ()=>{
            resolve(this);
        };
    })
}