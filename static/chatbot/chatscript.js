var currentLanguage = "en-US"; // Default language

// Update recognition language based on selection
$('#language-selector').on('change', function () {
    currentLanguage = $(this).val();
    recognition.lang = currentLanguage;
    console.log(`Language changed to: ${currentLanguage}`);
});

// Start listening for speech
try {
  var SpeechRecognition = this.SpeechRecognition || this.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
  recognition.lang = currentLanguage; // Set the initial language
} catch (e) {
  console.error(e);
  $('.no-browser-support').show();
  $('.app').hide();
}


var started = 0;
var noteTextarea = $('#chat-input');
var instructions = $('#recording-instructions');
var notesList = $('ul#notes');

var noteContent = '';

// Get all notes from previous sessions and display them.
var notes = getAllNotes();
renderNotes(notes);

/*-----------------------------
      Voice Recognition 
------------------------------*/

// If false, the recording will stop after a few seconds of silence.
// When true, the silence period is longer (about 15 seconds),
// allowing us to keep recording even when the user pauses. 
recognition.continuous = true;

// This block is called every time the Speech APi captures a line. 
recognition.onresult = function(event) {

  // event is a SpeechRecognitionEvent object.
  // It holds all the lines we have captured so far. 
  // We only need the current one.
  var current = event.resultIndex;

  // Get a transcript of what was said.
  var transcript = event.results[current][0].transcript;

  // Add the current transcript to the contents of our Note.
  // There is a weird bug on mobile, where everything is repeated twice.
  // There is no official solution so far so we have to handle an edge case.
  var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

  if(!mobileRepeatBug) {
    noteContent = transcript;
    noteTextarea.val(noteContent);
    sendMessage();
  }
};

recognition.onstart = function() { 
  instructions.text('Voice recognition activated. Try speaking into the microphone.');
}

recognition.onspeechend = function () {
  instructions.text('You were quiet for a while, so voice recognition turned itself off.');
  started = 0; // Reset the started flag
  $(".fa-microphone-slash").removeClass("fa fa-microphone-slash").addClass("fa fa-microphone"); // Update mic icon
};

recognition.onend = function () {
  if (started === 1) {
      // Restart recognition automatically if desired
      recognition.start();
  } else {
      // Update mic status to off
      $(".fa-microphone-slash").removeClass("fa fa-microphone-slash").addClass("fa fa-microphone");
      instructions.text('Voice recognition stopped.');
  }
};


recognition.onerror = function(event) {
  if(event.error == 'no-speech') {
    instructions.text('No speech was detected. Try again.');  
  };
}



/*-----------------------------
      App buttons and input 
------------------------------*/

$('#start-record-btn').on('click', function (e) {
  if (noteContent.length) {
      noteContent += ' ';
  }
  if (started == 1) {
      started = 0;
      recognition.stop();
      $(".fa-microphone-slash").removeClass("fa fa-microphone-slash").addClass("fa fa-microphone");
      instructions.text('Voice recognition paused.');
  } else {
      recognition.lang = currentLanguage; // Update language before starting
      started = 1;
      recognition.start();
      $(".fa-microphone").removeClass("fa fa-microphone").addClass("fa fa-microphone-slash");
      instructions.text('Voice recognition started.');
  }
});



$('#pause-record-btn').on('click', function(e) {
  recognition.stop();
  $('#pause-record-btn').attr('id', 'start-record-btn');
  $(".fa-microphone-slash").removeClass("fa fa-microphone-slash").addClass("fa fa-microphone");
  instructions.text('Voice recognition paused.');
});

// Sync the text inside the text area with the noteContent variable.
noteTextarea.on('input', function() {
  noteContent = $(this).val();
})

$('#save-note-btn').on('click', function(e) {
  recognition.stop();

  if(!noteContent.length) {
    instructions.text('Could not save empty note. Please add a message to your note.');
  }
  else {
    // Save note to localStorage.
    // The key is the dateTime with seconds, the value is the content of the note.
    saveNote(new Date().toLocaleString(), noteContent);

    // Reset variables and update UI.
    noteContent = '';
    renderNotes(getAllNotes());
    noteTextarea.val('');
    instructions.text('Note saved successfully.');
  }
      
})


notesList.on('click', function(e) {
  e.preventDefault();
  var target = $(e.target);

  // Listen to the selected note.
  if(target.hasClass('listen-note')) {
    var content = target.closest('.note').find('.content').text();
    readOutLoud(content);
  }

  // Delete note.
  if(target.hasClass('delete-note')) {
    var dateTime = target.siblings('.date').text();  
    deleteNote(dateTime);
    target.closest('.note').remove();
  }
});



/*-----------------------------
      Speech Synthesis 
------------------------------*/

function readOutLoud(message) {
	var speech = new SpeechSynthesisUtterance();

  // Set the text and voice attributes.
	speech.text = message;
	speech.volume = 1;
	speech.rate = 1;
	speech.pitch = 1;
  
	window.speechSynthesis.speak(speech);
}



/*-----------------------------
      Helper Functions 
------------------------------*/

function renderNotes(notes) {
  var html = '';
  if(notes.length) {
    notes.forEach(function(note) {
      html+= `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span>
          <a href="#" class="listen-note" title="Listen to Note">Listen to Note</a>
          <a href="#" class="delete-note" title="Delete">Delete</a>
        </p>
        <p class="content">${note.content}</p>
      </li>`;    
    });
  }
  else {
    html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
  }
  notesList.html(html);
}


function saveNote(dateTime, content) {
  localStorage.setItem('note-' + dateTime, content);
}


function getAllNotes() {
  var notes = [];
  var key;
  for (var i = 0; i < localStorage.length; i++) {
    key = localStorage.key(i);

    if(key.substring(0,5) == 'note-') {
      notes.push({
        date: key.replace('note-',''),
        content: localStorage.getItem(localStorage.key(i))
      });
    } 
  }
  return notes;
}


function deleteNote(dateTime) {
  localStorage.removeItem('note-' + dateTime); 
}


//Chat Web API Script
var url = "http://127.0.0.1:3003";
var socket;

function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    if (connected) {
        $(".intro-box").hide().fadeOut(300);   
        $(".chat-box").show().fadeIn(300);   
    }
    else {
         $(".intro-box").show().fadeIn(300); 
         $(".chat-box").hide().fadeOut(300);   
         recognition.stop();
         $(".fa-microphone-slash").removeClass("fa fa-microphone-slash").addClass("fa fa-microphone");
    }
    $(".chat-logs").html("");
}

function connect() {
  socket = io.connect(url + "/dd");
  socket.on('msg', async function(msg) {
    setConnected(true);
    response_message("Hello again! How can I help you with your insurance claim today?") 
  });
}

function disconnect() {
    setConnected(false);
    console.log("Disconnected");
}


function exeApi(msg) {
  var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer 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");

    var raw = JSON.stringify({
      "content": msg,
      "language": currentLanguage 
    });

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    return fetch("/api/conversation", requestOptions)
      .then(response => response.text())
      .then(result => {
        result = JSON.parse(result);
        if(result.status == true) {
          console.log(result)
          return result['data']
        } else {
          return "Sorry! I didn't get you. Please try again."
        }
      })
      .catch(error =>{
        console.log('error', error)
        return "Sorry! I didn't get you. Please try again."
      });
    
}


async function sendMessage() {
  if (socket != null && socket.connected) {
      var msg = $("#chat-input").val();
      request_message(msg); // Show the user's message
      var processingId = showProcessing(); // Show the "Processing..." indicator

      try {
          var response = await exeApi(msg); // Call the API with language info
          removeProcessing(processingId); // Remove the "Processing..." indicator
          response_message(response); // Show the chatbot's response
      } catch (error) {
          removeProcessing(processingId); // Remove the "Processing..." indicator
          response_message("Sorry, something went wrong. Please try again."); // Show error message
      }
  } else {
      request_message("Kindly connect to the web server");
  }
}




$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $( "#connect" ).click(function() { connect(); });
    $( "#disconnect" ).click(function() { disconnect(); });
    $( "#chat-submit" ).click(function() { sendMessage(); });
});



//Chat Bot design manage Code
$(".chat-box").hide();   
var INDEX = 0;
function request_message(msg) {
    INDEX++;
    var str="";
    str += "<div id='cm-msg-"+INDEX+"' class=\"chat-msg self\">";
    str += "          <span class=\"msg-avatar\">";
    str += "            <img src=\"/static/chatbot/face.svg\">";
    str += "          </span>";
    str += "          <div class=\"cm-msg-text\">";
    str += msg;
    str += "          </div>";
    str += "        </div>";
    $(".chat-logs").append(str);
    $("#cm-msg-"+INDEX).hide().fadeIn(300);
    $("#chat-input").val('');
    $(".chat-logs").stop().animate({ scrollTop: $(".chat-logs")[0].scrollHeight}, 1000);  
} 

function showProcessing() {
  INDEX++;
  var str = "";
  str += "<div id='cm-msg-" + INDEX + "' class=\"chat-msg user processing\">";
  str += "          <span class=\"msg-avatar\">";
  str += "            <img src=\"/static/chatbot/robot.svg\"/>";
  str += "          </span>";
  str += "          <div class=\"cm-msg-text\">";
  str += "            <i>Processing...</i>";
  str += "          </div>";
  str += "        </div>";
  $(".chat-logs").append(str);
  $("#cm-msg-" + INDEX).hide().fadeIn(300);
  $(".chat-logs").stop().animate({ scrollTop: $(".chat-logs")[0].scrollHeight }, 1000);
  return "cm-msg-" + INDEX; // Return the ID of the processing message
}

function removeProcessing(processingId) {
  $("#" + processingId).remove(); // Remove the processing indicator
}

function response_message(msg) {
  var processingId = showProcessing(); // Show processing indicator

  setTimeout(() => { // Simulate a delay to show the processing UI
      removeProcessing(processingId); // Remove processing indicator

      if (msg == "") msg = "Hi! Sorry I beg your pardon.";
      INDEX++;
      var str = "";
      str += "<div id='cm-msg-" + INDEX + "' class=\"chat-msg user\">";
      str += "          <span class=\"msg-avatar\">";
      str += "            <img src=\"/static/chatbot/robot.svg\"/>";
      str += "          </span>";
      str += "          <div id='ct_" + INDEX + "' class=\"cm-msg-text\">";
      str += formatMessageForHtml(msg);;
      str += "          <span id='sp_" + INDEX + "' style='cursor:pointer;font-size:18px;' class=\"fa fa-volume-up\" onclick=\"speaktext('" + msg + "')\"></span></div>";
      str += "        </div>";
      $(".chat-logs").append(str);
      $("#cm-msg-" + INDEX).hide().fadeIn(300);
      $(".chat-logs").stop().animate({ scrollTop: $(".chat-logs")[0].scrollHeight }, 1000);
      // Optionally read the response out loud
      // readOutLoud(msg);
  }, 1000); // Adjust this timeout as needed to mimic real processing delay
}



function formatMessageForHtml(msg) {
  return msg.replace(/(\d+)\.\s/g, '  <b>$1.</b> ').replace(/\n/g, '<br/>');
}

function speaktext(msg){ 
  console.log(msg);
	readOutLoud(msg);
}

function generate_button_message(msg, buttons){    
	
    INDEX++;
    var btn_obj = buttons.map(function(button) {
       return  "<li class=\"button\"><a href=\"javascript:;\" class=\"btn btn-primary chat-btn\" chat-value=\""+button.value+"\">"+button.name+"</a></li><br/><br/>";
    }).join('');
    var str="";
    str += "<div id='cm-msg-"+INDEX+"' class=\"chat-msg user\">";
    str += "          <span class=\"msg-avatar\">";
    str += "            <img src=\"/static/chatbot/robot.svg\"/>";
    str += "          </span>";
    str += "          <div class=\"cm-msg-text\">";
    str += msg;
    str += "          </div>";
    str += "          <div class=\"cm-msg-button\">";
    str += "            <ul>";   
    str += btn_obj;
    str += "            </ul>";
    str += "          </div>";
    str += "        </div>";
    $(".chat-logs").append(str);
    $("#cm-msg-"+INDEX).hide().fadeIn(300);   
    $(".chat-logs").stop().animate({ scrollTop: $(".chat-logs")[0].scrollHeight}, 1000);
    $("#chat-input").attr("disabled", false);
    //readOutLoud(msg);
  }
  
  