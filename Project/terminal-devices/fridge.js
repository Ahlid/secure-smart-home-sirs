let Client = require('./base-client');
const RAISE_TEMPERATURE = "RAISE_TEMPERATURE";
const LOWER_TEMPERATURE = "LOWER_TEMPERATURE";

class Fridge extends Client {
    constructor(MAC, port) {
        let MAC_prefix = "01:03";
        let regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (!regex.test(MAC)) {
            throw new Error('Not a MAC Address');
        }
        if (!MAC.startsWith(MAC_prefix)) {
            throw new Error('MAC address does not corresponds to a Door device');
        }
        super(MAC, 3000, (socket) => {
            this.temperature = 0;
            this.startServices(socket);
        });
    }

    startServices(socket) {
        //lets build the services

        socket.on(RAISE_TEMPERATURE, (data) => {

            this.temperature++;
            socket.emit(data.replyTo, {
                status: this.temperature
            });
            console.log('Status: ' + this.temperature);
        });

        console.log(`MAC ${this.MAC}: has started its services`);
    }
}

module.exports = Fridge;
