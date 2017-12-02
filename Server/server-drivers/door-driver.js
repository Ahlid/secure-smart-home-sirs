
class DoorDriver {

    constructor() {
        this.MAC_prefix = "01:02";
        this.requestID = 1;
    }

    stringifyStatus(MAC, status) {
        return `FRIDGE ${MAC} device status:\n` +
            `  State: ${status.state}`;
    }

    setVantage(vantage, MAC, socket) {
        socket.on('disconnect', () => {
            vantage.find(`unlock ${MAC}`).remove();
            vantage.find(`lock ${MAC}`).remove();
            vantage.find(`status ${MAC}`).remove();
        });

        let that = this;

        vantage
            .command(`unlock ${MAC}`)
            .description("Unlocks the door")
            .action(function(args, cb) {
                that.unlock(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`lock ${MAC}`)
            .description("Unlocks the door")
            .action(function(args, cb) {
                that.lock(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });

        vantage
            .command(`status ${MAC}`)
            .description("Returns the status of the Door")
            .action(function(args, cb) {
                that.status(MAC, socket, (result) => {
                    this.log(that.stringifyStatus(MAC, result.status));
                    cb();
                });
            });
    }

    recognizes(MAC) {
        let regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if(!regex.test(MAC)) {
            throw new Error('Not a MAC Address');
        }
        return MAC.startsWith(this.MAC_prefix);
    }

    lock(MAC, socket, cb){
        let replyTo = MAC + this.requestID;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });
        socket.emit('LOCK', {replyTo});
    }

    unlock(MAC, socket, cb){
        let replyTo = MAC + this.requestID;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });
        socket.emit('UNLOCK', {replyTo});
    }

    status(MAC, socket, cb){
        let replyTo = MAC + this.requestID;
        socket.on(replyTo, (replyData) => {
            socket.removeAllListeners(replyTo);
            cb(replyData);
        });
        socket.emit('STATUS', {replyTo});
    }
}

module.exports = DoorDriver;