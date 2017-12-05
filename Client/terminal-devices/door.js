let Client = require('./base-client');

class Door extends Client {
    constructor(MAC, IP, port, name){
        let MAC_prefix = "01:02";
        let regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if(!regex.test(MAC)) {
            throw new Error('Not a MAC Address');
        }
        if(!MAC.startsWith(MAC_prefix)){
           throw new Error('MAC address does not corresponds to a Door device');
        }
        super(MAC, IP, port, name, (socket) => {
            this.state = "closed";
            this.startServices(socket);
        });
    }

    getStatus() {
        return {
            state: this.state
        }
    }

    startServices(socket) {
        //lets build the services

        socket.on('STATUS', (data) => {
            socket.emit(data.replyTo, {
                status: this.getStatus()
            });
        });

        socket.on('LOCK', (data) => {
            console.log(data);
            if(this.state === "open") {
                socket.emit(data.replyTo, {
                    error: 'Cannot lock an opened door!',
                    status: this.getStatus()
                });
                return;
            }
            this.state = "locked";
            socket.emit(data.replyTo, {
                status: this.getStatus()
            });
        });

        socket.on('UNLOCK', (data) => {
            this.state = "unlock";
            socket.emit(data.replyTo, {
                state: this.getStatus()
            });
        });

        console.log(`MAC ${this.MAC}: has started its services`);
    }


}

module.exports = Door;
