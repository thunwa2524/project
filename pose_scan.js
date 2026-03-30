let pose;
let camera;

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


        const bodyConnections = POSE_CONNECTIONS.filter(conn => {
            return conn[0] >= 11 && conn[1] >= 11;
        });

        const bodyLandmarks = results.poseLandmarks
            .map((lm, index) => (index >= 11 ? lm : null))
            .filter(lm => lm !== null);


        drawConnectors(
            ctx,
            results.poseLandmarks,
            bodyConnections,
            { color: "green", lineWidth: 2 }
        );


        drawLandmarks(
            ctx,
            bodyLandmarks,
            { color: "lime", lineWidth: 1 }
        );

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
