const RAISE_TEMPERATURE = "RAISE_TEMPERATURE";
const LOWER_TEMPERATURE = "LOWER_TEMPERATURE";
const TURN_ON = "turn on"; //todo
const TURN_OFF = "turn off"; //todo


class DoorDriver {

    constructor() {
        this.MAC_prefix = "01:03";
        this.requestID = 1;
    }

    setVantage(vantage, MAC, socket) {
        socket.on('disconnect', () => {
            vantage.find(`raise temperature ${MAC}`).remove();
        });

        let that = this;

        //todo:lower status

        vantage
            .command(`raise temperature ${MAC}`)
            .description("Raises the fridge temperature")
            .action(function (args, cb) {
                that.raiseTemperature(MAC, socket, (result) => {
                    this.log('FRIDGE device is ' + result.status);
                    cb();
                });
            });

    }

    recognizes(MAC) {
        let regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (!regex.test(MAC)) {
            throw new Error('Not a MAC Address');
        }
        return MAC.startsWith(this.MAC_prefix);
    }

    raiseTemperature(MAC, socket, cb) {
        socket.on(this.MAC_prefix + this.requestID, (replyData) => {
            socket.removeAllListeners(this.MAC_prefix + this.requestID);
            cb(replyData);
        });

        socket.emit(RAISE_TEMPERATURE, {replyTo: this.MAC_prefix + this.requestID});
    }
    lowerTemperature(MAC, socket, cb) {
        socket.on(this.MAC_prefix + this.requestID, (replyData) => {
            socket.removeAllListeners(this.MAC_prefix + this.requestID);
            cb(replyData);
        });

        socket.emit(LOWER_TEMPERATURE, {replyTo: this.MAC_prefix + this.requestID});
    }

    //todo: status

}

module.exports = DoorDriver;