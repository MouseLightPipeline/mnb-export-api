#!/usr/bin/env bash

logName=$(date '+%Y-%m-%d_%H-%M-%S');

mkdir -p /var/log/mnb

export DEBUG=mnb*

node --max-old-space-size=8192 app.js >> /var/log/mnb/${HOSTNAME}-${logName}.log 2>&1
