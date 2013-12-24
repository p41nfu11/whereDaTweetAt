#!/bin/bash
>whereDaTweetAt.log
kill $(ps aux | grep '[n]ode whereDaTweetAt.js'  | awk '{print $2}')
kill $(ps aux | grep '[n]ode checkLogFileSize.js'  | awk '{print $2}')

nohup node whereDaTweetAt.js >> whereDaTweetAt.log &
nohup node checkLogFileSize.js >>whereDaTweetAt.log &


