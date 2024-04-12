const scanner = document.getElementById("scanner");
scanner.style.backgroundImage = "url(./images/camera-notfound.jpg)";
scanner.style.backgroundSize = "cover";

const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");
const btnSwitch = document.getElementById("btnSwitch");
const scanMessage = document.getElementById("scanMessage");

const imgLoading = document.getElementById("imgLoading");
const imgSuccess = document.getElementById("imgSuccess");
const imgError = document.getElementById("imgError");
const imgWarning = document.getElementById("imgWarning");
const imgWaiting = document.getElementById("imgWaiting");

const blueColor = "rgba(0, 130, 255, 0.5)";
const greenColor = "rgba(0, 255, 0, 0.3)";
const redColor = "rgba(255, 0, 0, 0.3)";
const orangeColor = "rgba(255, 130, 0, 0.5)";
const yellowColor = "rgba(255, 255, 0, 0.5)";

const audio = new Audio();
const msgTimeout = 3 * 1000; // 3 seconds

const screenHeight =
  window.innerHeight ||
  document.documentElement.clientHeight ||
  document.body.clientHeight ||
  screen.height;
const screenWidth =
  window.innerWidth ||
  document.documentElement.clientWidth ||
  document.body.clientWidth ||
  screen.height;

const html5QrCode = new Html5Qrcode("scanner");
const cameraConfig = { facingMode: "environment" };
// const scannerConfig = { fps: 10 };
const scannerConfig = {
  disableFlip: false, // default = false, the scanner can scan for horizontally flipped QR Codes. This also enables scanning QR code using the front camera on mobile devices which are sometimes mirrored. Recommend changing this only if: you are sure that the camera feed cannot be mirrored (Horizontally flipped) or you are facing performance issues with this enabled.
  fps: 10, // default = 2, A.K.A frame per second, it can be increased to get faster scanning. Increasing too high value could affect performance. Value >1000 will simply fail.
  qrbox: screenWidth * 0.25,
};

function startScan() {
  if (!html5QrCode || html5QrCode.getState() === 2) {
    let warningMsg = "The camera (scanner) has already been started.";
    console.warn(warningMsg);
    alert(warningMsg);
    return;
  }
  console.log("Starting scanner...");
  setStatusIsLoading();

  setTimeout(() => {
    if (audio != null) {
      audio.src = "../images/scanner-started-sound.mp3";
      audio.play();
    }
  }, 1000);

  html5QrCode
    .start(cameraConfig, scannerConfig, onScanSuccess, onScanFailure)
    .then(() => {
      console.log("Scanner started.");
      scanner.style.backgroundImage = "url(./images/camera-off.jpg)";
      scanner.style.height = "auto";
      btnStop.disabled = false;
      btnSwitch.disabled = false;
    })
    .catch((err) => {
      btnStart.disabled = false;
      handleScannerError(err);
    })
    .finally(() => {
      setTimeout(() => {
        imgLoading.style.display = "none";
      }, 750);
    });
}

function stopScan() {
  if (!html5QrCode || html5QrCode.getState() === 1) {
    let warningMsg = "The camera (scanner) has not started yet.";
    console.warn(warningMsg);
    alert(warningMsg);
    return;
  }
  console.log("Stoping scanner...");
  setStatusIsLoading();

  setTimeout(() => {
    if (audio.readyState >= 2) {
      audio.src = "../images/scanner-stopped-sound.mp3";
      audio.play();
    }
  }, 100);

  html5QrCode
    .stop()
    .then((ignore) => {
      console.log("Scanner stopped.");
      scanner.style.height = screenHeight * 0.45 + "px";
      btnStart.disabled = false;
    })
    .catch((err) => {
      btnStop.disabled = false;
      handleScannerError(err);
    })
    .finally(() => {
      setTimeout(() => {
        imgLoading.style.display = "none";
      }, 450);
    });
}

function switchCamera() {
  if (!html5QrCode || html5QrCode.getState() === 1) {
    let warningMsg =
      "The camera (scanner) has not started yet.\nPlease, try to click on the start button first.";
    console.warn(warningMsg);
    alert(warningMsg);
    return;
  }
  console.log("Switching camera...");
  btnSwitch.disabled = true;
  stopScan();
  console.log("cameraConfig", cameraConfig);
  setTimeout(() => {
    cameraConfig.facingMode = "user";
    console.log("cameraConfig", cameraConfig);
    startScan();
  }, 1000);
}

function onScanSuccess(decodedText, decodedResult) {
  if (!decodedText) return;
  if (audio.readyState >= 2) {
    audio.src = "../images/scanner-bip-sound.mp3";
    audio.play();
  }

  console.log(`decodedResult:`, decodedResult);

  const codeFormatName = decodedResult.result.format.formatName;
  if (codeFormatName === "QR_CODE") {
    if (audio.readyState >= 2) {
      audio.src = "../images/scanner-success-sound.mp3";
      audio.play();
    }
    imgSuccess.style.display = "block";
    scanMessage.innerHTML = `Scanned code: ${decodedText}`;
    html5QrCode.pause(true);
    setTimeout(() => {
      html5QrCode.resume();
      imgSuccess.style.display = "none";
    }, 3000);
  } else {
    if (audio.readyState >= 2) {
      audio.src = "../images/scanner-warning-sound.mp3";
      audio.play();
    }
    imgWarning.style.display = "block";
    scanMessage.innerHTML = `Code format not allowed.`;
    html5QrCode.pause(true);
    setTimeout(() => {
      html5QrCode.resume();
      imgWarning.style.display = "none";
    }, 3000);
  }
}

function onScanFailure(scanError) {
  // handle scan failure, usually better to ignore and keep scanning.
  //console.warn(`Code scan error = ${scanError}`);
}

function handleScannerError(err) {
  console.error(err);
  alert(err.name || err.message || err);
  imgError.style.display = "block";
  scanner.style.backgroundColor = redColor;
}

function setStatusIsLoading() {
  imgLoading.style.display = "block";
  btnStart.disabled = true;
  btnStop.disabled = true;
  btnSwitch.disabled = true;
}

startScan();
