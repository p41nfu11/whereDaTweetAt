/**********************************************************************************************************************

 Script: main.js
 Author: John Youngman
 Date: Dec 2013
 Purpose: Client script for whereDaTweetAt node server (app)

**********************************************************************************************************************/

//Globals
    var map;
    var markers = [];
    var resultsSocket; // socket used to receive the tweets from the search
    var socket; //initial connect to whereDaTweet to either find an existing search or start a new one

//function : logTweet
//accepts  : a tweet object
//returns  : nothing
//purpose  : display the tweet info on the sidebar
function logTweet(tweet){


    var tHtml = "";

    tHtml+="<div class='tweet-user'><img align=left src='" + tweet.allData.user.profile_image_url + "'>" + tweet.allData.user.name;
    tHtml+="<br/><a href='http://twitter.com/" + tweet.username + "' target=_new><span class='tweet-username'>@" + tweet.username + "</span></a> ";
    tHtml+= "</div>";
    tHtml+="<div class='tweet-text'>" + tweet.text + "</div>";
    var tweetedDate = new Date(tweet.date);
    var now = new Date();
    var diff = now - tweetedDate;
    var msec = diff;
    var hh = Math.floor(msec / 1000 / 60 / 60);
    msec -= hh * 1000 * 60 * 60;
    var mm = Math.floor(msec / 1000 / 60);
    msec -= mm * 1000 * 60;
    var ss = Math.floor(msec / 1000);
    msec -= ss * 1000;
    if(mm<1){
        mm = "1";
    }
    tHtml+="<div class='tweet-location'>" + mm + " m ago - " + tweet.loc + "</div>";


    $("<div/>", {
        'class':'logged-tweet',
        'html':tHtml
    }).prependTo('div#loggedTweets').delay(800).fadeIn("slow");

}

//clear the markers on the map
function clearMarkers()
{
    markers.forEach(function(element, index, array){

        map.removeLayer(element);

    });
}

//a tweet was received! let's place it on the map
function addMarker(tweet)
{

    var point = tweet.coords;
    var marker = L.marker([point[1], point[0]]);
    marker.title= '@' + tweet.username;
    var popUpString = '@' + tweet.username + ':' + tweet.text;
    popUpString+= ' on ' + new Date(tweet.date).toLocaleString();
    popUpString+= ' ( ' + tweet.loc + ')';

    marker.bindPopup(popUpString);
    marker.addTo(map);
    markers.push(marker);

}

//let's get the map started!
function initializeMap(){

    map = L.map('map', {
        center: [0, 0],
        zoom: 2,
        scrollWheelZoom:false
    });

    L.tileLayer('http://{s}.tile.cloudmade.com/6f906fdb28324bec838e1d6ab70ab81a/997/256/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18
    }).addTo(map);
}



$(document).ready(function(){

    //LoadMap
    initializeMap();

    //enter key for search
    $('input#search').bind('keypress',function (event){
        if (event.keyCode === 13){
            searchTwitter();
        }
    });


    $('input#search').click(function(e){
        this.select(); // select text on click
    })


});

//clear the side-bar
function clearConsole(){
    clearMarkers();
   $(".logged-tweet").remove();
}

//initiate the search
function searchTwitter(){

    var search = $("#search").val();
    if(search=="") return;
    clearConsole();

    $("#console h1").html("Where da "+ search + " @...");
    getTweets();



}

function showServerDown ()
{

    $("#application_message").html("Application Server Not Responding...");
    $("#application_message").fadeIn();
    $("#console").fadeOut();
}

function hideServerDown(){

    $("#application_message").fadeOut();

}
function getTweets(){


    var search = $("#search").val();
    var server = "http://jg-technologies.net:8080"; //node app listens/broadcasts on port 8080

    //for local testing
    //server = "http://localhost:8080";


    socket = io.connect(server + '/new');

    socket.on('connect', function () {

             hideServerDown();
    });

    socket.on('disconnect', function(){

            showServerDown();

    });

    socket.emit('get',search);


    if(resultsSocket!==undefined)
    {
        try{
            resultsSocket.disconnect(); // disconnect if we were already searching something
            //this caused a problem on creating new searches - would still stay connected
        }
        catch(exception){

            //later maybe?
        }
    }

    //this works because the initial call to /new and socket.emit('get',search)
    //the node.js app/server searches current searches and if one exists, does nothing
    //if it doesn't exist it creates a new "broadcast" at {server}/search

    resultsSocket = io.connect(server + "/" + search);

        resultsSocket.on('tweet', function (msg) {

        if(resultsSocket.socket.connected){

            $("#console").fadeIn("slow");
            addMarker(msg); // add a pin
            logTweet(msg); // show the tweet info
        }
        else{
            showServerDown();
        }

    });

}