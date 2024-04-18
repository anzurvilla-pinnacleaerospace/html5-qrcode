const blueColor = `rgba(0, 130, 255, 0.5)`;
const greenColor = `rgba(0, 255, 0, 0.3)`;
const redColor = `rgba(255, 0, 0, 0.3)`;
const orangeColor = `rgba(255, 130, 0, 0.5)`;
const yellowColor = `rgba(255, 255, 0, 0.5)`;

const imgLoading = document.getElementById('imgLoading');
const imgSuccess = document.getElementById('imgSuccess');
const imgError = document.getElementById('imgError');
const imgWarning = document.getElementById('imgWarning');
const imgWaiting = document.getElementById('imgWaiting');

const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnSwitch = document.getElementById('btnSwitch');
const scanMessage = document.getElementById('scanMessage');

const scanner = document.getElementById('scanner');
scanner.style.backgroundColor = yellowColor;
scanner.style.backgroundImage = 'url(./images/camera-notfound.jpg)';
scanner.style.backgroundSize = 'cover';

const audio = new Audio();
const msgTimeout = 5 * 1000; // 5 second pause to display messages
const pauseTimeout = 3 * 1000; // 3 second camera pause when code is scanned

const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || screen.height;
const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || screen.height;

if (screenHeight > screenWidth) scanner.style.width = '80%';
if (screenWidth - screenHeight < 600) scanner.style.width = '70%';
else if (screenWidth - screenHeight < 800) scanner.style.width = '50%';
if (screenHeight < 600) scanner.style.width = '30%';

const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const html5QrCode = new Html5Qrcode('scanner'); // JS lib source: https://scanapp.org/
const cameraConfig = { facingMode: 'environment' };
const scannerConfig = {
  disableFlip: false, // default = false, the scanner can scan for horizontally flipped QR Codes. This also enables scanning QR code using the front camera on mobile devices which are sometimes mirrored. Recommend changing this only if: you are sure that the camera feed cannot be mirrored (Horizontally flipped) or you are facing performance issues with this enabled.
  fps: 10, // default = 2, A.K.A frame per second, it can be increased to get faster scanning. Increasing too high value could affect performance. Value >1000 will simply fail.
  qrbox: scanner.clientWidth > 0 ? scanner.clientWidth * 0.6 : screenWidth * 0.25,
};
const detectedCameras = [];
var selectedCameraNumber = 0;

// Detect and load currently connected camera devices to the computer.
// It's not recommended to load all cameras on mobile devices because it may not switch between the front and rear cameras as expected.
if (!isMobileDevice) {
  // This method will trigger user permissions
  Html5Qrcode.getCameras()
    .then((devices) => {
      if (devices && devices.length) {
        devices.forEach((device) => detectedCameras.push(device));
        console.info(`Cameras (${detectedCameras.length} detected):`, JSON.stringify(detectedCameras));
      } else {
        let warningMsg = 'No cameras found.';
        console.warn(warningMsg);
        alert(warningMsg);
      }
    })
    .catch((err) => {
      handleScannerError(err);
    });
}

function startScan() {
  if (!html5QrCode || html5QrCode.getState() === 2) {
    let warningMsg = 'The camera (scanner) has already been started.';
    console.warn(warningMsg);
    alert(warningMsg);
    return;
  }
  setStatusIsLoading();

  // Set camera for mobiles
  let cameraId = cameraConfig;

  // Set camera for computers
  if (!isMobileDevice && detectedCameras.length > 0) {
    cameraId = detectedCameras[selectedCameraNumber].id;
  }

  html5QrCode
    .start(cameraId, scannerConfig, onScanSuccess, onScanFailure)
    .then(() => {
      console.log('Scanner started.');
      playSound('start', 1000);
      scanner.style.backgroundImage = 'url(./images/camera-off.jpg)';
      scanner.style.height = 'auto';
      btnStop.disabled = false;
      // disable switch button when there is only one or no camera on computers
      if (!isMobileDevice && detectedCameras.length <= 1) btnSwitch.disabled = true;
      else btnSwitch.disabled = false;
    })
    .catch((err) => {
      btnStart.disabled = false;
      handleScannerError(err);
    })
    .finally(() => {
      setTimeout(() => {
        imgLoading.style.display = 'none';
      }, 750);
    });
}

function stopScan() {
  if (!html5QrCode || html5QrCode.getState() === 1) {
    let warningMsg = 'The camera (scanner) has not started yet.';
    console.warn(warningMsg);
    alert(warningMsg);
    return;
  }
  setStatusIsLoading();

  html5QrCode
    .stop()
    .then((ignore) => {
      console.log('Scanner stopped.');
      playSound('stop', 100);
      scanner.style.height = screenHeight * 0.55 + 'px';
      btnStart.disabled = false;
    })
    .catch((err) => {
      btnStop.disabled = false;
      handleScannerError(err);
    })
    .finally(() => {
      setTimeout(() => {
        imgLoading.style.display = 'none';
      }, 450);
    });
}

function switchCamera() {
  if (!html5QrCode || html5QrCode.getState() === 1) {
    let warningMsg = 'The camera (scanner) has not started yet.\nPlease, try to click on the start button first.';
    console.warn(warningMsg);
    alert(warningMsg);
    return;
  }

  console.log(`Switching from`, getCurrentCameraLabel(), `...`);
  btnSwitch.disabled = true;
  stopScan();
  setTimeout(() => {
    toggleCameraConfig();
    console.log(`Switched to`, getCurrentCameraLabel(), `.`);
    startScan();
  }, 1000);
}

function onScanSuccess(decodedText, decodedResult) {
  if (!decodedText) return;
  playSound('bip', 100);

  const codeFormatName = decodedResult.result.format.formatName;
  const scannedCode = decodedText || decodedResult.result.text;

  console.log('Scanned code:', scannedCode, '(format:', codeFormatName, ')');

  if (codeFormatName === 'QR_CODE') {
    playSound('success', 1000);
    imgSuccess.style.display = 'block';
    scanMessage.innerHTML = `Scanned code: ${scannedCode}`;
    pauseAndResumeScanner();
  } else {
    playSound('warning', 1000);
    imgWarning.style.display = 'block';
    scanMessage.innerHTML = `Code format not allowed.`;
    pauseAndResumeScanner();
  }
}

function onScanFailure(scanError) {
  // handle scan failure, usually better to ignore and keep scanning.
  //console.warn(`Code scan error = ${scanError}`);
}

function handleScannerError(err) {
  console.error('error', err);
  if (audio.readyState == 4) playSound('warning', 100);

  imgError.style.display = 'block';
  scanner.style.backgroundColor = redColor;
  scanMessage.innerHTML = 'Error: ' + err;

  let customErrorMsg;
  if (typeof err === 'string' && err.includes('NotAllowedError')) {
    customErrorMsg = `Please check the camera device connection, then reload and\ngrant the necessary camera permissions to the web browser.`;
  } else if (typeof err.name === 'string' && err.name.includes('AbortError')) {
    customErrorMsg = `Please check the camera device connection or, if it is already in use by another process, close it before entering this page.`;
  }

  if (customErrorMsg !== '') {
    btnStart.disabled = true;
    scanMessage.innerHTML += `<p>${customErrorMsg}</p>`;
    alert(customErrorMsg);
  } else alert(err.name || err.message || err);
}

function toggleCameraConfig() {
  // Change between front and rear cameras on mobiles devices
  if (isMobileDevice) {
    cameraConfig.facingMode = cameraConfig.facingMode == 'user' ? 'environment' : 'user';
    return;
  }
  // Change to the next detected camera on computers
  if (detectedCameras.length > selectedCameraNumber + 1) selectedCameraNumber++;
  else selectedCameraNumber = 0;
}

function pauseAndResumeScanner() {
  html5QrCode.pause(true);
  setTimeout(() => {
    html5QrCode.resume();
    imgSuccess.style.display = 'none';
  }, pauseTimeout || 2000);
}

function playSound(soundFilename, timeout) {
  if (!soundFilename) return;
  if (audio) {
    audio.src = '../sounds/' + soundFilename + '.mp3';
    setTimeout(() => {
      if (audio.readyState === 4) {
        audio.play();
      }
    }, timeout || 2000);
  } else console.warn(`Audio player web is not able to play sounds.`);
}

function setStatusIsLoading() {
  imgLoading.style.display = 'block';
  btnStart.disabled = true;
  btnStop.disabled = true;
  btnSwitch.disabled = true;
}

function getCurrentCameraLabel() {
  return isMobileDevice ? `"${cameraConfig.facingMode || 'N/A'}" camera mode` : `"${detectedCameras[selectedCameraNumber].label || 'N/A'}" camera`;
}

// Automatically start with code scanning
startScan();
