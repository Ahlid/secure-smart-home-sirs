let appVantage = require('express')();
let fs = require('fs');
let https = require('https');
let vantage = require('vantage')();

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

io.on('connection', function(socket){
    driverManager.expectAuth(socket, (driver) => {
        if(driver === null) {
            log('Device was not authorized.');
            socket.disconnect();
            return;
        }
        log('Device authorized');
    });

    socket.on('disconnect', function(){
        log('User disconnected');
    });

    log('User connected');
});

deviceInterfaceApp.listen(12345, function(){
    log('Listening in port 12345');
});

appVantage.get('/', function(req, res){
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
