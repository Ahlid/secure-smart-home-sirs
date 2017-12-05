/**
 * Created by Ricardo Morais on 03/11/2017.
 */
let fs = require("fs");

class DriverManager {
    constructor(vantage, MacSocketHash) {
        this.drivers = [];
        this.vantage = vantage;
        this.MacSocketHash = MacSocketHash;
    }

    addDriver(driver) {
        this.drivers.push(driver);
    }

    expectAuth(socket, cb) {
        socket.on('auth', (authData) => {

            let allowedMACs = fs.readFileSync('allowed.txt').toString().split("\r\n");
            let allowed = allowedMACs.some((mac) => {
                return mac.toUpperCase() === authData.MAC.toUpperCase();
            });
            if (!allowed) {
                //reject device
                socket.emit('auth-refused', {
                    error: 'Not authorized'
                });
                cb(null);
                return;
            }
            let driver = this.findDriver(authData.MAC);
            if (driver === null) {
                //reject device
                socket.emit('auth-refused', {
                    error: 'No driver for MAC'
                });
                cb(null);
                return;
            }
            socket.emit('auth-accepted');
            // use device name on commands and not MAC
            driver.setVantage(this.vantage, authData.MAC, authData.name, socket);
            if (driver.bindDriver != null) {
                driver.bindDriver(authData.MAC, socket, this.MacSocketHash);
            }
            cb(driver, authData);
        })
    }

    findDriver(MAC) {
        for (let driver of this.drivers) {
            if (driver.recognizes(MAC)) {
                return driver;
            }
        }
        return null;
    }


    loadPolicies() {
        // can receive a callback
        this.loadPoliciesAux("./server-drivers/policy-interconnection.txt", "inter"); // outside
        this.loadPoliciesAux("./server-drivers/policy-intraconnection.txt", "intra"); // inside
    }

    loadPoliciesAux(file, type) {
        let that = this;
        fs.readFile(file, 'utf8', function (err, contents) {
            if (err == null) {
                let policies = contents.toString().split("\n");
                for (let policy in policies) {
                    let p = policies[policy].split(" ");
                    if (!policies[policy].startsWith("#")) {
                        // load policy to their correct manager
                        that.injectPolicyOnDriver({
                            source: p[0],
                            target: p[1],
                        }, type);
                    }
                }
            }else{
                console.log(err);
            }
        });
    }

    injectPolicyOnDriver(policy, type) {
        // check the source of the device on the policy
        for(let driver in this.drivers) {
            if(policy.source.startsWith(this.drivers[driver].MAC_prefix) ||
                policy.source === this.drivers[driver].device_prefix){
                if(type == "intra") {
                    this.drivers[driver].policies.intranet.push(policy);
                }else if(type == "inter") {
                    this.drivers[driver].policies.internet.push(policy);
                }
            }
        }
    }

}

module.exports = DriverManager;
