let pose;
let camera;
let selectedArm = "left";

function calculateElbowAngle(shoulder, elbow, wrist) {

    const upperArm = {
        x: shoulder.x - elbow.x,
        y: shoulder.y - elbow.y
    };

    const forearm = {
        x: wrist.x - elbow.x,
        y: wrist.y - elbow.y
    };

    const dot = upperArm.x * forearm.x + upperArm.y * forearm.y;

    const mag1 = Math.sqrt(upperArm.x ** 2 + upperArm.y ** 2);
    const mag2 = Math.sqrt(forearm.x ** 2 + forearm.y ** 2);

    const cosAngle = dot / (mag1 * mag2);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

    return angle * 180 / Math.PI;
}
function calculateRaiseAngle(shoulder, elbow) {

    const vertical = { x: 0, y: 1 };

    const arm = {
        x: elbow.x - shoulder.x,
        y: elbow.y - shoulder.y
    };

    const dot = arm.x * vertical.x + arm.y * vertical.y;

    const mag1 = Math.sqrt(arm.x * arm.x + arm.y * arm.y);
    const mag2 = 1;

    const angle = Math.acos(dot / (mag1 * mag2));

    return angle * 180 / Math.PI;
}

function selectArm(side) {
    selectedArm = side;
}
function drawReferenceSkeleton(ctx, side, canvas) {

    let x = side === "left" ? 80 : canvas.width - 80;
    //let y = 80;
    let bottom = canvas.height - 10;
    ctx.shadowColor = "rgba(245, 255, 255, 0.7)";
    ctx.shadowBlur = 5;
    ctx.strokeStyle = "rgba(245, 254, 253, 0.47)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    // หัว
    ctx.beginPath();
    ctx.arc(x, bottom - 80, 25, 0, Math.PI * 2);
    ctx.stroke();

    // ไหล่โค้ง
    ctx.beginPath();
    ctx.moveTo(x - 60, bottom);

    ctx.quadraticCurveTo(
        x,
        bottom - 40,
        x + 60,
        bottom
    );

    ctx.stroke();
}
function initPose() {

    const video = document.getElementById("input_video");
    const canvas = document.getElementById("output_canvas");
    const ctx = canvas.getContext("2d");

    pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
    });

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    pose.onResults((results) => {

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (!results.poseLandmarks) return;

        const ls = results.poseLandmarks[11];
        const le = results.poseLandmarks[13];
        const lw = results.poseLandmarks[15];
        const rs = results.poseLandmarks[12];
        const re = results.poseLandmarks[14];
        const rw = results.poseLandmarks[16];
        const leftElbowAngle = calculateElbowAngle(ls, le, lw);
        const rightElbowAngle = calculateElbowAngle(rs, re, rw);

        let ElbowAngle;
        if (selectedArm === "left") {
            ElbowAngle = leftElbowAngle;
        }
        else {
            ElbowAngle = rightElbowAngle;
        }

        let armStatus = "";
        if (ElbowAngle > 170) {
            armStatus = "Arm Straight";
        }
        else {
            armStatus = "Arm Bent";
        }

        const leftArmAngle = calculateRaiseAngle(ls, le);
        const rightArmAngle = calculateRaiseAngle(rs, re);
        let angle;

        if (selectedArm === "left") {
            angle = leftArmAngle;
        }
        else {
            angle = rightArmAngle;
        }

        let riskText = "";
        let color = "lime";

        if (angle < 60) {
            riskText = "High Risk";
            color = "red";
        }
        else if (angle < 85) {
            riskText = "Moderate Risk";
            color = "orange";
        }
        else if (angle <= 120) {
            riskText = "Safe";
            color = "lime";
        }
        ctx.fillStyle = color;
        ctx.font = "24px Arial";

        ctx.fillText(
            angle.toFixed(1) + "°  " + riskText,
            30,
            40
        );

        ctx.fillText(
            "Elbow: " + ElbowAngle.toFixed(1) + "°  " + armStatus,
            30,
            70
        );
        let shoulder = selectedArm === "left" ? ls : rs;
        let elbow = selectedArm === "left" ? le : re;
        // แขน
        ctx.beginPath();
        ctx.moveTo(shoulder.x * canvas.width, shoulder.y * canvas.height);
        ctx.lineTo(elbow.x * canvas.width, elbow.y * canvas.height);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.stroke();

        // เส้นฉาก
        ctx.beginPath();
        ctx.moveTo(shoulder.x * canvas.width, shoulder.y * canvas.height);
        ctx.lineTo(shoulder.x * canvas.width, (shoulder.y + 0.2) * canvas.height);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();


        const bodyConnections = POSE_CONNECTIONS.filter(conn => {
            return conn[0] >= 11 && conn[1] >= 11;
        });

        const bodyLandmarks = results.poseLandmarks
            .map((lm, index) => (index >= 11 ? lm : null))
            .filter(lm => lm !== null);

        const imbalance = Math.abs(leftArmAngle - rightArmAngle);
        console.log("Arm imbalance:", imbalance);

        drawConnectors(ctx, results.poseLandmarks, bodyConnections, {
            color: "green",
            lineWidth: 2
        });

        drawLandmarks(ctx, bodyLandmarks, {
            color: "lime",
            lineWidth: 1
        });

        drawReferenceSkeleton(ctx, selectedArm, canvas);

    });

    camera = new Camera(video, {
        onFrame: async () => {
            await pose.send({ image: video });
        },
        width: 400,
        height: 300
    });

}

window.onload = initPose;


function startposeCamera() {
    camera.start();
}

function scanposeImage() {

    const fileInput = document.getElementById("upload_posture");
    const file = fileInput.files[0];

    if (!file) return alert("เลือกภาพก่อน");

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        pose.send({ image: img });
    };
}
