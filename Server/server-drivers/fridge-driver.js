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
        this.isPoolConfigured = false;
    }

    stringifyStatus(MAC, status) {
        return `FRIDGE ${MAC} device status:\n` +
            `  Temperature: ${status.temperature}\n` +
            `  State: ${status.state}`;
    }

    configurePool(replyTo, socket, MacSocketHash) {
        this.isPoolConfigured = true;
        socket.on(replyTo, (replyData) => {

            console.log("Pooling request list from fridge: " + JSON.stringify(replyData.requests));
            for (let request of replyData.requests) {
                //todo verify if the url is permitted VERY IMPORTANT
                //todo make request async
                switch (request.type) {

                    case 'communicateWithDevice':

                        let deviceRequestedSocket = MacSocketHash[request.deviceMac];
                        let command = request.deviceCommand;
                        //se o comando existir
                        if (deviceRequestedSocket.iotDriver[command]) {
                            deviceRequestedSocket.iotDriver[command](request.deviceMac, deviceRequestedSocket, (replyData) => {
                                socket.emit(REQUEST_RESPONSE, {
                                    err: false,
                                    id: request.id,
                                    replyData: replyData
                                });
                            })
                        } else {
                            socket.emit(REQUEST_RESPONSE, {err: true, id: request.id});
                        }

                        break;
                    //data
                    //data.deviceMac
                    //data.deviceCommandW
                    //data.id -> the request id
                    /*   socket.on('communicateWithDevice', function (data) {





                       });  */
                    default:
                        request.post(request.url, {}, function (err, httpResponse, body) {
                            if (err) {
                                //Error
                                socket.emit(REQUEST_RESPONSE, {
                                    error: err,
                                    id: request.id
                                });
                            } else {
                                //Success
                                socket.emit(REQUEST_RESPONSE, {error: false, id: request.id});
                            }
                        });
                        break;
                }
            }
        });
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

    bindDriver(MAC, socket, MacSocketHash) {
        let interval = setInterval(() => {

            //todo: check if the connection is still online
            if(!this.isPoolConfigured){
                this.configurePool(MAC,socket,MacSocketHash);
            }
            socket.emit(GET_REQUESTS, {replyTo : MAC});

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