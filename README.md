# dash_button
A quick-setup set of actions triggered by a dash button

#Installation
##First update system and Raspberry Pi:
```
sudo apt-get update
sudo apt-get upgrade
sudo rpi-update
```
##Install required programs:
```
sudo apt-get install git -y
sudo apt-get install alsa-base alsa-utils -y
sudo apt-get install libpcap-dev -y
```
And node:
```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
```
May need to set headphone output on Raspberry Pi:
```
amixer cset numid=3 1
```
And adjust volume:
```
alsamixer
```

##Clone repo:
```
git clone https://github.com/zpeterg/dash_button
```

##Create a file called ```secrets.js``` at the root, with contents like:
```
module.exports = {
    ifttt_key: 'ifttt_key_for_webhook',
    dash1: '19:93:19:39-device-id',
};

```

##Create files named ```gapp_commands.json``` and ```gapp_state.json``` outside of project root.

# Tips
## Outline
There are three different main sections:
- gapp: Server (```sudo npm start``` to initiate server),
- bot: Looping script that contains most of the brains, translating COMMANDS to STATE and triggering events as this is done (npm start to run script).
- gapp/gapp_react: Client-side React app ("npm start" to run the development server, "npm run build" to compile for server to run).
## Updating the key for SSH: 
```
https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/
```
## Flushing logs
```
sudo pm2 flush
```
## Setting Static IP in Rasp Pi, from https://askubuntu.com/questions/530522/setting-a-static-ip-on-ubuntu:
```
sudo /etc/network/interfaces
```
And add content like this:
```
auto wlan0
iface wlan0 inet static
    address 192.168.1.106
    netmask 255.255.255.0
    network 192.168.1.0
    broadcast 192.168.1.255
    gateway 192.168.1.1
    dns-nameservers 192.168.1.1, 8.8.8.8
    wpa-ssid <Your wifi network SSID>
    wpa-psk <Your wifi password>
```
## Setting up Si7021 temperature sensor
https://github.com/skylarstein/si7021-sensor
http://console.aws.amazon.com/console/home?region=us-east-1
http://www.pibits.net/code/raspberry-pi-si7021-sensor-example.php
And don't forget to turn on the i2c: ```raspi-config```
## Auto-mount a USB drive (eg., for music)
Create script under "/etc/init.d/mystartup.sh" like this (though not certain that this will run):
```
#!/bin/bash
echo "Setting up USB mount"
sudo mount /dev/sda1 /media/usb
``` 
