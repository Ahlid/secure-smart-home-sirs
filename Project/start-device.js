/**
 * Created by Ricardo Morais on 06/11/2017.
 */

let Door = require('./terminal-devices/door');
let Fridge = require('./terminal-devices/fridge');
let Oven = require('./terminal-devices/oven');

switch(process.argv[2]){
    case 'door':
        console.log('door');
        let door = new Door("01:02:10:35:53:55");
        break;
    case 'fridge':
        console.log('fridge');
        let fridge = new Fridge("01:03:10:35:53:55");
        break;
    case 'oven':
        console.log('oven');
        let oven = new Oven("01:04:10:35:53:55");
        break;
    default:
        console.log('invalid device');
}
