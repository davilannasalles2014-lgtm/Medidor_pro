 // ==========================================================
// MEDIDOR PRO — app.js
// Versão completa e corrigida
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // CÂMERA
  const video = $("video");
  const overlay = $("overlay");
  const start = $("start");
  const stop = $("stop");
  const status = $("status");

  // CALIBRAÇÃO
  const refMm = $("refMm");
  const refPx = $("refPx");
  const calibrate = $("calibrate");
  const cal = $("cal");

  // MEDIÇÃO
  const objPx = $("objPx");
  const unit = $("unit");
  const precision = $("precision");
  const measure = $("measure");
  const result = $("result");
  const modeLabel = $("modeLabel");
  const save = $("save");

  // HISTÓRICO
  const historyBox = $("history");
  const clear = $("clear");

  // TEMA
  const themeToggle = $("themeToggle");
  const themePanel = $("themePanel");

  // PREMIUM
  const subscribe = $("subscribe");

  let stream = null;
  let animationFrame = null;
  let pixelsPerMm = 0;
  let currentMode = "Largura";
  let lastMeasurementMm = null;
  let lastMeasurementText = "";

  // Evita recarregar a página ao clicar nos botões
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (!button.hasAttribute("type")) {
        event.preventDefault();
      }
    });
  });

  // ==========================================================
  // CÂMERA
  // ==========================================================

  function setCameraStatus(text) {
    if (status) {
      status.textContent = text;
    }
  }

  function setCameraButtons() {
    if (start) {
      start.disabled = !!stream;
    }

    if (stop) {
      stop.disabled = !stream;
    }
  }

  async function openCamera(event) {
    if (event) {
      event.preventDefault();
    }

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

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraStatus("Câmera indisponível");

      alert(
        "Este navegador não disponibilizou acesso à câmera para o site."
      );

      return;
    }

    if (stream) {
      return;
    }

    try {
      setCameraStatus("Abrindo...");

      try {
        stream = await navigator.mediaDevices.getUserMedia({
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
      } catch (firstError) {
        console
