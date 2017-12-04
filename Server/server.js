let appVantage = require('express')();
let fs = require('fs');
let https = require('https');
let vantage = require('vantage')();

//mac-socket
let MacSocketHash = [];
let SocketIdMac = [];

//DRIVERS
let DriverManager = require('./server-drivers/driver-manager');
let DoorDriver = require('./server-drivers/door-driver');
let FridgeDriver = require('./server-drivers/fridge-driver');
let OvenDriver = require('./server-drivers/oven-driver');

let driverManager = new DriverManager(vantage);
driverManager.addDriver(new DoorDriver());
driverManager.addDriver(new FridgeDriver());
driverManager.addDriver(new OvenDriver());
//////////


let logs = "";

function log(message) {
    logs += "Log: " + message + "\n";
    console.log(message);
}

let options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
    passphrase: 'mestrado',
    requestCert: false,
    rejectUnauthorized: false
};

let deviceInterfaceApp = https.createServer(options);
let io = require('socket.io').listen(deviceInterfaceApp);

io.on('connection', function (socket) {
    driverManager.expectAuth(socket, (driver, mac) => {
        if (driver === null) {
            log('Device was not recognized');
            socket.disconnect();
            return;
        }
        log('Device authorized');
        MacSocketHash[mac] = socket;
        SocketIdMac[socket.id] = mac;
        socket.iotDriver = driver;
    });

    socket.on('disconnect', function () {
        log('User disconnected');
        MacSocketHash[SocketIdMac[socket.id]] = null;

    });

    //data
    //data.deviceMac
    //data.deviceCommandW
    //data.id -> the request id
    socket.on('communicateWithDevice', function (data) {
        //todo:check policies

        let deviceRequestedSocket = MacSocketHash[data.deviceMac];
        let command = data.deviceCommand;
        //se o comando existir
        if (deviceRequestedSocket.iotDriver[command]) {
            deviceRequestedSocket.iotDriver[command](data.deviceMac, deviceRequestedSocket, (replyData) => {
                socket.emit('communicateWithDeviceResult', {status: false, id: data.id, replyData: replyData});
            })
        } else {
            socket.emit('communicateWithDeviceResult', {status: false, id: data.id});
        }

    });

    log('Connection established');
});

deviceInterfaceApp.listen(12345, function () {
    log('Listening in port 12345');
});

appVantage.get('/', function (req, res) {
    res.send("Vantage Interface");
});

vantage
    .delimiter("smart-home~$")
    .listen(appVantage, {
        port: 3001,
        ssl: true,
        key: fs.readFileSync('./key.pem'),
        cert: fs.readFileSync('./cert.pem'),
        passphrase: 'mestrado'
    });

vantage
    .command(`show logs`)
    .description("Shows the server logs")
    .action(function (args, cb) {
        this.log(logs);
        cb();
    });
