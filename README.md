# dash_button
A quick-setup set of actions triggered by a dash button

#Installation
##Install required programs:
```sudo apt-get install alsa-base alsa-utils```
```sudo apt-get install libpcap-dev```
May need to set headphone output on Raspberry Pi:
```amixer cset numid=3 1```
And adjust volume:
```alsamixer```

##Clone repo:
```git clone https://github.com/zpeterg/dash_button```

##Create a file called ```secrets.js``` at the root, with contents like:
```
module.exports = {
    ifttt_key: 'ifttt_key_for_webhook',
    dash1: '19:93:19:39-device-id',
};

```

##Create files named ```gapp_commands.json``` and ```gapp_state.json``` outside of project root.

# Tips
## Updating the key for SSH: 
```https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/```
