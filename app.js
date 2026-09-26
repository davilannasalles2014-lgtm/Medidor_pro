 // ==========================================================
// MEDIDOR PRO — app.js
// Versão completa e corrigida
// Todos os botões são ligados ao index.html atual.
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const video = $("video");
  const overlay = $("overlay");

  const start = $("start");
  const stop = $("stop");
  const status = $("status");

  const refMm = $("refMm");
  const refPx = $("refPx");
  const calibrate = $("calibrate");
  const cal = $("cal");

  const objPx = $("objPx");
  const unit = $("unit");
  const precision = $("precision");
  const measure = $("measure");
  const result = $("result");
  const modeLabel = $("modeLabel");
  const save = $("save");

  const historyBox = $("history");
  const clear = $("clear");

  const themeToggle = $("themeToggle");
  const themePanel = $("themePanel");

  const subscribe = $("subscribe");

  let stream = null;
  let animationFrame = null;
  let pixelsPerMm = 0;
  let currentMode = "Largura";
  let lastMeasurementMm = null;
  let lastMeasurementText = "";

  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (!button.hasAttribute("type")) {
        event.preventDefault();
      }
    });
  });

  // ---------- CÂMERA ----------

  function setCameraStatus(text) {
    if (status) status.textContent = text;
  }

  function setCameraButtons() {
    if (start) start.disabled = !!stream;
    if (stop) stop.disabled = !stream;
  }

  async function openCamera(event) {
    if (event) event.preventDefault();

    if (!video) {
      alert("Não foi possível encontrar a área da câmera.");
      return;
    }

    if (!window.isSecureContext) {
      setCameraStatus("HTTPS necessário");
      alert(
        "A câmera precisa de uma conexão segura (HTTPS).\n\n" +
        "Abra o Medidor Pro pelo GitHub Pages."
      );
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus("Câmera indisponível");
      alert(
        "Este navegador não disponibilizou acesso à câmera para o site."
      );
      return;
    }

    if (stream) return;

    try {
      setCameraStatus("Abrindo...");

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (firstError) {
        console.warn(
          "Tentativa com câmera traseira falhou:",
          firstError
        );

        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      video.srcObject = stream;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;

      try {
        await video.play();
      } catch (playError) {
        console.warn(
          "video.play() aguardando interação:",
          playError
        );
      }

      setCameraStatus("Ligada");
      setCameraButtons();
      drawOverlay();

    } catch (error) {
      console.error("Erro ao abrir câmera:", error);

      stream = null;
      video.srcObject = null;
      setCameraButtons();

      if (error && error.name === "NotAllowedError") {
        setCameraStatus("Permissão negada");

        alert(
          "O acesso à câmera foi bloqueado.\n\n" +
          "No cadeado 🔒 do Chrome, deixe Câmera como 'Permitir' " +
          "e tente novamente."
        );

      } else if (error && error.name === "NotFoundError") {
        setCameraStatus("Câmera não encontrada");
        alert("Nenhuma câmera foi encontrada no dispositivo.");

      } else if (error && error.name === "NotReadableError") {
        setCameraStatus("Câmera ocupada");

        alert(
          "A câmera pode estar sendo usada por outro aplicativo. " +
          "Feche outros aplicativos que estejam usando a câmera e tente novamente."
        );

      } else {
        setCameraStatus("Erro na câmera");

        alert(
          "Não foi possível abrir a câmera.\n\n" +
          "Verifique a permissão da câmera no Chrome e tente novamente."
        );
      }
    }
  }

  function closeCamera(event) {
    if (event) event.preventDefault();

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    if (video) video.srcObject = null;

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    setCameraStatus("Desligada");
    setCameraButtons();
    clearOverlay();
  }

  function clearOverlay() {
    if (!overlay) return;

    const ctx = overlay.getContext("2d");
    if (!
