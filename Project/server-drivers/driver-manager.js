/**
 * Created by Ricardo Morais on 03/11/2017.
 */

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
            console.log(authData);
            //todo: check up on the authentication credentials

            let driver = this.findDriver(authData.MAC);
            if(driver === null) {
                //reject device
                socket.emit('auth-refused', {
                    error: 'No driver for MAC'
                });
                cb(null);
            }
            socket.emit('auth-accepted');
            driver.setVantage(this.vantage, authData.MAC, socket);
            cb(driver);
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
