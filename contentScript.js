/*states of the application : 
1) connected: Inform Background script that content script has received port connection
1) init : initialize the Popup UI.
2) processing : Scrolling the dialog for entire list
3) extracting : Call POST per member
4) completed : All emails extracted 
*/

//globals

var port, totalMembers, emailIDs = [], scrollingTimer, finalData, currentState = "init";
var membersProcessed = 0, percentageScrolled, percentageScraped;
    
setUpCommunication();

$(document).ready(function() {
    
});

//listeners for messages from background.js
function setUpCommunication() {
    
    chrome.runtime.onConnect.addListener(function(receivedPort) {
        console.log("Received Incoming Port connection from background.js: " + receivedPort.name);

        port = receivedPort;

        port.onMessage.addListener(function(msg) {    
          console.log("Received msg from background script: " + msg.type);

          switch(msg.type) {
            case "popupLoaded": popupLoaded(); break;
            case "extract": extractEmails(); break;
            case "cancel": cancelExtraction(); break;
            case "reset": reset(); break;
          }
        });

        // This event gets fired when port.disconnect() is called from the other end (background script)
        port.onDisconnect.addListener( function(disconnectedPort) {
            console.log('Received port disconnect event from background.js: ' + disconnectedPort.name);
            port = null;
        });

        postMessage({ type: 'connected' });
    });
}

// This msg is posted from index.js, when the popup dialog is loaded each time. Publish everything useful to restore popup UI correctly. 
function popupLoaded() {
    scrapeTotalMemberCount();
    publishCurrentState();
}

function scrapeTotalMemberCount() {
    var items;

    if($(".rZHH0e.hD3bZb").length && ($($(".rZHH0e.hD3bZb")[0]).text() !== "")) {

        // The members count can be any of these forms based on language of the page ("462,316 miembros", "462 316 membres", 462.316 membri)
        // So, just split the entire string into separate characters and filter out the ones which are valid integers
        items = $($(".rZHH0e.hD3bZb")[0]).text().split(/|/);

        totalMembers = _.filter(items, function(char) {
            return !_.isNaN(parseInt(char, 10));
        }).join("");

        totalMembers = window.parseInt(totalMembers, 10);

        console.log("Total Members in this community page: " + totalMembers);

        // Update Extension UI with this info
        postMessage({ type: 'stats' });
    }
}

// Publish the current state of the email extraction. This is to handle opening/closing of popups in between an extraction run.
function publishCurrentState() {
    postMessage({ type: currentState });
}

function extractEmails() {
    if(triggerPopup()) {
        scrollMembersList().then(function() {
            console.log("Scrolling complete. All members should be loaded in DOM by now!");
            console.log("Members loaded: " + $(".czUUib").length);
            scrapeMemberEmailIDs();
        }, function() {
            console.error("Some error occurred in scrollMembersList function");
        });
    } else {
        // Update Extension UI with Error
        postMessage({type: 'error'});
    }
}

//an array of elements clicking on which opens pop-up. As we want a single pop-up, thus indexing reqd
//modal+modal backdrop to be hidden
function triggerPopup() {
    try {
        if ( $(".sVAYfc").length === 0 ){
            $( $('.hD3bZb')[0] ).trigger('click');
            $(".LVl1od.Ko2YWc").hide();
            window.setTimeout(function () {
                $(".sVAYfc").css({ 'opacity': 0, 'z-index': 0 });
            }, 1);
        }
    } catch (error) {
        return false;
    }

    return true;
}

// Trigger scroll on the list of members to load all of them in the dialog
function scrollMembersList() {
    var deferred, msgType = currentState = 'processing', currentMembersRendered = 0;
    
    deferred = Q.defer();

    currentMembersRendered = $(".czUUib").length;

    scrollingTimer = window.setInterval(function() { 
        currentMembersRendered = $(".czUUib").length;

        if( !hasReachedEndOfList()) { 

            console.log("Members loaded: " + currentMembersRendered);

            $(".xKQBb")[0].scrollTop = $(".xKQBb")[0].scrollHeight;
            postProgress(msgType, currentMembersRendered, totalMembers);
        } else {
            console.log("clearing timer");
            window.clearInterval(scrollingTimer);
            // In some cases, the number of members scrolled in modal dialog doesn't match with "total members" shown in left panel.
            // Even though members loaded in DOM is less, for the extension it means 100% loading done as we have 
            // reached the end of the scrolling list.
            currentMembersRendered = totalMembers;
            postProgress(msgType, currentMembersRendered, totalMembers );
            deferred.resolve();
        } 
    }, 1000);

    return deferred.promise;
}

// Check if the scroll-bar has reached end of the list by inspecting for a specific DOM
function hasReachedEndOfList() {
    var footerElements, reachedEnd;
    
    footerElements = $(".Jb45He.D7Ikwd");

    if( footerElements.length) {
        reachedEnd = _.find(footerElements, function(el) {
            return $(el).is(":visible");
        });
        return !!reachedEnd;
    }
    return false;
}

// Loop through all members list, and retrieve their "Member ID" from the attribute "data-memberid".
// For each member ID, invoke the utility method to retrieve their email ID.
function scrapeMemberEmailIDs() {
    var memberListItems, memberID, totalMembers, msgType;
    
    currentState = "extracting";

    memberListItems = $(".czUUib");
    totalMembers = memberListItems.length;

    _.each(memberListItems, function(element, index, list) {
        
        memberID = $(element).attr("data-memberid");

        if ( currentState === "extracting" ){
            getEmailID( memberID ).then(function(emailId) {
                if(emailId) {
                    emailIDs.push(emailId);
                }

                membersProcessed++;
                percentageScraped = calculateProgress( membersProcessed, totalMembers );

                if(membersProcessed === list.length) {
                    finalData = emailIDs.join(", ");
                    msgType = currentState = "completed";
                    postMessage({type: msgType });
                    
                } else {
                    msgType = currentState = "extracting";
                    postMessage({type: msgType });
                }
                
            }, function(error) {
                currentState = "error";
                publishCurrentState();
                console.error("Error while fetching Email ID");
            });
        } 
    });
}

// POST on an API and get email for a given member ID
function getEmailID( memberID ) {
    var deferred, postData, data; 
    
    deferred = Q.defer();
    
    postData = '[[[64399324,[{"64399324":[null,null,[[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]]]],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]]]],[null,null,null,null,[[null,[2,null,"memberID"]]]],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,[2,[[[2,null,"memberID"]]]]],[null,null,null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]]]],[null,[[null,[2,null,"memberID"]],3]],[null,null,null,null,null,null,null,[[null,[2,null,"memberID"]],3]],[null,null,[[null,[2,null,"memberID"]]]],[null,null,null,[[null,[2,null,"memberID"]],8,null]],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]]]],[null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]],null,true]]],[null,[2,null,"memberID"]]]}],null,null,0]]]&at=APu-1p8_WsYlw3FYMfCWNUko3RNZ:1519219705883'
    postData = postData.replace(/memberID/g, memberID);
    
    data = window.encodeURI('f.req=' + postData );
    
    $.ajax({
        "type" : "POST",
        "url" : "https://plus.google.com/_/PlusAppUi/data?ds.extension=64399324&f.sid=1316408916574607925&hl=en-GB&soc-app=199&soc-platform=1&soc-device=1&_reqid=468308&rt=c",
        "headers" : {
            "Content-Type" : "application/x-www-form-urlencoded",
            "x-same-domain" : 1
        },
        "data" : data,
        "success" : function( response, textStatus, xhr  ) {
            getEmailIDSuccess(response, deferred);
        },
        "error" : function( xhr, textStatus, errorThrown ) {
            // Triggering a success here, because the POST API returns content-Type: 'application/json', but its actually not a valid JSON body.
            // This leads to a "parseError" in Jquery, leading to invocation of this error Callback even though API returned 200 OK
            if ( xhr.status === 200 )
                getEmailIDSuccess(xhr.responseText, deferred);
            else {
                deferred.reject();
            }
        }
    });

    return deferred.promise;
}

function getEmailIDSuccess(response, deferred) {
    var userInfoItems, memberEmailID, isEmailID;
    
     userInfoItems = response.split(/,|\]|\[/);

    memberEmailID = _.find(userInfoItems, function( infoItem ) {
        
        infoItem = ((typeof infoItem === "string") && infoItem.length > 1) ? infoItem.substring(1, infoItem.length-1) : infoItem;
        isEmailID = validateEmail(infoItem);
        
        return isEmailID; 
    });

    memberEmailID = memberEmailID ? memberEmailID.substring(1, memberEmailID.length-1) : null;

    deferred.resolve(memberEmailID);
}

//check if string is an email address
function validateEmail( string ) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test( string );
}

// once the copy functionality is completed / cancelled, reset all globals and do cleanup here.
function reset() {
    emailIDs = [];
    currentState = "init";
    membersProcessed = 0;
    window.clearInterval(scrollingTimer);
}

//utility

// Posts the percentage of users scrolled in the modal dialog
function postProgress( type, done, total ) {
    var percentage;
    percentage = percentageScrolled = calculateProgress( done, total );
    postMessage({type: type });
}

function calculateProgress( done, total ){
    var percentage = Math.ceil(( done / total ) * 100);
    return percentage ;
}

function postMessage(msg) {
    var msgType = msg.type;

    if (port) {
        switch(msgType) {
            case 'connected':
                port.postMessage({ type: msgType });
                break;
            case 'init':
                port.postMessage({ type: msgType });
                break;
            case 'stats':
                port.postMessage({ type: msgType, totalMemberCount: totalMembers });
                break;
            case 'processing':
                port.postMessage({type: msgType, progress: percentageScrolled });
                break;
            case 'extracting':
                port.postMessage({type: msgType, emailsExtracted: emailIDs.length, percentageScraped: percentageScraped });
                break;
            case 'completed':
                port.postMessage({type: msgType, emailsExtracted: emailIDs.length, percentageScraped: percentageScraped, finalData: finalData });
                break;
            case 'error':
                port.postMessage({ type: msgType });
                break;
        }
    } 
}

function cancelExtraction( event ) {
    switch( currentState ) {
        case "processing" : reset();
                            publishCurrentState(); 
                            break;
        case "extracting" : ( emailIDs.length === 0 ) ? reset() : currentState = "completed";
                            publishCurrentState(); 
                            break;
        case "error"     : reset();
                            publishCurrentState(); 
                            break;
    }
}




