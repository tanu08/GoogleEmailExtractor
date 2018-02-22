
var emailIDs = [];

// POST on an API and get email for a member ID
function getEmailID( memberID ) {
    var postData = '[[[64399324,[{"64399324":[null,null,[[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]]]],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]]]],[null,null,null,null,[[null,[2,null,"memberID"]]]],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,[2,[[[2,null,"memberID"]]]]],[null,null,null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]]]],[null,[[null,[2,null,"memberID"]],3]],[null,null,null,null,null,null,null,[[null,[2,null,"memberID"]],3]],[null,null,[[null,[2,null,"memberID"]]]],[null,null,null,[[null,[2,null,"memberID"]],8,null]],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]]]],[null,null,null,null,null,null,null,null,[[null,[2,null,"memberID"]],null,true]]],[null,[2,null,"memberID"]]]}],null,null,0]]]&at=APu-1p8_WsYlw3FYMfCWNUko3RNZ:1519219705883'
    postData = postData.replace("memberID", memberID );
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
             xhr.responseText.split(/,|\]|\[/);
        },
        "error" : function( xhr, textStatus, errorThrow ) {

        }
    })
    return emailIDs;
}

//check if string is an email address
function validateEmail( string ) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test( string );
}

//an array of elements clicking on which opens pop-up. As we want a single pop-up, thus indexing reqd
//modal+modal backdrop to be hidden
function triggerPopup() {
    $( $('.hD3bZb')[0] ).trigger('click');
    $('.LVl1od.Ko2YWc, .sVAYfc').hide(); 
}




//to send the data to the extension.
chrome.runtime.connect("kcbfnjgklchgncadhpeoneeecobcaadh", {"emails" : emailIDs} );