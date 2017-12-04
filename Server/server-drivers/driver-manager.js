/**
 * Created by Ricardo Morais on 03/11/2017.
 */
let fs = require("fs");

class DriverManager {
    constructor(vantage) {
        this.drivers = [];
        this.vantage = vantage;
    }

    addDriver(driver) {
        this.drivers.push(driver);
    }

    expectAuth(socket, cb) {
        socket.on('auth', (authData) => {

            let allowedMACs = fs.readFileSync('allowed.txt').toString().split("\r\n");
            let allowed = allowedMACs.some((mac)=> {
                return mac.toUpperCase() === authData.MAC.toUpperCase();
            });
            if(!allowed) {
                //reject device
                socket.emit('auth-refused', {
                    error: 'Not authorized'
                });
                cb(null);
                return;
            }
            let driver = this.findDriver(authData.MAC);
            if(driver === null) {
                //reject device
                socket.emit('auth-refused', {
                    error: 'No driver for MAC'
                });
                cb(null);
                return;
            }
            socket.emit('auth-accepted');
            driver.setVantage(this.vantage, authData.MAC, socket);
            if(driver.bindDriver != null) {
                driver.bindDriver(authData.MAC, socket);
            }
            cb(driver,authData.MAC);
        })
    }

    findDriver(MAC) {
        for(let driver of this.drivers) {
            if(driver.recognizes(MAC)) {
                return driver;
            }
        }
        return null;
    }

}

module.exports = DriverManager;
