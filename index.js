
// Globals
// Background Page 
var backgroundPage, extractedEmails, clipboard; 

$(document).ready(function() {

    backgroundPage = chrome.extension.getBackgroundPage();

    var cancelElement = $('.cancel-extract-mail-button')[0];
   
    $('.extract-mail-button.active').on('click', extractEvent);
    $('.cancel-extract-mail-button').on('click', cancelEvent);

    connectToContentScript();
    connectToBackgroundScript();
});
                                             
// Communication Channel:  Content Script <===port===> background.js <===window====> index.js

// Through the background page, create a long-live port connection with content script for 2-way message exchange 
function connectToContentScript () {
  if(backgroundPage) {
    backgroundPage.setupCommunication();
  }
}

// We establish a port with background script, but this port is only used to "figure out" when popup dialog closes.
// Currently, there's no event that gets triggered when Popup dialog closes.
// For more details: https://bugs.chromium.org/p/chromium/issues/detail?id=31262
function connectToBackgroundScript () {
  chrome.runtime.connect({ name: "Popup-BackgroundScript" });
}

// Triggered by the background.js script, when it receives a message from content script via the long-lived port connection
function onMessageReceived(msg) {
  changeJobStatus(msg);
}

// post a Message to the background.js script. It will forward this message to content script via the long-lived port connection.
function postMessageOverPort(msg) {
  if(backgroundPage) {
    backgroundPage.postMessageOverPort(msg);
  }
}

// Send a message to content script that "popup" has loaded. It can send back useful info in reply to this.
function popupLoaded() {
  postMessageOverPort({type: 'popupLoaded'});
}

function extractEvent( event ) {
  if( $(event.currentTarget).hasClass('active'))
    postMessageOverPort({type: 'extract'});
}

function cancelEvent( event ) {
  postMessageOverPort({type: 'cancel'});
}

function changeJobStatus( msg ) {
  var progress;

  switch (msg.type) {

    // After port is created between background and content script, content script sends this message as an Ack for it. Reply back.
    case "connected":
      popupLoaded();
      break;

    case "init":
      resetPopupUI();
      break;

    case "stats":
      $(".members-count").removeClass("visibility-hidden").text("Total Members: " + msg.totalMemberCount);
      break;

    case "processing": 
      progress = msg.progress + "%";
      $(".cancel-extract-mail-button").removeClass("visibility-hidden");
      $(".job-status").removeClass("visibility-hidden").text("Processing");
      $(".extract-mail-button").removeClass("active extracting emails-copied").addClass("processing").attr('data-processing', progress);
      $(".progress-bar").removeClass("extracting completed").addClass("processing").width(progress);
      break;

    case "extracting":
      progress = msg.percentageScraped + "%";

      $(".cancel-extract-mail-button").removeClass("visibility-hidden");
      $(".job-status").removeClass("visibility-hidden").text("Extracting: (" + msg.emailsExtracted + " emails)");
      $(".extract-mail-button").removeClass("active processing emails-copied").addClass("extracting").attr('data-extracting', progress);;
      $(".progress-bar").removeClass("processing completed").addClass("extracting").width(progress);
      break;

    case "completed":
      progress = msg.percentageScraped + "%";
      extractedEmails = msg.finalData;

      $(".cancel-extract-mail-button").addClass("visibility-hidden");
      $(".job-status").removeClass("visibility-hidden").text(msg.emailsExtracted + " Emails extracted");
      $(".extract-mail-button").removeClass("active processing extracting emails-copied").addClass("completed");
      $(".progress-bar").removeClass("processing extracting").addClass("completed").width(progress);
      initClipboard();
      break;

    case "error": 
      $(".cancel-extract-mail-button").removeClass("visibility-hidden");
      $(".job-status").removeClass("visibility-hidden").text("Error encountered. Please click Cancel and reset.");
      $(".progress-bar").removeClass("processing extracting").addClass("completed").width(progress);
      break;

    default:
  }
}

// Bind clipboard copy functionality to the button.completed state
function initClipboard() {
  if(!clipboard) {
    $(".extract-mail-button.completed").on("click", copyToClipboard);
  }
}

function copyToClipboard(event) {
  if( $(event.currentTarget).hasClass('completed') ) {

    clipboard = new Clipboard('#extract', {
      text: function(trigger) {
        console.log("Copying email IDs to clipboard");
        return extractedEmails;
      }
    });

    clipboard.on('success', function(event) {
      $(".extract-mail-button.completed").off("click", copyToClipboard);
      $(".extract-mail-button").removeClass('completed').addClass('emails-copied');

      // After Data is copied to the clipboard, reset this popup's UI as well as reset the content script's state.
      window.setTimeout(function() {
        console.log('Triggered reset event for content script');
        resetPopupUI();
        postMessageOverPort({ type: 'reset' });
      }, 1000);

    })
  }
}

// once the copy functionality is completed , reset all globals and do cleanup here.
function resetPopupUI() {
  $(".cancel-extract-mail-button").addClass("visibility-hidden");
  $('.job-status').addClass('visibility-hidden');
  $('.extract-mail-button').removeClass('processing extracting completed emails-copied').addClass('active');
  $(".progress-bar").removeClass("processing extracting completed");

  if(clipboard) {
    clipboard.destroy();
    clipboard = null;
  }
}


