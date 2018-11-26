#!/usr/bin/env bash

logName=$(date '+%Y-%m-%d_%H-%M-%S');

mkdir -p /var/log/mnb

export DEBUG=mnb*

node app.js >> /var/log/mnb/export-api-${logName}.log 2>&1
