let fs = require('fs');

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
        this.device_prefix = "fridge";
        this.policies = {internet: [], intranet: []};
        this.isPoolConfigured = false;
        this.requestID = 1;
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

                        // todo: check if the device can access to this information of the other device
                        let deviceRequestedSocket = MacSocketHash[request.deviceMac];
                        let command = request.deviceCommand;

                        // if source has permissions
                        for(let intranetPolicy in this.policies.intranet) {

                        }


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
                    //   socket.on('communicateWithDevice', function (data) {
                    //   });
                    default:
                        // Connection to the outside

                        // todo: check if the device can access to the outside
                        let allowedMACs = fs.readFileSync('.txt').toString().split("\r\n");
                        let allowed = allowedMACs.some((mac)=> {
                            return mac.toUpperCase() === authData.MAC.toUpperCase();
                        });

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

    setVantage(vantage, MAC, name, socket) {
        let that = this;

        socket.on('disconnect', () => {
            that.disableCommands(MAC);
        });

        this.createCommands(vantage, MAC, name, socket);

    }

    createCommands(vantage, MAC, name, socket) {
        let that = this;
         vantage
            .command(`fridge block ${name}`)
            .description("Block the device from connecting to the smart gateway")
            .action(function (args, cb) {
                that.blockDevice(vantage, MAC, name, socket, (result) => {
                    this.log(result.status);    // doesn't need stringify because it wont go over the network
                    cb();
            });
         });

        vantage
            .command(`fridge status ${name}`)
            .description("Shows the status of the fridge")
            .action(function (args, cb) {
                that.status(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`fridge raise temperature ${name}`)
            .description("Raises the fridge temperature")
            .action(function (args, cb) {
                that.raiseTemperature(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`fridge lower temperature ${name}`)
            .description("Lowers the fridge temperature")
            .action(function (args, cb) {
                that.lowerTemperature(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`fridge turn on ${name}`)
            .description("Turn the fridge on")
            .action(function (args, cb) {
                that.turnOn(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`fridge turn off ${name}`)
            .description("Turn the fridge off")
            .action(function (args, cb) {
                that.turnOff(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });
    }

    // not working
    blockDevice(vantage, MAC, name, socket, cb) {
        // read current allowed devices
        try {
            fs.readFile('allowed.txt', 'utf8', (err, contents) => {
                if (err == null) {
                    let allowedMACs = contents.toString().split("\r\n");
                    // search for device among the allowed ones
                    for (let i = allowedMACs.length - 1; i >= 0; i--) {
                        if (allowedMACs[i] === MAC) {
                            allowedMACs.splice(i, 1);   // remove the MAC from the allowed list
                            break;
                        }
                    }
                    let writableMACS = allowedMACs.join("\r\n");
                    // write to file changes
                    fs.writeFile("allowed.txt", writableMACS, (er) => {
                        if (er) {
                            console.log("Error: " + er);
                            return {status: `...Error on blocking the device ${MAC}`};
                        } else {
                            console.log("EScrever novos macs");
                            // block all commands
                            this.disableCommands(vantage, name);
                            vantage.find(`fridge block ${name}`).remove();  // can't block this device no more

                            // allow connection with smart gateway again
                            vantage
                                .command(`fridge allow ${name}`)
                                .description("Allows the device to connect again to the smart gateway")
                                .action(function (args, cb) {
                                    this.log(`Devices ${MAC} allowed again`);
                                    this.createCommands(vantage, MAC, socket);
                                    //that.log(`Devices ${MAC} allowed again`);
                                    cb();
                                });

                            return {status: `Device ${MAC} blocked`};
                        }
                    });
                } else {
                    cb();
                    console.log("error...:" + err);
                    return {status: `Error on blocking the device ${MAC}`};
                }
            });
        } catch (ex){
                console.log("ERRROR: " + ex);
        }
    }

    allowDevice(vantage, MAC, name, socket, cb) {

    }

    disableCommands(vantage, name) {
        vantage.find(`fridge status ${name}`).remove();
        vantage.find(`fridge raise temperature ${name}`).remove();
        vantage.find(`fridge lower temperature ${name}`).remove();
        vantage.find(`fridge turn on ${name}`).remove();
        vantage.find(`fridge turn off ${name}`).remove();
    }

    bindDriver(MAC, socket, MacSocketHash) {
        let interval = setInterval(() => {

            //todo: check if the connection is still online
            if(!this.isPoolConfigured){
                //this.configurePool(MAC,socket,MacSocketHash);
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
        let replyTo = MAC + this.requestID++;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });

        socket.emit(STATUS, {replyTo});
    }

    raiseTemperature(MAC, socket, cb) {
        let replyTo = MAC + this.requestID++;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });

        socket.emit(RAISE_TEMPERATURE, {replyTo});
    }

    lowerTemperature(MAC, socket, cb) {
        let replyTo = MAC + this.requestID++;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });

        socket.emit(LOWER_TEMPERATURE, {replyTo});
    }

    turnOn(MAC, socket, cb) {
        let replyTo = MAC + this.requestID++;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });

        socket.emit(TURN_ON, {replyTo});
    }

    turnOff(MAC, socket, cb) {
        let replyTo = MAC + this.requestID++;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });

        socket.emit(TURN_OFF, {replyTo});
    }
}

module.exports = FridgeDriver;