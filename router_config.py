import pyautogui
import time
import json
import ipaddress

def read_json_file(filename: str):
    with open(filename, 'r') as file:
        data: dict = json.load(file)
    return data

def type_string(string: str):
    # Pause for 5 seconds to give you time to focus on the input area
    # Type out the string
    pyautogui.typewrite(string)

def cidr_to_netmask(cidr):
    ip = ipaddress.IPv4Network(cidr, strict=False)
    netmask = ip.netmask
    gateway = ip[1]
    address = ip[0]
    return str(address), str(gateway), str(netmask)

# Example usage
if __name__ == "__main__":
    configs: list[str] = []
    data = read_json_file("networks.json")
    host: str
    addresses: list[str]
    index: int = 0
    for host, addresses in data["lans"].items():
        address: str
        for number, address in enumerate(addresses):
            lan_ip, lan_gateway, lan_netmask = cidr_to_netmask(address)
            wan_ip, wan_gateway, wan_mask = cidr_to_netmask(data["wans"]["4"][index])
            configString = f'''enable
configure terminal
hostname {host}_{number}
interface gigabitEthernet 0/0/0
ip address {lan_gateway} {lan_netmask}
no shutdown
exit
interface serial 0/1/0
ip address {wan_gateway} {wan_mask}
clock rate 56000
bandwidth 56000
no shutdown
exit
router rip
version 2
network {lan_ip}
network {wan_ip}
exit
exit
copy running-config startup-config\n\n'''
            configs.append(configString)
            index += 1
    for config in configs:   
        input("Press enter when you're ready")
        time.sleep(5)     
        pyautogui.typewrite(config, 0.05)
    print ("ended")