 // ==========================================================
// MEDIDOR PRO — app.js
// Versão corrigida e compatível com o index.html
// ==========================================================

document.addEventListener("DOMContentLoaded", function () {

  // ========================================================
  // FUNÇÃO PARA PEGAR ELEMENTOS
  // ========================================================

  function $(id) {
    return document.getElementById(id);
  }

  // ========================================================
  // CÂMERA
  // ========================================================

  const video = $("video");
  const overlay = $("overlay");
  const start = $("start");
  const stop = $("stop");
  const status = $("status");

  let stream = null;
  let animationFrame = null;

  // ========================================================
  // CALIBRAÇÃO
  // ========================================================

  const refMm = $("refMm");
  const refPx = $("refPx");
  const calibrate = $("calibrate");
  const cal = $("cal");

  let pixelsPerMm = 0;

  // ========================================================
  // MEDIÇÃO
  // ========================================================

  const objPx = $("objPx");
  const unit = $("unit");
  const precision = $("precision");
  const measure = $("measure");
  const result = $("result");
  const modeLabel = $("modeLabel");
  const save = $("save");

  let currentMode = "Largura";
  let lastMeasurementMm = null;
  let lastMeasurementText = "";

  // ========================================================
  // HISTÓRICO
  // ========================================================

  const historyBox = $("history");
  const clear = $("clear");

  // ========================================================
  // TEMA
  // ========================================================

  const themeToggle = $("themeToggle");
  const themePanel = $("themePanel");

  // ========================================================
  // PREMIUM
  // ========================================================

  const subscribe = $("subscribe");

  // ========================================================
  // CÂMERA — ABRIR
  // ========================================================

  async function openCamera() {

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

      if (status) {
        status.textContent = "Câmera indisponível";
      }

      alert(
        "Seu navegador não permite acesso à câmera."
      );

      return;
    }

    if (!window.isSecureContext) {

      if (status) {
        status.textContent = "HTTPS necessário";
      }

      alert(
        "A câmera precisa de HTTPS.\n\n" +
        "Abra o Medidor Pro pelo GitHub Pages."
      );

      return;
    }

    try {

      closeCamera();

      stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment"
            },
            width: {
              ideal: 1920
            },
            height: {
              ideal: 1080
            }
          },
          audio: false
        });

      video.srcObject = stream;

      video.muted = true;
      video.playsInline = true;

      await video.play();

      if (start) {
        start.disabled = true;
      }

      if (stop) {
        stop.disabled = false;
      }

      if (status) {
        status.textContent = "Ligada";
      }

      drawOverlay();

    } catch (error) {

      console.error(
        "Erro ao abrir câmera:",
        error
      );

      if (status) {
        status.textContent = "Permissão negada";
      }

      alert(
        "Não foi possível abrir a câmera.\n\n" +
        "Permita o acesso à câmera quando o celular pedir."
      );
    }
  }

  // ========================================================
  // CÂMERA — PARAR
  // ========================================================

  function closeCamera() {

    if (stream) {

      stream.getTracks().forEach(function (track) {
        track.stop();
      });

      stream = null;
    }

    if (video) {
      video.srcObject = null;
    }

    if (animationFrame) {

      cancelAnimationFrame(
        animationFrame
      );

      animationFrame = null;
    }

    if (start) {
      start.disabled = false;
    }

    if (stop) {
      stop.disabled = true;
    }

    if (status) {
      status.textContent = "Desligada";
    }

    if (overlay) {

      const ctx =
        overlay.getContext("2d");

      if (ctx) {

        ctx.clearRect(
          0,
          0,
          overlay.width,
          overlay.height
        );
      }
    }
  }

  if (start) {
    start.addEventListener(
      "click",
      openCamera
    );
  }

  if (stop) {
    stop.addEventListener(
      "click",
      closeCamera
    );
  }

  // ========================================================
  // LINHAS DE AUXÍLIO DA CÂMERA
  // ========================================================

  function drawOverlay() {

    if (!video ||
        !overlay ||
        !stream) {
      return;
    }

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {

      animationFrame =
        requestAnimationFrame(
          drawOverlay
        );

      return;
    }

    overlay.width =
      video.videoWidth;

    overlay.height =
      video.videoHeight;

    const ctx =
      overlay.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.clearRect(
      0,
      0,
      overlay.width,
      overlay.height
    );

    ctx.strokeStyle =
      "#00e5ff";

    ctx.lineWidth =
      Math.max(
        3,
        overlay.width / 600
      );
