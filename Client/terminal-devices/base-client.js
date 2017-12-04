/**
 * Created by Ricardo Morais on 03/11/2017.
 */
let io = require('socket.io-client');

class Client {
    constructor(MAC, IP, port, cb) {
            this.MAC = MAC;


        let requestTimeout;
        let handle = ()=> {
            console.log("The request for authentication timed out. Trying again in 5 sec");
            setTimeout(()=>{
                socket.emit('auth', { MAC: MAC });
                requestTimeout = setTimeout(handle, 5000);
            }, 1000 * 5);
        };

        let socket = io(`https://${IP}:${port}`,  {rejectUnauthorized: false});

        socket.on('auth-refused', () => {
            console.log(`MAC ${this.MAC}: authorization refused trying again in 5 sec`);
            clearTimeout(requestTimeout);
            setTimeout(()=>{
                socket.connect();
                socket.emit('auth', { MAC: MAC });
                requestTimeout = setTimeout(handle, 5000);
            }, 1000 * 5);
        });
        socket.on('auth-accepted', () => {
            console.log(`MAC ${this.MAC}: authorization accepted`);
            clearTimeout(requestTimeout);
            socket.off('auth-refused');
            socket.off('auth-accepted');
            cb(socket);
        });
        //Start by emitting an auth request
        socket.emit('auth', { MAC: MAC });
        requestTimeout = setTimeout(handle, 5000);

        console.log(`MAC ${this.MAC}: attempting to gain authorization`);
        this.socket = socket;
    };
}

module.exports = Client;
