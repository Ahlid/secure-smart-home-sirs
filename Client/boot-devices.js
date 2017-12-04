let Door = require('./terminal-devices/door');
let Fridge = require('./terminal-devices/fridge');
let Oven = require('./terminal-devices/oven');

let IP = "127.0.0.1";
let port = 12345;

let door = new Door("01:02:10:35:53:55", IP, port);
let fridge = new Fridge("01:03:10:35:53:55", IP, port);
let oven = new Oven("01:04:10:35:53:55", IP, port);


fridge.pendingRequest.push({id: 1, deviceMac: "01:02:10:35:53:55", deviceCommand: "unlock", type:"communicateWithDevice"});

/*
door.socket.on("communicateWithDeviceResult",(result)=>{
    console.log(result);
});

setTimeout(()=> {
    door.socket.emit("communicateWithDevice", {id: 1, deviceMac: "01:03:10:35:53:55", deviceCommand: "turnOff"});

},1000);
*/