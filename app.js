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

  const scenarios = {
    industrieland: {
      label: "Industrieland",
      description: "Hohe Produktion, bessere Aufklärung, spürbare Umweltbelastung.",
      actionPoints: 8,
      values: {
        politik: 0,
        sanierung: 1,
        produktion: 9,
        umweltbelastung: 13,
        bevoelkerung: 23,
        vermehrungsrate: 20,
        lebensqualitaet: 9,
        aufklaerung: 4
      }
    },
    schwellenland: {
      label: "Schwellenland",
      description: "Die Ausgangslage ist angespannt, aber noch gestaltbar.",
      actionPoints: 8,
      values: {
        politik: 0,
        sanierung: 1,
        produktion: 9,
        umweltbelastung: 17,
        bevoelkerung: 23,
        vermehrungsrate: 20,
        lebensqualitaet: 9,
        aufklaerung: 2
      }
    },
    entwicklungsland: {
      label: "Entwicklungsland",
      description: "Wenig Produktion, niedrige Lebensqualität, hohes Bevölkerungswachstum.",
      actionPoints: 10,
      values: {
        politik: -1,
        sanierung: 2,
        produktion: 3,
        umweltbelastung: 14,
        bevoelkerung: 22,
        vermehrungsrate: 24,
        lebensqualitaet: 3,
        aufklaerung: 2
      }
    }
  };

  const effectNodes = {
    politik: { meter: [24, 46, 32, 222], label: [72, 160, 150, 50], value: [80, 268] },
    sanierung: { meter: [382, 176, 32, 160], label: [435, 218, 185, 50], value: [435, 338] },
    produktion: { meter: [700, 198, 32, 180], label: [744, 255, 202, 50], value: [744, 382] },
    umweltbelastung: { meter: [1064, 145, 32, 190], label: [1118, 204, 258, 50], value: [1118, 338] },
    bevoelkerung: { meter: [-2, 440, 32, 250], label: [42, 568, 232, 50], value: [42, 694] },
    vermehrungsrate: { meter: [350, 525, 32, 175], label: [392, 588, 205, 50], value: [392, 704] },
    lebensqualitaet: { meter: [650, 490, 32, 205], label: [703, 545, 265, 50], value: [703, 700] },
    aufklaerung: { meter: [1030, 500, 32, 205], label: [1082, 558, 212, 50], value: [1082, 704] }
  };

  const arrowPaths = {
    "sanierung->umweltbelastung": "M500 220 L500 90 L1082 90 L1082 138",
    "sanierung->sanierung": "M460 304 L430 304 C420 338 405 350 382 350",
    "produktion->produktion": "M812 306 L812 342 L724 342",
    "produktion->umweltbelastung": "M945 280 L1050 280",
    "umweltbelastung->umweltbelastung": "M1212 252 L1212 292 C1185 318 1135 320 1098 296",
    "umweltbelastung->lebensqualitaet": "M1210 295 L1210 445 L684 445 L684 502",
    "aufklaerung->lebensqualitaet": "M1080 595 L970 595",
    "aufklaerung->vermehrungsrate": "M1210 610 L1210 762 L382 762",
    "aufklaerung->aufklaerung": "M1168 610 L1168 650 C1138 678 1100 690 1062 674",
    "lebensqualitaet->politik": "M684 705 L684 430 L32 430 L32 280",
    "lebensqualitaet->lebensqualitaet": "M764 618 C740 660 720 668 684 642",
    "lebensqualitaet->vermehrungsrate": "M682 690 L382 690",
    "vermehrungsrate->bevoelkerung": "M382 628 L32 628",
    "bevoelkerung->lebensqualitaet": "M144 590 L144 480 L545 480 L545 545 L650 545"
  };

  const state = {
    screen: "intro",
    view: "control",
    leaderName: "",
    scenarioKey: "schwellenland",
    round: 1,
    actionPoints: scenarios.schwellenland.actionPoints,
    running: false,
    paused: false,
    resultReason: "",
    message: "Verteile alle Aktionspunkte und starte dann die Runde.",
    activeStep: null,
    simulation: null,
    allocations: blankAllocations(),
    history: [],
    values: initialValues("schwellenland")
  };

  let timer = null;

  function initialValues(scenarioKey) {
    const scenario = scenarios[scenarioKey] || scenarios.schwellenland;
    return Object.assign({}, scenario.values);
  }

  function initialActionPoints(scenarioKey) {
    const scenario = scenarios[scenarioKey] || scenarios.schwellenland;
    return scenario.actionPoints;
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
    const selectedScenario = scenarios[state.scenarioKey] || scenarios.schwellenland;

    app.innerHTML = `
      <section class="intro-screen">
        <div class="intro-shade"></div>
        <div class="intro-copy">
          <p class="kicker">Regierungsauftrag</p>
          <h1>Ökolopoly</h1>
          <p>
            Du übernimmst ein erschöpftes Land: Industrie läuft,
            Flüsse kippen, die Bevölkerung wächst und das Vertrauen in die Politik ist niedrig.
            Du hast 12 Jahre Zeit, die Lage zu stabilisieren.
          </p>
          <form class="name-form" data-action="start-game">
            <label for="leader-name">Name des Regierungschefs</label>
            <div class="name-row">
              <input id="leader-name" name="leaderName" maxlength="28" autocomplete="off" placeholder="Dein Name" value="${escapeHtml(state.leaderName)}">
              <button type="submit">Amtszeit beginnen</button>
            </div>
            <fieldset class="scenario-picker">
              <legend>Ausgangslage wählen</legend>
              ${Object.keys(scenarios).map((key) => renderScenarioOption(key)).join("")}
            </fieldset>
            <div class="scenario-preview">
              <strong>${selectedScenario.label}</strong>
              <span>${selectedScenario.description}</span>
              <dl>
                ${renderScenarioPreviewRows(selectedScenario)}
              </dl>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  function renderScenarioOption(key) {
    const scenario = scenarios[key];
    const checked = key === state.scenarioKey ? "checked" : "";

    return `
      <label class="scenario-option">
        <input type="radio" name="scenario" value="${key}" ${checked}>
        <span>${scenario.label}</span>
      </label>
    `;
  }

  function renderScenarioPreviewRows(scenario) {
    const previewRows = [
      ["Sanierung", scenario.values.sanierung],
      ["Produktion", scenario.values.produktion],
      ["Umweltbelastung", scenario.values.umweltbelastung],
      ["Aufklärung", scenario.values.aufklaerung],
      ["Lebensqualität", scenario.values.lebensqualitaet],
      ["Vermehrungsrate", scenario.values.vermehrungsrate],
      ["Bevölkerung", scenario.values.bevoelkerung],
      ["Politik", scenario.values.politik],
      ["Aktionspunkte", scenario.actionPoints]
    ];

    return previewRows.map(([label, value]) => `
      <div>
        <dt>${label}</dt>
        <dd>${value}</dd>
      </div>
    `).join("");
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
    const activePath = arrowPaths[activeRelation];

    return `
      <div class="retro-board effects-board">
        <svg class="effect-diagram" viewBox="0 0 1403 790" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Wirkungsketten">
          <defs>
            <marker id="arrow-head" viewBox="0 0 26 26" refX="24" refY="13" markerWidth="24" markerHeight="24" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
              <path d="M 1 1 L 25 13 L 1 25 z"></path>
            </marker>
          </defs>
          ${Object.keys(arrowPaths).map((key) => `
            <path class="effect-line ${activeRelation === key ? "active" : ""}" data-relation="${key}" d="${arrowPaths[key]}"></path>
          `).join("")}
          ${activePath ? `
            <path class="effect-flow effect-flow-red" d="${activePath}"></path>
            <path class="effect-flow effect-flow-white" d="${activePath}"></path>
          ` : ""}
          ${metrics.map(renderEffectNode).join("")}
        </svg>
      </div>
    `;
  }

  function renderEffectNode(metric) {
    const node = effectNodes[metric.key];
    const value = state.values[metric.key];
    const percent = normalizedValue(metric.key, value);
    const [meterX, meterY, meterW, meterH] = node.meter;
    const [labelX, labelY, labelW, labelH] = node.label;
    const [valueX, valueY] = node.value;
    const fillHeight = Math.max(4, (meterH - 8) * percent / 100);
    const fillY = meterY + meterH - 4 - fillHeight;
    const tickLines = [0.2, 0.4, 0.6, 0.8].map((tick) => {
      const y = meterY + meterH * tick;
      return `<line class="effect-meter-tick" x1="${meterX}" y1="${y}" x2="${meterX + meterW}" y2="${y}"></line>`;
    }).join("");

    return `
      <g class="effect-node node-${metric.key}">
        <rect class="effect-meter-shell" x="${meterX}" y="${meterY}" width="${meterW}" height="${meterH}"></rect>
        ${tickLines}
        <rect class="effect-meter-fill fill-${metric.color}" x="${meterX + 5}" y="${fillY}" width="${meterW - 10}" height="${fillHeight}"></rect>
        <rect class="effect-label-box" x="${labelX}" y="${labelY}" width="${labelW}" height="${labelH}"></rect>
        <text class="effect-label-text" x="${labelX + 14}" y="${labelY + 33}">${escapeHtml(metric.label)}</text>
        <text class="effect-value-text" x="${valueX}" y="${valueY}">${Math.round(value)}</text>
      </g>
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
    state.actionPoints = initialActionPoints(state.scenarioKey);
    state.running = false;
    state.paused = false;
    state.resultReason = "";
    state.message = "Verteile alle Aktionspunkte und starte dann die Runde.";
    state.activeStep = null;
    state.simulation = null;
    state.allocations = blankAllocations();
    state.history = [];
    state.values = initialValues(state.scenarioKey);
    render();
  }

  app.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-action='start-game']");
    if (!form) return;

    event.preventDefault();
    const data = new FormData(form);
    const scenarioKey = String(data.get("scenario") || "schwellenland");
    state.leaderName = String(data.get("leaderName") || "").trim() || "Regierungschef";
    state.scenarioKey = scenarios[scenarioKey] ? scenarioKey : "schwellenland";
    state.actionPoints = initialActionPoints(state.scenarioKey);
    state.values = initialValues(state.scenarioKey);
    state.allocations = blankAllocations();
    state.screen = "game";
    state.view = "control";
    state.message = `Du hast am Anfang ${state.actionPoints} Aktionspunkte. Verteile sie im Stellwerk.`;
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

  app.addEventListener("change", (event) => {
    if (!event.target.matches("input[name='scenario']")) return;
    const nameInput = app.querySelector("input[name='leaderName']");
    if (nameInput) state.leaderName = nameInput.value;
    const scenarioKey = event.target.value;
    state.scenarioKey = scenarios[scenarioKey] ? scenarioKey : "schwellenland";
    render();
  });

  function bootDebugView() {
    if (!["#play", "#effects", "#flow"].includes(window.location.hash)) return;

    state.screen = "game";
    state.leaderName = "Testregierung";
    state.view = window.location.hash === "#play" ? "control" : "effects";
    if (window.location.hash === "#flow") {
      state.activeStep = {
        from: "lebensqualitaet",
        to: "lebensqualitaet",
        delta: curves["f10-Lebensqualitaet-auf-Lebensqualitaet"](state.values.lebensqualitaet),
        title: "f10-Lebensqualitaet-auf-Lebensqualitaet"
      };
      state.running = true;
      state.paused = true;
    }
    state.message = window.location.hash === "#flow"
      ? "Debugansicht: aktive Wirkung Lebensqualität."
      : state.view === "effects"
        ? "Debugansicht: Wirkungsketten ohne laufende Simulation."
        : "Debugansicht: Stellwerk bereit.";
  }

  bootDebugView();
  render();
}());
