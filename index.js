
// Globals
// Background Page 
var backgroundPage, extractedEmails, clipboard; 

$(document).ready(function() {

    backgroundPage = chrome.extension.getBackgroundPage();

    var cancelElement = $('.cancel-extract-mail-button')[0];
   
    $('.extract-mail-button.active').on('click', function(event) {
      if($(event.currentTarget).hasClass('active')){
        extractEvent(event);
      }
    });
    
    cancelElement.addEventListener('click', function(event) {
        cancelEvent(event);
    });

    onPopupLoaded();
});
                                             
// Communication Channel:  Content Script <===port===> background.js <===window====> index.js

// Triggered by the background.js script, when it receives a message from content script via the long-lived port connection
function onMessage(msg) {
  changeJobStatus(msg);
}

// postMessage to the background.js script. It will forward this message to content script via the long-lived port connection.
function postMessage(msg) {
  if(backgroundPage) {
    backgroundPage.postMessage(msg);
  }
}

// Send a message to content script that "popup" has loaded. It can send back useful info in reply to this.
function onPopupLoaded() {
  postMessage({type: 'popupLoaded'});
}

function extractEvent( event ) {
  postMessage({type: 'extract'});
}

function cancelEvent( event ) {
  postMessage({type: 'cancel'});
}

function changeJobStatus( msg ) {
  var progress;

  switch (msg.type) {

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
      $(".extract-mail-button").removeClass("active extracting").addClass("processing").attr('data-processing', progress);
      $(".progress-bar").removeClass("extracting completed").addClass("processing").width(progress);
      break;

    case "extracting":
      progress = msg.percentageScraped + "%";

      $(".cancel-extract-mail-button").removeClass("visibility-hidden");
      $(".job-status").removeClass("visibility-hidden").text("Extracting: (" + msg.emailsExtracted + " emails)");
      $(".extract-mail-button").removeClass("active processing").addClass("extracting").attr('data-extracting', progress);;
      $(".progress-bar").removeClass("processing completed").addClass("extracting").width(progress);
      break;

    case "completed":
      progress = msg.percentageScraped + "%";
      extractedEmails = msg.finalData;

      $(".cancel-extract-mail-button").addClass("visibility-hidden");
      $(".job-status").removeClass("visibility-hidden").text(msg.emailsExtracted + " Emails extracted");
      $(".extract-mail-button").removeClass("active processing extracting").addClass("completed");
      $(".progress-bar").removeClass("processing extracting").addClass("completed").width(progress);
      initClipboard();
      break;

    case "error": $(".cancel-extract-mail-button").removeClass("visibility-hidden");
      $(".job-status").removeClass("visibility-hidden").text("Error encountered. Please click Cancel and reset.");
      $(".progress-bar").removeClass("processing extracting").addClass("completed").width(progress);
      break;

    default:
  }
}

// Bind clipboard copy functionality to the button.completed state
function initClipboard() {
  if(!clipboard) {
    $(".extract-mail-button.completed").on("click", function() {
      clipboard = new Clipboard('#extract', {
        text: function(trigger) {
          console.log("Copying email IDs to clipboard");
          return extractedEmails;
        }
      });

      clipboard.on('success', function(event) {
        $(".progress-bar").removeClass('completed').addClass('copied');

        // After Data is copied to the clipboard, reset this popup's UI as well as reset the content script's state.
        window.setTimeout(function() {
          resetPopupUI();
          postMessage({ type: 'reset' });
        }, 1000);

      })
    });
  }
}

// once the copy functionality is completed , reset all globals and do cleanup here.
function resetPopupUI() {
  $(".cancel-extract-mail-button").addClass("visibility-hidden");
  $('.job-status').addClass('visibility-hidden');
  $('.extract-mail-button').removeClass('processing extracting completed').addClass('active');
  $(".progress-bar").removeClass("processing extracting completed");
}


