whereDaTweetAt
==============

Node.js backend twitter application to show where tweets are being tweeted given a search parameter.  Client is written in HTML and javascript using leaflet map.  Client receives "broadcasts" from node back-end when a tweet is found with the search word.

Demo Site: http://jg-technologies.net/whereDaTweetAt

Requirements: node installed on server

To start backend app do a:

    node whereDaTweetAt.js


To make sure your client (index.html) is connected to your node.js server, go to js/main.js and change the server name to 
  
  http://localhost:8080

instead of http://jg-technologies.net:8080

Every ten seconds you will see an output of active searches and a client count.  You will also see memory usage and the PID for the node.js app (for use in debugging/killing, etc).

To run in the background, I suggest a: 
    
    nohup node whereDaTweetAt.js > whereDaTweetAt.log &

OR:

    bash startWhereDaTweet.sh
    
- This bash script will kill any instances of the node app running and also run another node process that will            check the output file and if it exceeds 10MB will truncate the file.  This will prevent the output file taking up         too much space.
    
THEN, if you wish anytime you are in the server (I use SSH to connect to the remote server), you can navigate to the directory and do a :

    tail -f whereDaTweetAt.log
    
This will allow you to monitor the program.
