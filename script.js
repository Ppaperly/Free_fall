const HEIGHT_M = 176.4;
const DURATION_SEC = 6;

const TOP_Y = 72;
const BOTTOM_Y = 650;
const CENTER_X = 180;

const balls = {
  small: {
    name: "작은 쇠구슬",
    mass: 1,
    radius: 8
  },
  medium: {
    name: "중간 크기 쇠구슬",
    mass: 2,
    radius: 11
  },
  large: {
    name: "큰 쇠구슬",
    mass: 3,
    radius: 15
  }
};

const points = [
  { time: 0, distance: 0, speed: 0, position: 176.4 },
  { time: 1, distance: 4.9, speed: 9.8 },
  { time: 2, distance: 19.6, speed: 19.6 },
  { time: 3, distance: 44.1, speed: 29.4 },
  { time: 4, distance: 78.4, speed: 39.2 },
  { time: 5, distance: 122.5, speed: 49.0 },
  { time: 6, distance: 176.4, speed: 0 }
];

const ballSelect = document.querySelector("#ballSelect");
const startButton = document.querySelector("#startButton");
const resetButton = document.querySelector("#resetButton");
const markerLayer = document.querySelector("#markerLayer");
const activeBall = document.querySelector("#activeBall");

const modalOverlay = document.querySelector("#modalOverlay");
const modalContent = document.querySelector("#modalContent");
const closeModalButton = document.querySelector("#closeModalButton");

let selectedBallKey = ballSelect.value;
let animationFrameId = null;
let animationStartTime = null;
let isRunning = false;

function getSelectedBall() {
  return balls[selectedBallKey];
}

function yFromDistance(distance) {
  const ratio = distance / HEIGHT_M;
  return TOP_Y + ratio * (BOTTOM_Y - TOP_Y);
}

function formatNumber(value) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1);
}

function setActiveBallAt(distance) {
  const ball = getSelectedBall();
  activeBall.setAttribute("r", ball.radius);
  activeBall.setAttribute("cy", yFromDistance(distance));
}

function createSvgElement(tagName) {
  return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function getLabelShift(time) {
  if (time === 0) return -22;
  if (time === 1) return 24;
  return 0;
}

function drawMarkers() {
  markerLayer.innerHTML = "";

  const ball = getSelectedBall();

  points.forEach((point) => {
    const y = yFromDistance(point.distance);
    const labelY = y + getLabelShift(point.time);

    const group = createSvgElement("g");
    group.classList.add("marker-group");
    group.setAttribute("tabindex", "0");
    group.setAttribute("role", "button");
    group.setAttribute("aria-label", `${point.time}초 정보 보기`);

    const hit = createSvgElement("circle");
    hit.setAttribute("class", "marker-hit");
    hit.setAttribute("cx", CENTER_X);
    hit.setAttribute("cy", y);
    hit.setAttribute("r", Math.max(24, ball.radius + 10));

    const circle = createSvgElement("circle");
    circle.setAttribute("class", "marker-ball");
    circle.setAttribute("cx", CENTER_X);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", ball.radius);
    circle.setAttribute("opacity", point.time === 0 ? "1" : "0.72");

    const labelBg = createSvgElement("rect");
    labelBg.setAttribute("class", "marker-label-bg");
    labelBg.setAttribute("x", "224");
    labelBg.setAttribute("y", String(labelY - 15));
    labelBg.setAttribute("width", "62");
    labelBg.setAttribute("height", "30");
    labelBg.setAttribute("rx", "11");

    const label = createSvgElement("text");
    label.setAttribute("class", "marker-label");
    label.setAttribute("x", "255");
    label.setAttribute("y", String(labelY + 1));
    label.setAttribute("text-anchor", "middle");
    label.textContent = `${point.time}초`;

    group.appendChild(hit);
    group.appendChild(circle);
    group.appendChild(labelBg);
    group.appendChild(label);

    group.addEventListener("click", () => openModal(point));
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(point);
      }
    });

    markerLayer.appendChild(group);
  });
}

function makeInfoRow(name, value) {
  const row = document.createElement("div");
  row.className = "info-row";

  const nameSpan = document.createElement("span");
  nameSpan.textContent = name;

  const valueSpan = document.createElement("span");
  valueSpan.textContent = value;

  row.appendChild(nameSpan);
  row.appendChild(valueSpan);

  return row;
}

function openModal(point) {
  const ball = getSelectedBall();
  modalContent.innerHTML = "";

  modalContent.appendChild(makeInfoRow("질량", `${ball.mass} kg`));
  modalContent.appendChild(makeInfoRow("시간", `${point.time}초`));

  if (point.time === 0) {
    modalContent.appendChild(makeInfoRow("위치", `지면으로부터 ${formatNumber(point.position)} m`));
    modalContent.appendChild(makeInfoRow("속력", `${formatNumber(point.speed)} m/s`));
  } else {
    modalContent.appendChild(makeInfoRow("속력", `${formatNumber(point.speed)} m/s`));
    modalContent.appendChild(makeInfoRow("낙하거리", `${formatNumber(point.distance)} m`));
  }

  modalOverlay.hidden = false;
  closeModalButton.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
}

function animate(timestamp) {
  if (!animationStartTime) {
    animationStartTime = timestamp;
  }

  const elapsedMs = timestamp - animationStartTime;
  const elapsedSec = Math.min(elapsedMs / 1000, DURATION_SEC);

  const progress = elapsedSec / DURATION_SEC;
  const distance = HEIGHT_M * progress * progress;

  setActiveBallAt(distance);

  if (elapsedSec < DURATION_SEC) {
    animationFrameId = requestAnimationFrame(animate);
  } else {
    isRunning = false;
    animationStartTime = null;
    setActiveBallAt(HEIGHT_M);
  }
}

function startAnimation() {
  if (isRunning) return;

  cancelAnimationFrame(animationFrameId);
  isRunning = true;
  animationStartTime = null;
  setActiveBallAt(0);
  animationFrameId = requestAnimationFrame(animate);
}

function resetSimulation() {
  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  animationStartTime = null;
  isRunning = false;
  setActiveBallAt(0);
  closeModal();
}

ballSelect.addEventListener("change", () => {
  selectedBallKey = ballSelect.value;
  drawMarkers();
  setActiveBallAt(0);
});

startButton.addEventListener("click", startAnimation);
resetButton.addEventListener("click", resetSimulation);
closeModalButton.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalOverlay.hidden) {
    closeModal();
  }
});

drawMarkers();
setActiveBallAt(0);
