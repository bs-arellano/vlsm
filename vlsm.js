const fs = require('fs');

const base2powers = (num) => {
        if (num == 1) return [0];
        if (num == 0) return [1];
        const power = Math.floor(Math.log2(num));
        const rest = num - 2 ** power;
        if (rest == 0) return [power];
        return [power, ...base2powers(rest)];
};

const getNetworkPowers = (hostList) => {
        const neededNetworks = hostList.map((host) => {
                return { net: host, powers: [...base2powers(host)] };
        })
        return [].concat(...neededNetworks).sort((a, b) => {
                return b - a;
        })
}

const StringToBinary = (str) => {
        const octates = str.split(".");
        const stringIP = octates.map((octate) => {
                return parseInt(octate).toString(2);
        });
        return stringIP;
}

class IPAddress {
        constructor(ip, mask) {
                this.ip = StringToBinary(ip);
                this.mask = mask;
        }
        get address() {
                return this.ip.map((octate) => {
                        return parseInt(octate, 2);
                }).join('.')
        }
        get next() {
                let goalOctate = Math.floor(this.mask / 8)
                let offset = 8 - (this.mask % 8)
                return this.address.split('.').toReversed().map((octate, index) => {
                        if (index == 3 - goalOctate) {
                                const addition = parseInt(octate) + 2 ** offset;
                                if (addition > 255) {
                                        goalOctate -= 1;
                                        offset = 0
                                        return 0
                                }
                                else return addition
                        }
                        return octate;
                }).toReversed().join('.')
        }
}

const getIpAddresses = (ip, hosts) => {
        const networks = []
        let nextIP = ip
        let flatHosts = hosts.flatMap(({ net, powers }) =>
                powers.map(power => ({ host: net, power }))
        ).sort((a, b) => b.power - a.power)
        flatHosts.forEach((host) => {
                const ip = new IPAddress(nextIP, 32 - host.power)
                networks.push({ net: host.host, addr: ip });
                nextIP = ip.next
        });
        return networks
}

const formatNetworks = (networks) => {
        // Create an object to store networks grouped by 'net' property
        const groupedNetworks = {};

        // Iterate through each network
        networks.forEach((network) => {
                // Check if the 'net' property already exists as a key in groupedNetworks
                if (!groupedNetworks[network.net]) {
                        // If not, create a new array for that 'net' value
                        groupedNetworks[network.net] = [];
                }
                // Push the network into the array corresponding to its 'net' value
                groupedNetworks[network.net].push(`${network.addr.address}/${network.addr.mask}`);
        });

        return groupedNetworks;
}

const hosts = [13500, 6700, 4830, 3326, 1720, 872];
const neededPowers = getNetworkPowers(hosts);
const lan_networks = getIpAddresses("180.180.0.0", neededPowers);
const serials = Array(lan_networks.length).fill(4);
const serialPowers = getNetworkPowers(serials)
const serial_networks = getIpAddresses(lan_networks[lan_networks.length - 1].addr.next, serialPowers);
console.log("Total networks", lan_networks.length)
const result = { lans: formatNetworks(lan_networks), wans: formatNetworks(serial_networks) }
console.log(result);

fs.writeFile('networks.json', JSON.stringify(result), 'utf-8', (err) => {
        if (err) {
                console.error('Error writing file:', err);
        } else {
                console.log('File written successfully.');
        }
});