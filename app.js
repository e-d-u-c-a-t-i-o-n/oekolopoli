(function () {
  "use strict";

  const { clamp, curves, relations } = window.OekolopolyCurves;
  const app = document.getElementById("app");

  const MAX_ROUNDS = 12;

  const metrics = [
    { key: "politik", label: "Politik", max: 32, color: "red", x: 3, y: 7, w: 24, h: 32, art: "parliament" },
    { key: "sanierung", label: "Sanierung", max: 32, color: "red", x: 31, y: 5, w: 22, h: 34, art: "fields", control: true },
    { key: "produktion", label: "Produktion", max: 32, color: "green", x: 54, y: 5, w: 25, h: 33, art: "factory", control: true },
    { key: "umweltbelastung", label: "Umweltbelastung", max: 32, color: "orange", x: 81, y: 9, w: 18, h: 30, art: "dump" },
    { key: "bevoelkerung", label: "Bevölkerung", max: 48, color: "green", x: 3, y: 55, w: 24, h: 31, art: "city" },
    { key: "vermehrungsrate", label: "Vermehrungsrate", max: 32, color: "orange", x: 27, y: 55, w: 20, h: 31, art: "home" },
    { key: "lebensqualitaet", label: "Lebensqualität", max: 32, color: "red", x: 49, y: 53, w: 25, h: 34, art: "park", control: true },
    { key: "aufklaerung", label: "Aufklärung", max: 32, color: "orange", x: 76, y: 54, w: 22, h: 32, art: "school", control: true }
  ];

  const metricByKey = metrics.reduce((map, metric) => {
    map[metric.key] = metric;
    return map;
  }, {});

  const controlKeys = ["sanierung", "produktion", "lebensqualitaet", "aufklaerung"];

  const effectNodes = {
    politik: { x: 10, y: 22 },
    sanierung: { x: 36, y: 24 },
    produktion: { x: 60, y: 24 },
    umweltbelastung: { x: 84, y: 24 },
    bevoelkerung: { x: 12, y: 70 },
    vermehrungsrate: { x: 33, y: 70 },
    lebensqualitaet: { x: 58, y: 68 },
    aufklaerung: { x: 80, y: 68 }
  };

  const arrowPaths = {
    "sanierung->umweltbelastung": "M360 210 L360 90 L885 90 L885 185",
    "sanierung->sanierung": "M340 250 C290 250 290 295 330 295",
    "produktion->produktion": "M610 250 C565 250 565 295 600 295",
    "produktion->umweltbelastung": "M675 236 L820 236",
    "umweltbelastung->umweltbelastung": "M920 245 C980 245 980 300 925 300",
    "umweltbelastung->lebensqualitaet": "M892 300 L892 495 L635 495 L635 585",
    "umweltbelastung->politik": "M870 430 L80 430 L80 270",
    "aufklaerung->lebensqualitaet": "M840 655 L625 655",
    "aufklaerung->vermehrungsrate": "M850 615 L850 760 L335 760",
    "aufklaerung->aufklaerung": "M805 710 C760 710 760 755 800 755",
    "lebensqualitaet->politik": "M560 600 L560 425 L82 425",
    "lebensqualitaet->lebensqualitaet": "M570 705 C520 705 520 750 565 750",
    "lebensqualitaet->vermehrungsrate": "M550 690 L365 690",
    "vermehrungsrate->bevoelkerung": "M300 690 L150 690",
    "bevoelkerung->lebensqualitaet": "M135 610 L135 500 L575 500"
  };

  const state = {
    screen: "intro",
    view: "control",
    leaderName: "",
    round: 1,
    actionPoints: 8,
    running: false,
    paused: false,
    resultReason: "",
    message: "Verteile alle Aktionspunkte und starte dann die Runde.",
    activeStep: null,
    simulation: null,
    allocations: blankAllocations(),
    history: [],
    values: initialValues()
  };

  let timer = null;

  function initialValues() {
    return {
      politik: 8,
      sanierung: 7,
      produktion: 18,
      umweltbelastung: 25,
      bevoelkerung: 18,
      vermehrungsrate: 20,
      lebensqualitaet: 8,
      aufklaerung: 6
    };
  }

  function blankAllocations() {
    return {
      sanierung: 0,
      produktion: 0,
      lebensqualitaet: 0,
      aufklaerung: 0
    };
  }

  function usedActionPoints(allocations) {
    return controlKeys.reduce((sum, key) => sum + Math.abs(allocations[key]), 0);
  }

  function remainingActionPoints() {
    return state.actionPoints - usedActionPoints(state.allocations);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function signed(value) {
    return value > 0 ? `+${value}` : String(value);
  }

  function metricLabel(key) {
    return metricByKey[key] ? metricByKey[key].label : key;
  }

  function consoleLabel(key) {
    const labels = {
      lebensqualitaet: "Lebensqual.",
      aufklaerung: "Aufklärung"
    };
    return labels[key] || metricLabel(key);
  }

  function normalizedValue(key, value) {
    const metric = metricByKey[key];
    return clamp((value / metric.max) * 100, 0, 100);
  }

  function render() {
    if (state.screen === "intro") {
      renderIntro();
      return;
    }

    if (state.screen === "result") {
      renderResult();
      return;
    }

    renderGame();
  }

  function renderIntro() {
    app.innerHTML = `
      <section class="intro-screen">
        <div class="intro-shade"></div>
        <div class="intro-copy">
          <p class="kicker">Regierungsauftrag</p>
          <h1>Ökolopoly</h1>
          <p>
            Du übernimmst ein erschöpftes Schwellenland: Industrie läuft,
            Flüsse kippen, die Bevölkerung wächst und das Vertrauen in die Politik ist niedrig.
            Du hast 12 Jahre Zeit, die Lage zu stabilisieren.
          </p>
          <form class="name-form" data-action="start-game">
            <label for="leader-name">Name des Regierungschefs</label>
            <div class="name-row">
              <input id="leader-name" name="leaderName" maxlength="28" autocomplete="off" placeholder="Dein Name">
              <button type="submit">Amtszeit beginnen</button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  function renderGame() {
    app.innerHTML = `
      <section class="game-screen">
        ${renderHeader()}
        <div class="playfield ${state.view === "control" ? "is-control" : "is-effects"}">
          ${state.view === "control" ? renderControlBoard() : renderEffectsBoard()}
        </div>
        ${renderBottomBar()}
      </section>
    `;
  }

  function renderHeader() {
    const viewLabel = state.view === "control" ? "Wirkung" : "Stellwerk";
    const viewIcon = state.view === "control" ? "⇄" : "▦";
    const disabled = state.running ? "disabled" : "";

    return `
      <header class="topline">
        <div>
          <p class="system-name">Ökolopoly</p>
          <h2>${escapeHtml(state.leaderName)}, Jahr ${state.round} von ${MAX_ROUNDS}</h2>
        </div>
        <div class="top-actions">
          <button class="icon-button" data-action="toggle-view" ${disabled} title="Ansicht wechseln" aria-label="Ansicht wechseln">
            <span>${viewIcon}</span>
            <small>${viewLabel}</small>
          </button>
          <button class="icon-button quiet" data-action="restart" title="Neu starten" aria-label="Neu starten">
            <span>↺</span>
            <small>Neu</small>
          </button>
        </div>
      </header>
    `;
  }

  function renderControlBoard() {
    return `
      <div class="retro-board control-board">
        ${metrics.map(renderStation).join("")}
        <div class="board-logo">Ökolopoly</div>
      </div>
    `;
  }

  function renderStation(metric) {
    const value = state.values[metric.key];
    const percent = normalizedValue(metric.key, value);
    const planned = state.allocations[metric.key] || 0;
    const controlClass = metric.control ? "is-adjustable" : "";
    const controls = metric.control && !state.running
      ? `
        <div class="station-controls">
          <button data-action="adjust" data-key="${metric.key}" data-delta="-1" aria-label="${metric.label} senken">−</button>
          <button data-action="adjust" data-key="${metric.key}" data-delta="1" aria-label="${metric.label} erhöhen">+</button>
        </div>
      `
      : "";

    return `
      <article class="station ${controlClass} station-${metric.art}" style="left:${metric.x}%; top:${metric.y}%; width:${metric.w}%; height:${metric.h}%;">
        <div class="meter meter-${metric.color}" aria-label="${metric.label}: ${Math.round(value)}">
          <div class="meter-fill" style="height:${percent}%"></div>
          <span class="meter-value">${Math.round(value)}</span>
        </div>
        <div class="station-art" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <h3>${metric.label}</h3>
        ${planned ? `<div class="planned">${signed(planned)}</div>` : ""}
        ${controls}
      </article>
    `;
  }

  function renderEffectsBoard() {
    const activeRelation = state.activeStep && state.activeStep.from && state.activeStep.to
      ? `${state.activeStep.from}->${state.activeStep.to}`
      : "";

    return `
      <div class="retro-board effects-board">
        <svg class="effect-arrows" viewBox="0 0 1000 780" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id="arrow-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z"></path>
            </marker>
          </defs>
          ${Object.keys(arrowPaths).map((key) => `
            <path class="${activeRelation === key ? "active" : ""}" d="${arrowPaths[key]}"></path>
          `).join("")}
        </svg>
        ${metrics.map(renderEffectNode).join("")}
      </div>
    `;
  }

  function renderEffectNode(metric) {
    const node = effectNodes[metric.key];
    const value = state.values[metric.key];
    const percent = normalizedValue(metric.key, value);

    return `
      <div class="effect-node node-${metric.key}" style="left:${node.x}%; top:${node.y}%;">
        <div class="mini-meter meter-${metric.color}">
          <div class="meter-fill" style="height:${percent}%"></div>
        </div>
        <strong>${metric.label}</strong>
        <span>${Math.round(value)}</span>
      </div>
    `;
  }

  function renderBottomBar() {
    const left = remainingActionPoints();
    const startDisabled = state.running || left !== 0 ? "disabled" : "";
    const pauseDisabled = state.running ? "" : "disabled";
    const bottomToggleLabel = state.view === "control" ? "Zustand anschauen" : "Stellwerk";
    const activeText = state.activeStep
      ? `${state.activeStep.title}: ${signed(state.activeStep.delta)} auf ${metricLabel(state.activeStep.to)}`
      : state.message;

    return `
      <footer class="bottom-console">
        <section class="ap-display">
          <h3>Aktionspunkte</h3>
          <output>${left}</output>
        </section>
        <section class="allocation-list" aria-label="Vergebene Aktionspunkte">
          ${controlKeys.map((key) => `
            <div>
              <span>${consoleLabel(key)}</span>
              <strong>${signed(state.allocations[key])}</strong>
            </div>
          `).join("")}
        </section>
        <section class="console-message">
          <p>${escapeHtml(activeText)}</p>
        </section>
        <section class="round-actions">
          <button data-action="toggle-view" ${state.running ? "disabled" : ""}>${bottomToggleLabel}</button>
          <button data-action="start-simulation" ${startDisabled}>Runde starten</button>
          <button data-action="pause" ${pauseDisabled}>${state.paused ? "Weiter" : "Pause"}</button>
        </section>
      </footer>
    `;
  }

  function renderResult() {
    const evaluation = evaluateGame();
    app.innerHTML = `
      <section class="result-screen">
        <div class="result-panel">
          <p class="kicker">Abrechnung nach ${state.history.length} Jahren</p>
          <h1>${evaluation.title}</h1>
          <p>${evaluation.text}</p>
          <dl class="result-grid">
            ${metrics.map((metric) => `
              <div>
                <dt>${metric.label}</dt>
                <dd>${Math.round(state.values[metric.key])}</dd>
              </div>
            `).join("")}
          </dl>
          <button data-action="restart">Neue Amtszeit</button>
        </div>
      </section>
    `;
  }

  function adjustAllocation(key, delta) {
    if (state.running || state.view !== "control") return;
    if (!controlKeys.includes(key)) return;

    const nextAllocations = Object.assign({}, state.allocations);
    const proposed = nextAllocations[key] + delta;

    if (key === "produktion") {
      if (proposed < -state.actionPoints || proposed > state.actionPoints) return;
    } else if (proposed < 0 || proposed > state.actionPoints) {
      return;
    }

    nextAllocations[key] = proposed;
    if (usedActionPoints(nextAllocations) > state.actionPoints) return;

    const projectedValue = state.values[key] + proposed;
    if (projectedValue < 0 || projectedValue > metricByKey[key].max) return;

    state.allocations = nextAllocations;
    state.message = remainingActionPoints() === 0
      ? "Alle Aktionspunkte sind vergeben. Die Runde kann starten."
      : "Verteile alle Aktionspunkte und starte dann die Runde.";
    render();
  }

  function toggleView() {
    if (state.running) return;
    state.view = state.view === "control" ? "effects" : "control";
    state.message = state.view === "control"
      ? "Im Stellwerk kannst du Aktionspunkte vergeben."
      : "Hier siehst du die Wirkungsketten deiner Entscheidungen.";
    render();
  }

  function startSimulation() {
    if (state.running) return;

    if (remainingActionPoints() !== 0) {
      state.message = "Bitte vergib alle Aktionspunkte, bevor du die Runde startest.";
      render();
      return;
    }

    state.view = "effects";
    state.running = true;
    state.paused = false;
    state.activeStep = null;
    state.simulation = buildSimulation();
    state.message = "Die Wirkungskette läuft. Der Umschalter ist bis zum Ende gesperrt.";
    render();
    scheduleNextStep();
  }

  function buildSimulation() {
    const draft = Object.assign({}, state.values);
    const steps = [];

    controlKeys.forEach((key) => {
      const delta = state.allocations[key];
      if (!delta) return;
      draft[key] = clamp(draft[key] + delta, 0, metricByKey[key].max);
      steps.push({
        type: "allocation",
        from: null,
        to: key,
        delta,
        title: "Stellwerk",
        text: `${metricLabel(key)} wird direkt gestellt`
      });
    });

    relations.forEach(([from, to, curveKey]) => {
      const context = { values: draft };
      const delta = curves[curveKey](draft[from], context);
      if (!delta) return;

      draft[to] = clamp(draft[to] + delta, 0, metricByKey[to].max);
      steps.push({
        type: "curve",
        from,
        to,
        delta,
        curveKey,
        title: curveKey,
        text: `${metricLabel(from)} wirkt auf ${metricLabel(to)}`
      });
    });

    const actionPointPreview = calculateNextActionPoints(draft);

    return {
      index: 0,
      steps,
      finalValues: draft,
      nextActionPoints: actionPointPreview.total,
      actionPointDetails: actionPointPreview
    };
  }

  function scheduleNextStep() {
    clearTimeout(timer);
    if (!state.running || state.paused || !state.simulation) return;

    timer = setTimeout(() => {
      const sim = state.simulation;
      const step = sim.steps[sim.index];

      if (!step) {
        finishRound();
        return;
      }

      const metric = metricByKey[step.to];
      state.values[step.to] = clamp(state.values[step.to] + step.delta, 0, metric.max);
      state.activeStep = step;
      sim.index += 1;
      render();
      scheduleNextStep();
    }, state.activeStep ? 760 : 480);
  }

  function finishRound() {
    clearTimeout(timer);
    const sim = state.simulation;

    state.values = Object.assign({}, sim.finalValues);
    state.actionPoints = sim.nextActionPoints;
    state.history.push({
      round: state.round,
      allocations: Object.assign({}, state.allocations),
      values: Object.assign({}, state.values),
      actionPointDetails: sim.actionPointDetails
    });

    state.activeStep = null;
    state.running = false;
    state.paused = false;
    state.simulation = null;
    state.allocations = blankAllocations();

    if (state.values.politik <= 0) {
      state.resultReason = "dismissed";
      state.screen = "result";
      render();
      return;
    }

    if (state.round >= MAX_ROUNDS) {
      state.resultReason = "final";
      state.screen = "result";
      render();
      return;
    }

    state.round += 1;
    state.view = "control";
    state.message = `Jahr ${state.round}: Dir stehen ${state.actionPoints} Aktionspunkte zur Verfügung.`;
    render();
  }

  function calculateNextActionPoints(values) {
    const population = curves["fA-Einfluss-der-Bevoelkerung"](values.bevoelkerung, { values });
    const politics = curves["fB-Einfluss-der-Politik"](values.politik, { values });
    const production = curves["fC-Einfluss-der-Produktion"](values.produktion, { values });
    const life = curves["fD-Einfluss-der-Lebensqualitaet"](values.lebensqualitaet, { values });
    const economy = Math.round((population + production + life) / 4);
    const total = clamp(8 + politics + economy, 0, 16);

    return {
      total,
      population,
      politics,
      production,
      life
    };
  }

  function togglePause() {
    if (!state.running) return;
    state.paused = !state.paused;
    state.message = state.paused
      ? "Simulation pausiert."
      : "Die Wirkungskette läuft weiter.";
    render();
    scheduleNextStep();
  }

  function evaluateGame() {
    const values = state.values;

    if (state.resultReason === "dismissed") {
      return {
        title: "Abgesetzt",
        text: "Die politische Unterstützung ist auf null gefallen. Das Parlament entzieht dir das Mandat, bevor die 12 Jahre vorbei sind."
      };
    }

    const score = values.politik + values.lebensqualitaet + values.sanierung + values.aufklaerung
      + Math.max(0, 32 - values.umweltbelastung)
      + Math.max(0, 28 - values.vermehrungsrate);

    if (score >= 105) {
      return {
        title: "Stabile Wende",
        text: "Das Land hat sich spürbar erholt. Die Bevölkerung trägt den Kurs mit, die Umweltbelastung sinkt und die Handlungsfähigkeit bleibt erhalten."
      };
    }

    if (score >= 78) {
      return {
        title: "Wacklige Stabilisierung",
        text: "Du hast das Land nicht verloren, aber die Systeme stehen weiter unter Druck. Einige Entscheidungen wirken erst in den nächsten Jahren richtig."
      };
    }

    return {
      title: "Zu wenig gegengesteuert",
      text: "Die Lage bleibt kritisch. Produktion, Umwelt, Lebensqualität und Bevölkerung ziehen noch zu stark in verschiedene Richtungen."
    };
  }

  function restart() {
    clearTimeout(timer);
    state.screen = "intro";
    state.view = "control";
    state.round = 1;
    state.actionPoints = 8;
    state.running = false;
    state.paused = false;
    state.resultReason = "";
    state.message = "Verteile alle Aktionspunkte und starte dann die Runde.";
    state.activeStep = null;
    state.simulation = null;
    state.allocations = blankAllocations();
    state.history = [];
    state.values = initialValues();
    render();
  }

  app.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-action='start-game']");
    if (!form) return;

    event.preventDefault();
    const data = new FormData(form);
    state.leaderName = String(data.get("leaderName") || "").trim() || "Regierungschef";
    state.screen = "game";
    state.view = "control";
    state.message = "Du hast am Anfang 8 Aktionspunkte. Verteile sie im Stellwerk.";
    render();
  });

  app.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;

    if (action === "adjust") {
      adjustAllocation(target.dataset.key, Number(target.dataset.delta));
    } else if (action === "toggle-view") {
      toggleView();
    } else if (action === "start-simulation") {
      startSimulation();
    } else if (action === "pause") {
      togglePause();
    } else if (action === "restart") {
      restart();
    }
  });

  function bootDebugView() {
    if (window.location.hash !== "#play" && window.location.hash !== "#effects") return;

    state.screen = "game";
    state.leaderName = "Testregierung";
    state.view = window.location.hash === "#effects" ? "effects" : "control";
    state.message = state.view === "effects"
      ? "Debugansicht: Wirkungsketten ohne laufende Simulation."
      : "Debugansicht: Stellwerk bereit.";
  }

  bootDebugView();
  render();
}());
