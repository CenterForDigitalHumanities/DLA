#!/bin/bash
if [[ ! -e /opt/nodeapps/logs/dlalogs.txt ]]; then
    mkdir -p /opt/nodeapps/logs
    touch /opt/nodeapps/logs/dlalogs.txt
fi
cd /opt/nodeapps/dla-public-site-3001
npm install
npm start >> /opt/nodeapps/logs/dlalogs.txt 2>&1 &