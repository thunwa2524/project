const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let faceMesh;

// init model
function initModel() {
  faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 2,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMesh.onResults(onResults);
}

initModel();

function onResults(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.multiFaceLandmarks) {
    results.multiFaceLandmarks.forEach(landmarks => {
      
      landmarks.forEach(point => {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = "lime";
        ctx.fill();
      });

    });
  }
}

function scanImage() {
  const fileInput = document.getElementById("upload");
  const file = fileInput.files[0];

  if (!file) return alert("เลือกภาพก่อน");

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    faceMesh.send({ image: img });
  };
}

function startCamera() {
  const camera = new Camera(video, {
    onFrame: async () => {
      await faceMesh.send({ image: video });
    },
    width: 400,
    height: 300
  });

  camera.start();
}