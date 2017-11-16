/**
 * Created by Ricardo Morais on 03/11/2017.
 */
let io = require('socket.io-client');

class ClientBase {
    constructor(MAC, port, cb) {
        this.MAC = MAC;
        let socket = io(`https://194.210.230.73:${port}`,  {rejectUnauthorized: false});
        socket.on('auth-refused', () => {
            console.log(`MAC ${this.MAC}: authorization refused trying again in 2 min`);
            //try again in 2 min
            setTimeout(()=>{
                socket.emit('auth', { MAC: MAC });
            }, 1000 * 60 * 2);
        });
        socket.on('auth-accepted', () => {
            console.log(`MAC ${this.MAC}: authorization accepted`);
            socket.off('auth-refused');
            socket.off('auth-accepted');
            cb(socket);
        });
        //Start by emitting an auth request
        socket.emit('auth', { MAC: MAC });
        console.log(`MAC ${this.MAC}: attempting to gain authorization`);
    };
}

module.exports = ClientBase;
