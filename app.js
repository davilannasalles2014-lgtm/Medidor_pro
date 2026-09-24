const camera = document.getElementById("camera");
const capture = document.getElementById("capture");
const startCamera = document.getElementById("startCamera");
const canvas = document.getElementById("canvas");

const referenceCm = document.getElementById("referenceCm");
const referencePx = document.getElementById("referencePx");
const calibrate = document.getElementById("calibrate");
const calibrationStatus = document.getElementById("calibrationStatus");

const objectPx = document.getElementById("objectPx");
const measure = document.getElementById("measure");
const resultValue = document.getElementById("resultValue");
const resultInfo = document.getElementById("resultInfo");
const subscribe = document.getElementById("subscribe");

let pixelsPerCm = null;
let stream = null;

startCamera.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    camera.srcObject = stream;
    capture.disabled = false;
    startCamera.textContent = "Câmera aberta";
  } catch (error) {
    alert("Não foi possível abrir a câmera. Verifique a permissão do navegador.");
  }
});

capture.addEventListener("click", () => {
  if (!camera.videoWidth) {
    alert("A câmera ainda não está pronta.");
    return;
  }

  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(camera, 0, 0, canvas.width, canvas.height);

  resultInfo.textContent =
    `Imagem capturada: ${canvas.width} × ${canvas.height} pixels. Informe os pixels da referência e do objeto para calcular.`;
});

calibrate.addEventListener("click", () => {
  const cm = Number(referenceCm.value);
  const px = Number(referencePx.value);

  if (!Number.isFinite(cm) || cm <= 0 || !Number.isFinite(px) || px <= 0) {
    calibrationStatus.textContent = "Informe valores válidos para centímetros e pixels.";
    return;
  }

  pixelsPerCm = px / cm;
  calibrationStatus.textContent =
    `Calibrado: ${pixelsPerCm.toFixed(2)} pixels por cm.`;
});

measure.addEventListener("click", () => {
  const px = Number(objectPx.value);

  if (!pixelsPerCm) {
    resultValue.textContent = "—";
    resultInfo.textContent = "Faça a calibração primeiro.";
    return;
  }

  if (!Number.isFinite(px) || px <= 0) {
    resultValue.textContent = "—";
    resultInfo.textContent = "Informe um valor válido em pixels.";
    return;
  }

  const cm = px / pixelsPerCm;
  resultValue.textContent = cm.toFixed(2);
  resultInfo.textContent =
    `Cálculo baseado em ${px} pixels e na calibração atual.`;
});

subscribe.addEventListener("click", () => {
  alert("A assinatura de R$ 2/mês ainda precisa ser conectada a um serviço de pagamento.");
});

window.addEventListener("beforeunload", () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
});
