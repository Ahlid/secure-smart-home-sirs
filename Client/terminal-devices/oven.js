let Client = require('./base-client');

//Services
const RAISE_TEMPERATURE = "RAISE_TEMPERATURE";
const LOWER_TEMPERATURE = "LOWER_TEMPERATURE";
const STATUS = "STATUS";
const TURN_ON_TIMEOUT = "TURN_ON_TIMEOUT";
const TURN_OFF = "TURN_OFF";

const TEMPERATURE_DUMPER_FACTOR = 0.2;
const ROOM_TEMPERATURE = 15;

class Oven extends Client {
    constructor(MAC, IP, port) {
        let MAC_prefix = "01:04";
        let regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (!regex.test(MAC)) {
            throw new Error('Not a MAC Address');
        }
        if (!MAC.startsWith(MAC_prefix)) {
            throw new Error('MAC address does not corresponds to a Oven device');
        }
        super(MAC, IP, port, (socket) => {
            this.temperature = 180;
            this.actualTemperature = 0;
            this.state = "off";
            this.timer = -1;
            this.startServices(socket);
            setInterval(() => {
                if(this.timer > 0) {
                    this.timer --;
                }

                if(this.timer === 0){
                    this.state = "off";
                    this.timer = -1;
                }

                if(this.temperature > this.actualTemperature && this.state === "on")
                    this.actualTemperature += (this.temperature - this.actualTemperature) * TEMPERATURE_DUMPER_FACTOR;
                else {
                    this.actualTemperature += (ROOM_TEMPERATURE - this.actualTemperature) * TEMPERATURE_DUMPER_FACTOR;
                }
            }, 1000);
        });

    }

    getStatus() {
        return  {
            temperature: this.temperature,
            actualTemperature: this.actualTemperature,
            state: this.state,
            timer: this.timer
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

        socket.on(TURN_ON_TIMEOUT, (data) => {
            this.state = 'on';
            this.timer = data.seconds;
            socket.emit(data.replyTo, {
                status: this.getStatus()
            });
        });

        socket.on(TURN_OFF, (data) => {
            this.state = 'off';
            this.timer = -1;
            socket.emit(data.replyTo, {
                status: this.getStatus()
            });
        });

        console.log(`MAC ${this.MAC}: has started its services`);
    }
}

module.exports = Oven;
