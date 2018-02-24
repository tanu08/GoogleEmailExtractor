// Globals
var globalPort;

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


chrome.runtime.onConnect.addListener(function(port) {
    var popUpView;

    console.log("Received Incoming long-lived connection " + port);

    globalPort = port;

    globalPort.onMessage.addListener(function(msg) {    
      console.log("Received msg from content script: " + msg.type);

      if(chrome.extension.getViews({type:'popup'}).length > 0) {
        console.log("Calling function on popUpView");

        popUpView = chrome.extension.getViews({type:'popup'})[0];
        popUpView.onMessage(msg);
      }
      
    });

    
});

function postMessage(msg) {
  console.log("Sending msg from popUpView to content script via background.js: " + msg.type);
  globalPort.postMessage(msg);
}
