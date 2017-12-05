/**
 * Created by Ricardo Morais on 03/11/2017.
 */

const GET_REQUESTS = "GET_REQUESTS";
const REQUEST_RESPONSE = "REQUEST_RESPONSE";


let io = require('socket.io-client');
let socket;

class Client {
    constructor(MAC, IP, port, name, cb) {
        this.MAC = MAC;
        this.name = name;
        this.pendingRequest = [];
        this.latestRequestID = 1;   //counter for the request id
        this.requestErrors = 0;     //number of requests that failed
        this.requestSuccesses = 0;  //number of requests that succeeded


        socket = io(`https://${IP}:${port}`, {rejectUnauthorized: false});

        let requestTimeout;
        /*let handle = () => {
            console.log("The request for authentication timed out. Trying again in 5 sec");
            setTimeout(() => {
                socket.emit('auth', {MAC: this.MAC, deviceName: deviceName});
                requestTimeout = setTimeout(handle, 5000);
            }, 1000 * 5);
        };*/

        //atencao, interfere com o bootstrap do dispositivo (a reconneccao)
        socket.on('auth-refused', (data) => {
            //console.log(`MAC ${this.MAC}: authorization refused trying again in 5 sec`);
            console.log(`MAC ${this.MAC}: ${data.error}`);
            clearTimeout(requestTimeout);
            /*setTimeout(() => {
                socket.connect();
                socket.emit('auth', {MAC: MAC});
                //requestTimeout = setTimeout(handle, 5000);
            }, 1000 * 5);*/
        });
        socket.on('auth-accepted', () => {
            console.log(`MAC ${this.MAC}: authorization accepted`);
            clearTimeout(requestTimeout);
            socket.off('auth-refused');
            socket.off('auth-accepted');
            cb(socket);
        });
    };

    connectToServer() {
        //Start by emitting an auth request
        socket.emit('auth', {MAC: this.MAC, name: this.name});
        //requestTimeout = setTimeout(handle, 5000);

        console.log(`MAC ${this.MAC}: attempting to gain authorization`);
        this.socket = socket;
        this.startPooling();
    }

    startPooling() {
        this.socket.on(GET_REQUESTS, (data) => {
            this.socket.emit(data.replyTo, {
                requests: this.getRequests()
            });
        });

        this.socket.on(REQUEST_RESPONSE, (data) => {
            console.log("DATA");
            console.log(data);
            //remove the request from the list since it is no longer pending(its completed)
            if (data.error !== null) {
                this.requestErrors++;
            } else {
                this.requestSuccesses++;
            }

            //todo: test; this needs to be in descending order
            for (let i = 0; i < this.pendingRequest.length; i++) {
                if (this.pendingRequest[i].requestID === data.requestID) {
                    this.pendingRequest.splice(i, 1);   // remove request from pending request list
                    break;
                }
            }
        });
    }

    getRequests() {
        return this.pendingRequest;
    }
}

module.exports = Client;
