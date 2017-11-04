let Client = require('./base-client');

class Door extends Client {
    constructor(MAC, port){
        let MAC_prefix = "01:02";
        let regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if(!regex.test(MAC)) {
            throw new Error('Not a MAC Address');
        }
        if(!MAC.startsWith(MAC_prefix)){
           throw new Error('MAC address does not corresponds to a Door device');
        }
        super(MAC, 3000, (socket) => {
            this.status = "closed";
            this.startServices(socket);
        });
    }

    startServices(socket) {
        //lets build the services

        socket.on('LOCK', (data) => {
            if(this.status === "open") {
                console.log('Cannot lock an opened door!');
                socket.emit(data.replyTo, {
                    error: 'Cannot lock an opened door!',
                    status: this.status
                });
                return;
            }
            this.status = "locked";
            socket.emit(data.replyTo, {
                status: this.status
            });
            console.log('Status: ' + this.status);
        });

        socket.on('UNLOCK', (data) => {
            this.status = "unlock";
            socket.emit(data.replyTo, {
                status: this.status
            });
            console.log('Status: ' + this.status);
        });

        socket.on('STATUS', (data) => {
            socket.emit(data.replyTo, {
                status: this.status
            });
            console.log('Status: ' + this.status);
        });
        console.log(`MAC ${this.MAC}: has started its services`);
    }
}

module.exports = Door;
