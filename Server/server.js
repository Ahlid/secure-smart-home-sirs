let appVantage = require('express')();
let fs = require('fs');
let https = require('https');
let vantage = require('vantage')();
let watcher = require('filewatcher')();


//mac-socket
let MacSocketHash = {};
let SocketIdMac = {};


//DRIVERS
let DriverManager = require('./server-drivers/driver-manager');
let DoorDriver = require('./server-drivers/door-driver');
let FridgeDriver = require('./server-drivers/fridge-driver');
let OvenDriver = require('./server-drivers/oven-driver');

let driverManager = new DriverManager(vantage, MacSocketHash);
driverManager.addDriver(new DoorDriver());
driverManager.addDriver(new FridgeDriver());
driverManager.addDriver(new OvenDriver());
//////////

//Load POLICIES (after adding the drivers)
driverManager.loadPolicies();

//ADD FILE WATCHER
watcher.add("policy-interconnection.txt");
watcher.add("policy-intraconnection.txt");

watcher.on("change", function(file, stat) {
    console.log("FILE: " + file);
});

let logs = "";

function log(message) {
    logs += "Time: " + new Date() + " - Log: " + message + "\n";
    console.log(message);
}

let options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
    passphrase: 'mestrado',
    requestCert: false, // change to true
    rejectUnauthorized: false
};


let deviceInterfaceApp = https.createServer(options);
let io = require('socket.io').listen(deviceInterfaceApp);

io.on('connection', function (socket) {
    driverManager.expectAuth(socket, (driver, authData) => {
        if (driver === null) {
            log('Device was not recognized');
            socket.disconnect();
            return;
        }
        log(`Device ${authData.MAC} authorized`);
        MacSocketHash[authData.MAC] = socket;
        SocketIdMac[socket.id] = authData.MAC;
        socket.iotDriver = driver;

    });

    socket.on('disconnect', function () {
        log(`User disconnected`);
        MacSocketHash[SocketIdMac[socket.id]] = null;
    });


    log(`Connection established`);
});

deviceInterfaceApp.listen(12345, function () {
    log('Listening in port 12345');
});

appVantage.get('/', function (req, res) {
    res.send("Vantage Interface");
});

var banner =
    "######################################################################\n" +
    "#              Welcome to SIRS SMART HOUSE remove console            #\n" +
    "#                                                                    #\n" +
    "#              All connections are monitored and recorded            #\n" +
    "#      Disconnect IMMEDIATELY if you are not an authorized user      #\n" +
    "######################################################################\n";

vantage
    .delimiter("smart-home~$")
    .banner(banner)
    .listen(appVantage, {
        port: 3001,
        ssl: true,
        key: fs.readFileSync('./key.pem'),
        cert: fs.readFileSync('./cert.pem'),
        passphrase: 'mestrado'
    });

vantage
    .command(`show_logs`)
    .description("Shows the server logs")
    .action(function (args, cb) {
        this.log(logs);
        cb();
    });