 // Medidor Pro 3.0 — app.js
// Versão compatível com o index.html atual

const $ = (id) => document.getElementById(id);

// CÂMERA
const video = $("video");
const overlay = $("overlay");
const start = $("start");
const stop = $("stop");
const status = $("status");

let stream = null;

// CALIBRAÇÃO
const refMm = $("refMm");
const refPx = $("refPx");
const calibrate = $("calibrate");
const cal = $("cal");

let pixelsPerMm = 0;

// MEDIÇÃO
const objPx = $("objPx");
const unit = $("unit");
const measure = $("measure");
const result = $("result");
const resultInfo = $("resultInfo");
const save = $("save");
const modeLabel = $("modeLabel");

let currentMode = "Largura";
let lastMeasurementMm = 0;

// HISTÓRICO
const historyBox = $("history");
const clear = $("clear");

// =========================
// CÂMERA
// =========================

async function openCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (resultInfo) {
      resultInfo.textContent =
        "A câmera não está disponível neste navegador.";
    }
    return;
  }

  if (!window.isSecureContext) {
    if (resultInfo) {
      resultInfo.textContent =
        "A câmera precisa de HTTPS. No GitHub Pages ela funciona.";
    }
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });

    video.srcObject = stream;
    video.playsInline = true;

    await video.play().catch(() => {});

    start.disabled = true;
    stop.disabled = false;

    status.textContent = "Ativa";

    if (resultInfo) {
      resultInfo.textContent =
        "Câmera ativa. Posicione o objeto e calibre a referência.";
    }

    drawOverlay();

  } catch (error) {
    status.textContent = "Bloqueada";

    if (resultInfo) {
      resultInfo.textContent =
        "Não foi possível abrir a câmera. Permita o acesso à câmera.";
    }
  }
}

function closeCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  video.srcObject = null;

  start.disabled = false;
  stop.disabled = true;

  status.textContent = "Desligada";
}

start?.addEventListener("click", openCamera);
stop?.addEventListener("click", closeCamera);

// =========================
// LINHA DE AUXÍLIO DA CÂMERA
// =========================

function drawOverlay() {
  if (!video.videoWidth || !video.videoHeight) {
    requestAnimationFrame(drawOverlay);
    return;
  }

  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;

  const ctx = overlay.getContext("2d");

  ctx.clearRect(0, 0, overlay.width, overlay.height);

  ctx.strokeStyle = "#00e5ff";
  ctx.lineWidth = Math.max(3, overlay.width / 600);
  ctx.setLineDash([12, 10]);

  ctx.beginPath();

  ctx.moveTo(
    overlay.width * 0.15,
    overlay.height * 0.5
  );

  ctx.lineTo(
    overlay.width * 0.85,
    overlay.height * 0.5
  );

  ctx.stroke();

  ctx.setLineDash([]);

  requestAnimationFrame(drawOverlay);
}

// =========================
// CALIBRAÇÃO
// =========================

calibrate?.addEventListener("click", () => {

  const mm = Number(refMm?.value);
  const px = Number(refPx?.value);

  if (!Number.isFinite(mm) || mm <= 0) {
    cal.textContent =
      "Informe o tamanho real da referência em mm.";
    return;
  }

  if (!Number.isFinite(px) || px <= 0) {
    cal.textContent =
      "Informe quantos pixels correspondem à referência.";
    return;
  }

  pixelsPerMm = px / mm;

  localStorage.setItem(
    "medidorPixelsPerMm",
    String(pixelsPerMm)
  );

  cal.textContent =
    `Calibrado: ${pixelsPerMm.toFixed(3)} pixels/mm`;

  if (resultInfo) {
    resultInfo.textContent =
      "Calibração concluída. Agora informe a distância do objeto.";
  }
});

// Recuperar calibração salva
const savedCalibration =
  Number(localStorage.getItem("medidorPixelsPerMm"));

if (
  Number.isFinite(savedCalibration) &&
  savedCalibration > 0
) {
  pixelsPerMm = savedCalibration;

  if (cal) {
    cal.textContent =
      `Calibrado: ${pixelsPerMm.toFixed(3)} pixels/mm`;
  }
}

// =========================
// MODOS
// =========================

document.querySelectorAll(".mode").forEach((button) => {

  button.addEventListener("click", () => {

    document
      .querySelectorAll(".mode")
      .forEach((b) => b.classList.remove("active"));

    button.classList.add("active");

    currentMode =
      button.dataset.mode || "Largura";

    if (modeLabel) {
      modeLabel.textContent = currentMode;
    }
  });

});

// =========================
// UNIDADES
// =========================

const units = {

  mm: {
    factor: 1,
    label: "mm",
    decimals: 1
  },

  cm: {
    factor: 0.1,
    label: "cm",
    decimals: 2
  },

  m: {
    factor: 0.001,
    label: "m",
    decimals: 3
  },

  in: {
    factor: 1 / 25.4,
    label: "in",
    decimals: 2
  },

  ft: {
    factor: 1 / 304.8,
    label: "ft",
    decimals: 3
  }

};

function formatMeasurement(mm) {

  const selected =
    units[
