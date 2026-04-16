const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let currentLandmarks = null;
let faceMesh;
let lineOn = true

// init model
function initModel() {
  faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  faceMesh.onResults(onResults);
}

initModel();

function onResults(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
  const use_point = [
    263, 33,
    133, 362,
    356, 127,
    10, 152
  ]


  if (results.multiFaceLandmarks) {

    results.multiFaceLandmarks.forEach(landmarks => {
      currentLandmarks = landmarks;
      //ตาซ้าย
      const leftEyePoints = [33, 160, 158, 133, 153, 144];

      //ตาขวา
      const rightEyePoints = [263, 387, 385, 362, 380, 373];

      //ขอบหน้า
      const faceOutline = [
        10, 338, 297, 332, 284, 251, 389, 356,
        454, 323, 361, 288, 397, 365, 379, 378,
        400, 377, 152, 148, 176, 149, 150, 136,
        172, 58, 132, 93, 234, 127, 162, 21,
        54, 103, 67, 109
      ];

      //รวมจุด
      const selectedPoints = [...leftEyePoints, ...rightEyePoints, ...faceOutline];

      //วาดจุดเฉพาะที่เลือก
      selectedPoints.forEach(index => {
        const point = landmarks[index];

        const x = point.x * canvas.width;
        const y = point.y * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);


        ////////////////////////////////////////
        //tilt detection
        const leftEye = landmarks[159];
        const rightEye = landmarks[386];

        const dx = rightEye.x - leftEye.x;
        const dy = rightEye.y - leftEye.y;

        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        ctx.fillStyle = "Red";
        ctx.font = "16px Arial";
        ctx.fillText(`Tilt: ${angle.toFixed(2)}`, 10, 20);
        // yaw
        const nose = landmarks[1];
        const left = landmarks[234];
        const right = landmarks[454];

        const distLeft = Math.abs(nose.x - left.x);
        const distRight = Math.abs(right.x - nose.x);

        ctx.fillStyle = "Green";
        ctx.font = "16px Arial";

        if (distLeft > distRight) {
          if (distLeft - distRight > 0.1) {
            ctx.fillText(`right`, 10, 40);
          } else {
            ctx.fillText(`straight`, 10, 40);
          }

        } else {
          if (distRight - distLeft > 0.1) {
            ctx.fillText(`left`, 10, 40);
          } else {
            ctx.fillText(`straight`, 10, 40);
          }
        }

        // ctx.fillText(`yaw: ${distLeft.toFixed(1)}`, 10, 40);
        // pitt
        const top = landmarks[10];
        const bottom = landmarks[152];

        const ratio = (nose.y - top.y) / (bottom.y - top.y);

        ctx.fillStyle = "Blue";
        ctx.font = "16px Arial";
        ctx.fillText(`${ratio.toFixed(2)}`, 10, 60);
        // console.log("pitch:", ratio);
        ////////////////////////////////////////


        if (leftEyePoints.includes(index) || rightEyePoints.includes(index)) {
          ctx.fillStyle = "cyan"; // ตา
        } else {
          ctx.fillStyle = "lime"; // ขอบหน้า
        }

        for (let i = 0; i < use_point.length; i++) {
          if (index == use_point[i]) {
            ctx.fillStyle = "yellow";
          }
        }

        // if (index == 33 || index == 263 || index == 133 || index == 362 || index == 356 || index == 127) {
        //   ctx.fillStyle = "yellow";
        // }

        ctx.fill();
      });

      //วาดเส้นกากบาท

      if (lineOn) {
        //กลางดวงตา
        const leftEyeCenter = landmarks[356];
        const rightEyeCenter = landmarks[127];

        //แนวตั้ง
        const top = landmarks[10];     // หน้าผาก
        const bottom = landmarks[152]; // คาง

        function drawLine(p1, p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
          ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        //เส้นแนวนอน
        drawLine(leftEyeCenter, rightEyeCenter);

        //เส้นแนวตั้ง
        drawLine(top, bottom);
      };
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

function Line() {
  if (!currentLandmarks) return;
  if (lineOn) {
    lineOn = false
  } else {
    lineOn = true
  }
}

function Check() {
  if (!currentLandmarks) return;

  const left_p = currentLandmarks[33];
  const right_p = currentLandmarks[263];

  const reference_left_p = currentLandmarks[127];
  const reference_right_p = currentLandmarks[356];

  // const left_x = left_p.x * canvas.width;
  const left_y = left_p.y * canvas.height;

  // const right_x = right_p.x * canvas.width;
  const right_y = right_p.y * canvas.height;

  const reference_left_y = reference_left_p.y * canvas.height;
  const reference_right_y = reference_right_p.y * canvas.height;

  console.log(`left y=${left_y}`);
  console.log(`right y=${right_y}`);

  console.log(`reference_left y=${reference_left_y}`);
  console.log(`reference_right y=${reference_right_y}`);

  console.log(`reference_left-left =${reference_left_y - left_y}`);
  console.log(`reference_right-right =${reference_right_y - right_y}`);

  tilt_detection()
  yaw_detection()
  pitch_detection()
  // console.log(`Left: x=${left_x}, y=${left_y}`);
  // console.log(`Right: x=${right_x}, y=${right_y}`);
}


//////////////////////////////////////////

function tilt_detection() {
  if (!currentLandmarks) return;

  const leftEye = currentLandmarks[159];
  const rightEye = currentLandmarks[386];

  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;

  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  console.log("tilt:", angle.toFixed(2));
}

function yaw_detection() {
  if (!currentLandmarks) return;

  const nose = currentLandmarks[1];
  const left = currentLandmarks[234];
  const right = currentLandmarks[454];

  const distLeft = Math.abs(nose.x - left.x);
  const distRight = Math.abs(right.x - nose.x);

  console.log(distLeft)
  console.log(distRight)
  if (distLeft > distRight) {
    console.log("หันขวา");
  } else {
    console.log("หันซ้าย");
  }
}

function pitch_detection() {
  if (!currentLandmarks) return;

  const nose = currentLandmarks[1];
  const top = currentLandmarks[10];
  const bottom = currentLandmarks[152];

  const ratio = (nose.y - top.y) / (bottom.y - top.y);

  console.log("pitch:", ratio.toFixed(2));
}

//////////////////////////////////////////
