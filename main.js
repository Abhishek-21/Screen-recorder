const videoElem = document.getElementById("video");
const logElem = document.getElementById("log");
const startElem = document.getElementById("start");
const stopElem = document.getElementById("stop");
const recordingStatus = document.getElementById("recording-status");
let recordedBlobs = [];

const displayMediaOptions = {
  video: {
    displaySurface: "window",
  },
  audio: true,
};

// Set event listeners for the start and stop buttons
startElem.addEventListener(
  "click",
  (evt) => {
    startCapture();
  },
  false,
);

stopElem.addEventListener(
  "click",
  (evt) => {
    stopCapture();
  },
  false,
);

console.log = (msg) => (logElem.textContent = `${logElem.textContent}\n${msg}`);
console.error = (msg) =>
  (logElem.textContent = `${logElem.textContent}\nError: ${msg}`);

async function startCapture() {
  logElem.innerHTML = "";

  try {
    videoElem.srcObject =
      await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    videoData = videoElem.srcObject;
    startRecording();
    dumpOptionsInfo();
  } catch (err) {
    console.error(err);
  }
}

function stopCapture(evt) {
  let tracks = videoElem.srcObject.getTracks();

  tracks.forEach((track) => track.stop());
  videoElem.srcObject = null;
  stopRecording();
  download();
}

function dumpOptionsInfo() {
  const videoTrack = videoElem.srcObject.getVideoTracks()[0];

  console.log("Track settings:");
  console.log(JSON.stringify(videoTrack.getSettings(), null, 2));
  console.log("Track constraints:");
  console.log(JSON.stringify(videoTrack.getConstraints(), null, 2));
}

function startRecording() {
  let options = { mimeType: 'video/webm' };
  try {
    mediaRecorder = new MediaRecorder(videoData, options);
  } catch (e0) {
    console.log('Unable to create MediaRecorder with options Object: ', e0);
    try {
      options = { mimeType: 'video/webm,codecs=vp9' };
      mediaRecorder = new MediaRecorder(videoData, options);
    } catch (e1) {
      console.log('Unable to create MediaRecorder with options Object: ', e1);
      try {
        options = 'video/vp8'; // Chrome 47
        mediaRecorder = new MediaRecorder(videoData, options);
      } catch (e2) {
        alert('MediaRecorder is not supported by this browser.\n\n' +
          'Try Firefox 29 or later, or Chrome 47 or later, ' +
          'with Enable experimental Web Platform features enabled from chrome://flags.');
        console.error('Exception while creating MediaRecorder:', e2);
        return;
      }
    }
  }
  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);

  recordingStatus.style.display = "block";
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(100); // collect 100ms of data
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  recordingStatus.style.display = "none";
  console.log('Recorded Blobs: ', recordedBlobs);
  video.controls = true;
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  console.log('Recorder stopped: ', event);
  superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
  // video.src = window.URL.createObjectURL(superBuffer);
}

function download() {
  const blob = new Blob(recordedBlobs, { type: 'video/webm' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'test.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}