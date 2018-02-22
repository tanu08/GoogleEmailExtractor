
var emailIDs = [];

// POST on an API and get email for a given member ID
function getEmailID( memberID ) {
    var deferred = Q.defer();

    var postData = '[[[64399324,[{"64399324":[null,null,[[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]]]],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]]]],[null,null,null,null,[[null,[2,null,"memberID"]]]],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,[2,[[[2,null,"memberID"]]]]],[null,null,null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]]]],[null,[[null,[2,null,"memberID"]],3]],[null,null,null,null,null,null,null,[[null,[2,null,"memberID"]],3]],[null,null,[[null,[2,null,"memberID"]]]],[null,null,null,[[null,[2,null,"memberID"]],8,null]],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]]]],[null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]],null,true]]],[null,[2,null,"memberID"]]]}],null,null,0]]]&at=APu-1p8_WsYlw3FYMfCWNUko3RNZ:1519219705883'

    postData = postData.replace(/memberID/g, memberID);
    
    var data = window.encodeURI('f.req=' + postData );
    
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
            getEmailIDSuccess(xhr.responseText, deferred);
        }
    });

    return deferred.promise;
}

function getEmailIDSuccess(response, deferred) {
    var userInfoItems = response.split(/,|\]|\[/);

    var memberEmailID = _.find(userInfoItems, function( infoItem) {
        infoItem = ((typeof infoItem === "string") && infoItem.length > 1) ? infoItem.substring(1, infoItem.length-1) : infoItem;
        var isEmailID = validateEmail(infoItem);
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

//an array of elements clicking on which opens pop-up. As we want a single pop-up, thus indexing reqd
//modal+modal backdrop to be hidden
function triggerPopup() {
    try {
        $( $('.hD3bZb')[0] ).trigger('click');
        $(".LVl1od.Ko2YWc").hide();
        $(".sVAYfc").fadeTo(10, 0);
    } catch (error) {
        return false;
    }

    return true;
}

// Trigger scroll on the list of members to load all of them in the dialog
function scrollMembersList() {
    var totalMembers = "";
    var deferred = Q.defer();

    if($(".rZHH0e.hD3bZb").length && ($($(".rZHH0e.hD3bZb")[0]).text() !== "")) {

        totalMembers = $($(".rZHH0e.hD3bZb")[0]).text().split(" members")[0].replace(",", "");
        totalMembers = window.parseInt(totalMembers, 10);

        console.log("Total Members in this community page: " + totalMembers);

        // Update Extension UI with this info
    }

    var currentMembersRendered = $(".czUUib").length;

    timer = window.setInterval(function() { 
        currentMembersRendered = $(".czUUib").length;

        if( !hasReachedEndOfList()) { 

            console.log("Members loaded: " + currentMembersRendered);

            $(".xKQBb")[0].scrollTop = $(".xKQBb")[0].scrollHeight;

        } else {
            console.log("clearing timer"); 
            window.clearInterval(timer);
            deferred.resolve();
        } 
    }, 1000);

    return deferred.promise;
}

// Check if the scroll-bar has reached end of the list by inspecting for a specific DOM
function hasReachedEndOfList() {
    var footerElements = $(".Jb45He.D7Ikwd");

    if( footerElements.length) {
        var reachedEnd = _.find(footerElements, function(el) {
            return $(el).is(":visible");
        });
        return !!reachedEnd;
    }
    return false;
}

// Loop through all members list, and retrieve their "Member ID" from the attribute "data-memberid".
// For each member ID, invoke the utility method to retrieve their email ID.
function scrapeMemberEmailIDs() {
    var memberListItems = $(".czUUib");

    _.each(memberListItems, function(element, index, list) {
        
        var memberID = $(element).attr("data-memberid");

        getEmailID(memberID).then(function(emailId) {
            if(emailId) {
                emailIDs.push(emailId);
            }
            if(index === list.length - 1) {
                saveEmailIDsToClipboard();
            }
        }, function(error) {
            console.error("Error while fetching Email ID");
        });
    });
}

function saveEmailIDsToClipboard() {
    var finalData = emailIDs.join(",");
    console.log("======== List of Email IDs scraped for this page ======");
    console.log(finalData); 
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
    }
}

$(document).ready(function() {
    console.log( "Ready to scrape email IDs!" );
    extractEmails();
});

//to send the data to the extension.
//chrome.runtime.connect("kcbfnjgklchgncadhpeoneeecobcaadh", {"emails" : emailIDs} );



