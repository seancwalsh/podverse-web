'use strict'



// Dan Carlin Hardcore History - RSS Feed - http://feeds.feedburner.com/dancarlin/history?format=xml

var dchhEpisode = 'http://traffic.libsyn.com/dancarlinhh/dchha56_Kings_of_Kings.mp3';
var freshAirEpisode = 'http://play.podtrac.com/npr-381444908/npr.mc.tritondigital.com/NPR_381444908/media/anon.npr-podcasts/podcast/381444908/461727430/npr_461727430.mp3?orgId=1&d=2943&p=381444908&story=461727430&t=podcast&e=461727430&ft=pod&f=381444908';
var waitwaitEpisode = 'http://play.podtrac.com/npr-344098539/npr.mc.tritondigital.com/WAITWAIT_PODCAST/media/anon.npr-podcasts/podcast/344098539/459504287/npr_459504287.mp3?orgId=1&d=2995&p=344098539&story=459504287&t=podcast&e=459504287&ft=pod&f=344098539';
var jreEpisode = 'http://traffic.libsyn.com/joeroganexp/p564.mp3';
var dtfhEpisode = 'http://traffic.libsyn.com/lavenderhour/DTFH_178_zach_leary.mp3';

var restartAttempts = 0;
var lastPlaybackPosition = -1;

var startTime = "500";
var endTime = "510";

var createAndAppendAudio = function() {
  var audio = document.createElement('audio');
  audio.setAttribute('src', dtfhEpisode);
  audio.setAttribute('type', 'audio/mpeg');
  audio.setAttribute('codecs', 'mp3');
  audio.preload = "metadata";
  // var source = document.createElement('source');
  // source.setAttribute('src', dtfhEpisode);
  // audio.appendChild(source);
  $('#player').append(audio);
  $('audio').mediaelementplayer();

  audio.onloadedmetadata = function() {
    // If the lastPlaybackPosition is greater than -1, then the audio player must
    // have crashed and then restarted, and we should resume from the last saved
    // playback position. Else begin from the clip start time.
    if (lastPlaybackPosition > -1) {
      audio.currentTime = lastPlaybackPosition;
    } else {
      audio.currentTime = startTime;
    }
  }

  audio.onseeking = function() {
    console.log('is seeking');
    audio.pause();
    audio.play();
  }

  audio.ontimeupdate = function() {
    lastPlaybackPosition = audio.currentTime;
  }

  audio.onerror = function(e) {
    switch (e.target.error.code) {
      case e.target.error.MEDIA_ERR_ABORTED:
        console.log('Aborted the video playback.');
        break;
      // Chrome will frequently throw a MEDIA_ERR_NETWORK error and crash when seeking
      // to a position in a clip. I have encountered the issue with native HTML 5 Chrome
      // components, as well as with 3rd party libraries like JWPlayer and MediaElement.
      // The only work around for this bug I have found is to listen for the error,
      // then remove the <audio> element and recreate and append the audio element.
      case e.target.error.MEDIA_ERR_NETWORK:
        console.log('A network error caused the audio download to fail.');
        if (restartAttempts < 5) {
          restartAttempts++;
          $('#player').empty();
          createAndAppendAudio();
        }
        break;
      case e.target.error.MEDIA_ERR_DECODE:
        console.log('The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.');
        break;
      case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
        console.log('The video audio not be loaded, either because the server or network failed or because the format is not supported.');
        break;
      default:
        console.log('An unknown error occurred.');
        break;
    }
  }
}

$(document).ready(function() {
  createAndAppendAudio();
});
