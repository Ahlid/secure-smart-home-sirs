const RAISE_TEMPERATURE = "RAISE_TEMPERATURE";
const LOWER_TEMPERATURE = "LOWER_TEMPERATURE";
const STATUS = "STATUS";
const TURN_ON_TIMEOUT = "TURN_ON_TIMEOUT";
const TURN_OFF = "TURN_OFF";


class DoorDriver {

    constructor() {
        this.MAC_prefix = "01:04";
        this.requestID = 1;
    }

    stringifyStatus(MAC, status) {
        return ` ${MAC} device status:\n` +
               `  Temperature: ${status.temperature}\n` +
               `  Actual Temperature: ${Math.round(status.actualTemperature)}\n` +
               `  Timer: ${status.timer}\n` +
               `  State: ${status.state}`;
    }

    setVantage(vantage, MAC, socket) {

        socket.on('disconnect', () => {
            vantage.find(`status ${MAC}`).remove();
            vantage.find(`raise temperature ${MAC}`).remove();
            vantage.find(`lower temperature ${MAC}`).remove();
            vantage.find(`turn on ${MAC}`).remove();
            vantage.find(`turn off ${MAC}`).remove();
        });

        let that = this;

        vantage
            .command(`status ${MAC}`)
            .description("Shows the status of the oven")
            .action(function (args, cb) {
                that.status(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`raise temperature ${MAC}`)
            .description("Raises the oven temperature")
            .action(function (args, cb) {
                that.raiseTemperature(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`lower temperature ${MAC}`)
            .description("Lowers the oven temperature")
            .action(function (args, cb) {
                that.lowerTemperature(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`turn on ${MAC}`)
            .description("Turn the oven on")
            .action(function (args, cb) {
                const self = this;
                this.prompt({
                    type: 'input',
                    name: 'seconds',
                    message: 'How many seconds would you like to turn it on?\n>'
                }, (result) => {
                    that.turnOn(MAC, socket, result.seconds, (result) => {
                        this.log(that.stringifyStatus(MAC, result.status));
                        cb();
                    });
                    cb();
                });
            });

        vantage
            .command(`turn off ${MAC}`)
            .description("Turn the oven off")
            .action(function (args, cb) {
                that.turnOff(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
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

    status(MAC, socket, cb) {
        let replyTo = MAC + this.requestID;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });

        socket.emit(STATUS, {replyTo});
    }

    raiseTemperature(MAC, socket, cb) {
        let replyTo = MAC + this.requestID;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });

        socket.emit(RAISE_TEMPERATURE, {replyTo});
    }

    lowerTemperature(MAC, socket, cb) {
        let replyTo = MAC + this.requestID;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });

        socket.emit(LOWER_TEMPERATURE, {replyTo});
    }

    turnOn(MAC, socket, seconds, cb) {
        let replyTo = MAC + this.requestID;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });

        socket.emit(TURN_ON_TIMEOUT, {replyTo, seconds});
    }

    turnOff(MAC, socket, cb) {
        let replyTo = MAC + this.requestID;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });

        socket.emit(TURN_OFF, {replyTo});
    }
}

module.exports = DoorDriver;