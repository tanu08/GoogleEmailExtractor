// When the extension is installed or upgraded ...
chrome.runtime.onInstalled.addListener(function() {
  // Replace all rules ...
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    // With a new rule ...
    chrome.declarativeContent.onPageChanged.addRules([
      {
        // That fires when a page's URL contains a 'plus.google.com/communities/' ...
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlContains: 'plus.google.com/communities/' },
          })
        ],
        // And shows the extension's page action.
        actions: [ new chrome.declarativeContent.ShowPageAction() ]
      }
    ]);
  });
});

$( document ).on("load",function() {
    var extractElement = document.getElementById('extract');
    var cancelElement = document.getElementById('cancel');
    
    if ( extractElement )
      extractElement.addEventListener('click', function(event) {
          extractEvent(event);
      });
      if ( cancelElement )
      cancelElement.addEventListener('click', function(event) {
          cancelEvent(event);
      });

});

function extractEvent( event ) {
  chrome.tabs.query({ active: true, currentWindow: true, windowType: "normal" }, function( tabs ){
    chrome.tabs.sendMessage( tabs[0].id, { type: "extract" }, function( response ){
        changeButtonState("started");
    });
  });
}

function cancelEvent( event ) {
  chrome.tabs.query({ active: true, currentWindow: true, windowType: "normal" }, function( tabs ){
    chrome.tabs.sendMessage( tabs[0].id, { type: "cancel" }, function( response ){
        changeButtonState("cancelled");
    });
  });
}

function changeButtonState( state ){
  switch( state ){
    case "started" : console.log("Extracted"); 
                    break;
    case "cancelled" : console.log("Cancelled"); 
                    break;
  }

}
