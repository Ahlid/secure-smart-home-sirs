const RAISE_TEMPERATURE = "RAISE_TEMPERATURE";
const LOWER_TEMPERATURE = "LOWER_TEMPERATURE";
const STATUS = "STATUS";
const TURN_ON = "TURN_ON";
const TURN_OFF = "TURN_OFF";
const GET_REQUESTS = "GET_REQUESTS";
const REQUEST_RESPONSE = "REQUEST_RESPONSE";


class FridgeDriver {

    constructor() {
        this.MAC_prefix = "01:03";
        this.requestID = 1;
    }

    stringifyStatus(MAC, status) {
        return `FRIDGE ${MAC} device status:\n` +
               `  Temperature: ${status.temperature}\n` +
               `  State: ${status.state}`;
    }

    setVantage(vantage, MAC, socket) {

        socket.on('disconnect', () => {
            vantage.find(`status ${MAC}`).remove();
            vantage.find(`fridge raise temperature ${MAC}`).remove();
            vantage.find(`fridge lower temperature ${MAC}`).remove();
            vantage.find(`fridge turn on ${MAC}`).remove();
            vantage.find(`fridge turn off ${MAC}`).remove();
        });

        let that = this;

        vantage
            .command(`status ${MAC}`)
            .description("Shows the status of the fridge")
            .action(function (args, cb) {
                that.status(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`fridge raise temperature ${MAC}`)
            .description("Raises the fridge temperature")
            .action(function (args, cb) {
                that.raiseTemperature(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`fridge lower temperature ${MAC}`)
            .description("Lowers the fridge temperature")
            .action(function (args, cb) {
                that.lowerTemperature(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`fridge turn on ${MAC}`)
            .description("Turn the fridge on")
            .action(function (args, cb) {
                that.turnOn(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`fridge turn off ${MAC}`)
            .description("Turn the fridge off")
            .action(function (args, cb) {
                that.turnOff(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

    }

    bindDriver(MAC, socket) {
        let interval = setInterval(() => {
           //todo: check if the connection is still online

            //Check if there are pending requests in the fridge

            let replyTo = MAC + this.requestID;
            socket.on(replyTo, (replyData) => {
                socket.removeAllListeners(replyTo);
                console.log("Pooling request list from fridge: " + JSON.stringify(replyData.requests));
                for(let request of replyData.requests) {
                    //todo verify if the url is permitted VERY IMPORTANT
                    //todo make request async
                    request.post(request.url, {form:{key:'value'}}, function(err,httpResponse,body){
                        if(err) {
                            //Error
                            socket.emit(REQUEST_RESPONSE, {
                                error: err
                            });
                        } else {
                            //Success
                            socket.emit(REQUEST_RESPONSE, {});
                        }
                    });
                }
            });

            socket.emit(GET_REQUESTS, {replyTo});

        }, 1000 * 1)
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

    turnOn(MAC, socket, cb) {
        let replyTo = MAC + this.requestID;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });

        socket.emit(TURN_ON, {replyTo});
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

module.exports = FridgeDriver;