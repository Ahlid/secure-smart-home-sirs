let Client = require('./base-client');

//Services
const RAISE_TEMPERATURE = "RAISE_TEMPERATURE";
const LOWER_TEMPERATURE = "LOWER_TEMPERATURE";
const STATUS = "STATUS";
const TURN_ON = "TURN_ON";
const TURN_OFF = "TURN_OFF";
const GET_REQUESTS = "GET_REQUESTS";
const REQUEST_RESPONSE = "REQUEST_RESPONSE";


class Fridge extends Client {
    constructor(MAC, IP, port) {
        let MAC_prefix = "01:03";
        let regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (!regex.test(MAC)) {
            throw new Error('Not a MAC Address');
        }
        if (!MAC.startsWith(MAC_prefix)) {
            throw new Error('MAC address does not corresponds to a Fridge device');
        }
        super(MAC, IP, port, (socket) => {
            this.temperature = 0;
            this.state = "on";
            this.milkRequests = 0;
            this.pendingRequest = [];
            this.latestRequestID = 1;   //counter for the request id
            this.requestErrors = 0;     //number of requests that failed
            this.requestSuccesses = 0;  //number of requests that succeeded
            this.startServices(socket);
        });
    }

    getStatus() {
        return  {
            temperature: this.temperature,
            state: this.state,
            milkRequests: this.milkRequests,
            requestErrors: this.requestErrors,
            requestSuccesses: this.requestSuccesses
        }
    }

    startServices(socket) {
        //lets build the services

        socket.on(STATUS, (data) => {
            socket.emit(data.replyTo, {
                status: this.getStatus()
            });
        });

        socket.on(RAISE_TEMPERATURE, (data) => {
            this.temperature++;
            socket.emit(data.replyTo, {
                status: this.getStatus()
            });
        });

        socket.on(LOWER_TEMPERATURE, (data) => {
            this.temperature--;
            socket.emit(data.replyTo, {
                status: this.getStatus()
            });
        });

        socket.on(TURN_ON, (data) => {
            this.state = 'on';
            socket.emit(data.replyTo, {
                status: this.getStatus()
            });
        });

        socket.on(TURN_OFF, (data) => {
            this.state = 'off';
            socket.emit(data.replyTo, {
                status: this.getStatus()
            });
        });

        socket.on(GET_REQUESTS, (data) => {
            socket.emit(data.replyTo, {
                requests: this.getRequests()
            });
        });

        socket.on(REQUEST_RESPONSE, (data) => {
            //remove the request from the list since it is no longer pending(its completed)
            if(data.error !== null) {
                this.requestErrors ++;
            } else {
                this.requestSuccesses ++;
            }

            for(let i = 0; i < this.pendingRequest.length; i++) {
                if(this.pendingRequest[i].requestID === data.requestID) {
                    this.pendingRequest.splice(i, 1);
                    break;
                }
            }
        });

        console.log(`MAC ${this.MAC}: has started its services`);
    }

    getRequests() {
        return this.pendingRequest;
    }

    userBuyMilkOnlineRequest() {
        let request = {
            url: 'http:www.google.pt',
            requestID: this.latestRequestID ++
        };
        this.pendingRequest.push(request);
        this.milkRequests ++;
    }

}

module.exports = Fridge;
