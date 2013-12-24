/*
  Node app: whereDaTweetAt
  Author: John Youngman
  Purpose: Basically to broadcast from "live" tweets using the twitter API based on seach
            words from the client.  It will continually broadcast the tweets until [all] clients
            have disconnected from the "search broadcast"  EACH search term will have its own
            "broadcast socket".  If the app recieves a request for a search term that is already broadcasting, it will
            do "nothing" because the broadcast already exists at {server:port}/search.

            Storing all broadcasts in an array of object SearchStream

            "Garbage collection": Every 10 seconds the app will check the array of SearchStreams for connected clients.
                                  In the event of zero clients, it will splice the search stream from the array.



 */

/*LIBRARY FUNCTIONS**********************************************************************************************/

//get date string for today's date (e.g. '2011-01-01')
function datestring () {
    var d = new Date(Date.now() - 5*60*60*1000);  //est timezone
    return d.getUTCFullYear()   + '-'
        +  (d.getUTCMonth() + 1) + '-'
        +   d.getDate();
}

/* END LIBRARY FUNCITONS *******************************************************************************************/

var Bot = require('./twit/examples/bot')
        , config1 = require('./twit/config'); // libraries for connecting to twitter

var bot = new Bot(config1); //  create the bot

var io = require('socket.io').listen(8080);
io.set('log level', 1); //change 1 to higher number for more loggig

var searchStreams = []; // store the search streams
var activeSearches = []; // store the active searches

var doCache = false; //change to true to load stored tweets in the search stream
var makeNewStream = true;


var listener = io.of('/new')
    .on('connection',function(socket){

        socket.on('get',function(search){

            console.log("New Client Connected!");

            //see if one is already streaming
            makeNewStream = true; // default to create new stream

            for(var i =0;i<activeSearches.length;i++){

                console.log("searching streams for " + search + " in " + searchStreams[i].term);
                if(activeSearches[i]===search){
                    console.log("already have a stream..");
                    makeNewStream = false;
                }

            }

            if(makeNewStream){ // search failed - lets create a new stream and add to our array

                console.log('getting new search term: ' + search);
                searchStreams.splice(0,0, new StreamSearch(search));
                activeSearches.push(search);
            }
            });

    });


/*
    object streamSearch

    flags:
        logIt

    properties:
        term - word to search twitter for
        queue - hold recent 30 findings if we wish to display
        stream - (using bot from twitter api see twit/examples/bot.js (NOT WRITTEN BY ME)

    purpose:
        given string searchFor, filter the live tweets and broadcast those tweets to any connected client

*/
var StreamSearch = function(searchFor){

    var self = this;
    var logIt = true;
    self.term = searchFor;
    self.queue = [];
    self.queue.add = function(item){

        while(self.queue.length>29){ // keep only 30 items
            self.queue.shift();
        }
        self.queue.push(item);
    }


    self.stream =  bot.twit.stream('statuses/filter', { track: self.term });
    console.log('attempting to create stream for ' + '/' + self.term);

    //Create the broadcast of filtered tweets
    self.stream.comm = io
        .of('/' + self.term)

        .on('connection', function (socket) {

            self.socket = socket;

            //check the queue and if we are showing cache, broadcast the recent found items in the queue (cache)
            if(self.queue.length>0 && doCache){
                //show the tweets from the queue
                self.queue.forEach(function(element, index, array){ socket.emit('tweet',element);})
            }

            self.stream.on('tweet', function (tweet) {

                if(tweet.geo!==null){ //only show geo-encoded tweets | we need the location data

                    //basic info we will definitely want to display as its own easy to find variables
                    var text = tweet.text;
                    var user = tweet.user;
                    var user_name = user.screen_name;
                    var date = new Date(tweet.created_at);
                    var coords = tweet.coordinates.coordinates;//JSON.stringify(tweet.coordinates);
                    var place = tweet.place!==null ? tweet.place.full_name: 'unknown' ;
                    var tLog = user_name + " tweeted: " + text + " at " + coords;

                    //create the response with the above properties, but also include everything in the allData property
                        //saves time and need to modify this .js if we want more info from the tweet on the client
                        //exposes all data from tweet if client needs it.
                    var response = {

                        'coords': coords,
                        'tLog': tLog,
                        'username' : user_name,
                        'text' : text,
                        'date' : date,
                        'loc'  : place,
                        'allData': tweet,

                    };

                    //broadcast the tweet and add it the response to the queue
                    socket.emit('tweet',response);
                        self.queue.add(response);
                }
            });

        })
}
console.log('whereDaTweetAt: Running.'); // so we know its running

//little garbage collection
setInterval(function(){

        if(searchStreams.length>0){

            for(var x = 0;x<=searchStreams.length-1;x++){

                var thisTerm = searchStreams[x].term;
                var thisActiveCount = searchStreams[x].stream.comm.clients().length;
                console.log("Client count for term: " + thisTerm + ": " + thisActiveCount);
                if(thisActiveCount==0)
                {
                    console.log("Splicing stream for: " + searchStreams[x].term);
                    searchStreams[x].stream.stop();
                    searchStreams[x].stream.comm = null;
                    searchStreams[x].term = null;
                    searchStreams[x] = null;

                    searchStreams.splice(x,1);
                    activeSearches.splice(x,1); // used to track which ones
                }
            }
        }

        if(searchStreams.length>0) {
           console.log(new Date() + ": Total Streams: " + searchStreams.length);
        }
        else{
            console.log(new Date() + ": No Active Streams.");
        }

        console.log("Process running on " + process.pid);
        //console.log("Memory Usage:");
        //console.log(process.memoryUsage());
        //console.log("----------------------");

},10000); //changed to every 10 seconds


