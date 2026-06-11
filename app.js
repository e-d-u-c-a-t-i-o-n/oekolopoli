(function () {
  "use strict";

  const { clamp, curves, relations } = window.OekolopolyCurves;
  const app = document.getElementById("app");

  const MAX_ROUNDS = 12;
  const TOOLTIP_DELAY = 720;
  const TOOLTIP_MOVE_TOLERANCE = 10;
  const TOOLTIP_RELEASE_VISIBLE_MS = 2600;
  const DEFAULT_LANGUAGE = "de";
  const languageOptions = {
    de: { code: "DE", label: "Deutsch", htmlLang: "de" },
    el: { code: "EL", label: "Ελληνικά", htmlLang: "el" }
  };

  const translations = {
    de: {
      languageLabel: "Sprache",
      metrics: {
        politik: "Politik",
        sanierung: "Sanierung",
        produktion: "Produktion",
        umweltbelastung: "Umweltbelastung",
        bevoelkerung: "Bevölkerung",
        vermehrungsrate: "Vermehrungsrate",
        lebensqualitaet: "Lebensqualität",
        aufklaerung: "Bildung"
      },
      metricShort: {
        lebensqualitaet: "Lebensqual.",
        aufklaerung: "Bildung"
      },
      scenarios: {
        industrieland: {
          label: "Industrieland",
          description: "Hohe Produktion, bessere Bildung, spürbare Umweltbelastung."
        },
        schwellenland: {
          label: "Schwellenland",
          description: "Die Ausgangslage ist angespannt, aber noch gestaltbar."
        },
        entwicklungsland: {
          label: "Entwicklungsland",
          description: "Wenig Produktion, niedrige Lebensqualität, hohes Bevölkerungswachstum."
        }
      },
      scenarioPreview: {
        sanierung: "Sanierung",
        produktion: "Produktion",
        umweltbelastung: "Umweltbelastung",
        aufklaerung: "Bildung",
        lebensqualitaet: "Lebensqualität",
        vermehrungsrate: "Vermehrungsrate",
        bevoelkerung: "Bevölkerung",
        politik: "Politik",
        actionPoints: "Aktionspunkte"
      },
      intro: {
        kicker: "Regierungsauftrag",
        description: "Du übernimmst ein erschöpftes Land: Industrie läuft, Flüsse kippen, die Bevölkerung wächst und das Vertrauen in die Politik ist niedrig. Du hast 12 Jahre Zeit, die Lage zu stabilisieren.",
        leaderName: "Name des Regierungschefs",
        namePlaceholder: "Dein Name",
        startTerm: "Amtszeit beginnen",
        chooseScenario: "Ausgangslage wählen"
      },
      defaults: {
        leaderName: "Regierungschef",
        debugLeader: "Testregierung"
      },
      header: {
        roundTitle: (name, round, maxRounds) => `${name}, Jahr ${round} von ${maxRounds}`,
        reset: "Reset",
        actionPoints: "Aktionspunkte",
        switchView: "Ansicht wechseln",
        startRound: "Runde starten",
        fastForward: "Runde sofort berechnen",
        start: "Start",
        immediately: "Sofort"
      },
      views: {
        control: "Stellwerk",
        effects: "Wirkung",
        state: "Zustand anschauen"
      },
      controls: {
        increase: (label) => `${label} erhöhen`,
        decrease: (label) => `${label} senken`
      },
      plots: {
        aria: (label) => `Verlauf ${label}`,
        showImage: (label) => `${label}: Bild anzeigen`,
        showPlot: (label) => `${label}: Verlauf anzeigen`
      },
      effects: {
        aria: "Wirkungsketten"
      },
      bottom: {
        allocatedActionPoints: "Vergebene Aktionspunkte",
        startRound: "Runde starten",
        pause: "Pause",
        continue: "Weiter"
      },
      result: {
        kicker: (years) => `Abrechnung nach ${years} Jahren`,
        newTerm: "Neue Amtszeit",
        plotsAria: "Verlaufsplots"
      },
      messages: {
        distributeAll: "Verteile alle Aktionspunkte und starte dann die Runde.",
        allAllocated: "Alle Aktionspunkte sind vergeben. Die Runde kann starten.",
        controlView: "Im Stellwerk kannst du Aktionspunkte vergeben.",
        effectsView: "Hier siehst du die Wirkungsketten deiner Entscheidungen.",
        allocateBeforeStart: "Bitte vergib alle Aktionspunkte, bevor du die Runde startest.",
        effectsRunning: "Die Wirkungskette läuft. Der Umschalter ist bis zum Ende gesperrt.",
        allocateBeforeFastForward: "Bitte vergib alle Aktionspunkte, bevor du die Runde sofort berechnest.",
        yearActionPoints: (round, points) => `Jahr ${round}: Dir stehen ${points} Aktionspunkte zur Verfügung.`,
        paused: "Simulation pausiert.",
        runningAgain: "Die Wirkungskette läuft weiter.",
        initialActionPoints: (points) => `Du hast am Anfang ${points} Aktionspunkte. Verteile sie im Stellwerk.`,
        debugFlow: "Debugansicht: aktive Wirkung Lebensqualität.",
        debugEffects: "Debugansicht: Wirkungsketten ohne laufende Simulation.",
        debugControl: "Debugansicht: Stellwerk bereit."
      },
      simulation: {
        controlTitle: "Stellwerk",
        direct: (label) => `${label} wird direkt gestellt`,
        affects: (from, to) => `${from} wirkt auf ${to}`
      },
      evaluation: {
        dismissed: {
          title: "Abgesetzt",
          text: "Die politische Unterstützung ist unter null gefallen. Das Parlament entzieht dir das Mandat, bevor die 12 Jahre vorbei sind."
        },
        stable: {
          title: "Stabile Wende",
          text: "Das Land hat sich spürbar erholt. Die Bevölkerung trägt den Kurs mit, die Umweltbelastung sinkt und die Handlungsfähigkeit bleibt erhalten."
        },
        shaky: {
          title: "Wacklige Stabilisierung",
          text: "Du hast das Land nicht verloren, aber die Systeme stehen weiter unter Druck. Einige Entscheidungen wirken erst in den nächsten Jahren richtig."
        },
        weak: {
          title: "Zu wenig gegengesteuert",
          text: "Die Lage bleibt kritisch. Produktion, Umwelt, Lebensqualität und Bevölkerung ziehen noch zu stark in verschiedene Richtungen."
        }
      }
    },
    el: {
      languageLabel: "Γλώσσα",
      metrics: {
        politik: "Πολιτική",
        sanierung: "Αποκατάσταση",
        produktion: "Παραγωγή",
        umweltbelastung: "Ρύπανση",
        bevoelkerung: "Πληθυσμός",
        vermehrungsrate: "Γεννήσεις",
        lebensqualitaet: "Ποιότητα ζωής",
        aufklaerung: "Παιδεία"
      },
      metricShort: {
        lebensqualitaet: "Ποιότητα",
        aufklaerung: "Παιδεία"
      },
      scenarios: {
        industrieland: {
          label: "Βιομηχανική χώρα",
          description: "Υψηλή παραγωγή, καλύτερη παιδεία και αισθητή ρύπανση."
        },
        schwellenland: {
          label: "Αναδυόμενη χώρα",
          description: "Η αρχική κατάσταση είναι πιεσμένη, αλλά ακόμη διαχειρίσιμη."
        },
        entwicklungsland: {
          label: "Αναπτυσσόμενη χώρα",
          description: "Χαμηλή παραγωγή, χαμηλή ποιότητα ζωής και μεγάλη αύξηση πληθυσμού."
        }
      },
      scenarioPreview: {
        sanierung: "Αποκατάσταση",
        produktion: "Παραγωγή",
        umweltbelastung: "Ρύπανση",
        aufklaerung: "Παιδεία",
        lebensqualitaet: "Ποιότητα ζωής",
        vermehrungsrate: "Γεννήσεις",
        bevoelkerung: "Πληθυσμός",
        politik: "Πολιτική",
        actionPoints: "Πόντοι δράσης"
      },
      intro: {
        kicker: "Κυβερνητική αποστολή",
        description: "Αναλαμβάνεις μια εξαντλημένη χώρα: η βιομηχανία δουλεύει, τα ποτάμια καταρρέουν, ο πληθυσμός αυξάνεται και η εμπιστοσύνη στην πολιτική είναι χαμηλή. Έχεις 12 χρόνια για να σταθεροποιήσεις την κατάσταση.",
        leaderName: "Όνομα αρχηγού κυβέρνησης",
        namePlaceholder: "Το όνομά σου",
        startTerm: "Έναρξη θητείας",
        chooseScenario: "Επιλογή αρχικής κατάστασης"
      },
      defaults: {
        leaderName: "Αρχηγός κυβέρνησης",
        debugLeader: "Δοκιμαστική κυβέρνηση"
      },
      header: {
        roundTitle: (name, round, maxRounds) => `${name}, έτος ${round} από ${maxRounds}`,
        reset: "Επαναφορά",
        actionPoints: "Πόντοι δράσης",
        switchView: "Αλλαγή προβολής",
        startRound: "Έναρξη γύρου",
        fastForward: "Άμεσος υπολογισμός γύρου",
        start: "Start",
        immediately: "Άμεσα"
      },
      views: {
        control: "Πίνακας",
        effects: "Επίδραση",
        state: "Κατάσταση"
      },
      controls: {
        increase: (label) => `Αύξηση: ${label}`,
        decrease: (label) => `Μείωση: ${label}`
      },
      plots: {
        aria: (label) => `Πορεία: ${label}`,
        showImage: (label) => `${label}: εμφάνιση εικόνας`,
        showPlot: (label) => `${label}: εμφάνιση πορείας`
      },
      effects: {
        aria: "Αλυσίδες επιδράσεων"
      },
      bottom: {
        allocatedActionPoints: "Κατανεμημένοι πόντοι δράσης",
        startRound: "Έναρξη γύρου",
        pause: "Παύση",
        continue: "Συνέχεια"
      },
      result: {
        kicker: (years) => `Απολογισμός μετά από ${years} έτη`,
        newTerm: "Νέα θητεία",
        plotsAria: "Διαγράμματα πορείας"
      },
      messages: {
        distributeAll: "Μοίρασε όλους τους πόντους δράσης και μετά ξεκίνησε τον γύρο.",
        allAllocated: "Όλοι οι πόντοι δράσης μοιράστηκαν. Ο γύρος μπορεί να ξεκινήσει.",
        controlView: "Στον πίνακα μπορείς να μοιράσεις πόντους δράσης.",
        effectsView: "Εδώ βλέπεις τις αλυσίδες επιδράσεων των αποφάσεών σου.",
        allocateBeforeStart: "Μοίρασε όλους τους πόντους δράσης πριν ξεκινήσεις τον γύρο.",
        effectsRunning: "Η αλυσίδα επιδράσεων τρέχει. Η αλλαγή προβολής είναι κλειδωμένη ως το τέλος.",
        allocateBeforeFastForward: "Μοίρασε όλους τους πόντους δράσης πριν κάνεις άμεσο υπολογισμό.",
        yearActionPoints: (round, points) => `Έτος ${round}: έχεις ${points} πόντους δράσης στη διάθεσή σου.`,
        paused: "Η προσομοίωση έχει παύσει.",
        runningAgain: "Η αλυσίδα επιδράσεων συνεχίζεται.",
        initialActionPoints: (points) => `Στην αρχή έχεις ${points} πόντους δράσης. Μοίρασέ τους στον πίνακα.`,
        debugFlow: "Προβολή δοκιμής: ενεργή επίδραση στην ποιότητα ζωής.",
        debugEffects: "Προβολή δοκιμής: αλυσίδες επιδράσεων χωρίς προσομοίωση.",
        debugControl: "Προβολή δοκιμής: ο πίνακας είναι έτοιμος."
      },
      simulation: {
        controlTitle: "Πίνακας",
        direct: (label) => `Άμεση ρύθμιση: ${label}`,
        affects: (from, to) => `${from} επηρεάζει ${to}`
      },
      evaluation: {
        dismissed: {
          title: "Καθαίρεση",
          text: "Η πολιτική στήριξη έπεσε κάτω από το μηδέν. Το κοινοβούλιο σου αφαιρεί την εντολή πριν περάσουν τα 12 χρόνια."
        },
        stable: {
          title: "Σταθερή στροφή",
          text: "Η χώρα έχει ανακάμψει αισθητά. Ο πληθυσμός στηρίζει την πορεία, η ρύπανση μειώνεται και η ικανότητα δράσης διατηρείται."
        },
        shaky: {
          title: "Εύθραυστη σταθεροποίηση",
          text: "Δεν έχασες τη χώρα, αλλά τα συστήματα παραμένουν υπό πίεση. Μερικές αποφάσεις θα φανούν πραγματικά τα επόμενα χρόνια."
        },
        weak: {
          title: "Ανεπαρκής αντίδραση",
          text: "Η κατάσταση παραμένει κρίσιμη. Παραγωγή, περιβάλλον, ποιότητα ζωής και πληθυσμός τραβούν ακόμη προς διαφορετικές κατευθύνσεις."
        }
      }
    }
  };

  const metrics = [
    { key: "politik", label: "Politik", max: 32, color: "red", x: 3, y: 7, w: 20, h: 27, art: "parliament", image: "assets/images/metric-politik.jpg" },
    { key: "sanierung", label: "Sanierung", max: 32, color: "red", x: 28, y: 7, w: 20, h: 27, art: "fields", image: "assets/images/metric-sanierung.jpg", control: true },
    { key: "produktion", label: "Produktion", max: 32, color: "green", x: 53, y: 7, w: 20, h: 27, art: "factory", image: "assets/images/metric-produktion.jpg", control: true },
    { key: "umweltbelastung", label: "Umweltbelastung", max: 32, color: "orange", x: 78, y: 7, w: 20, h: 27, art: "dump", image: "assets/images/metric-umweltbelastung.jpg" },
    { key: "bevoelkerung", label: "Bevölkerung", max: 48, color: "green", x: 3, y: 47, w: 22, h: 27, art: "city", image: "assets/images/metric-bevoelkerung.jpg" },
    { key: "vermehrungsrate", label: "Vermehrungsrate", max: 32, color: "orange", x: 27, y: 47, w: 21, h: 27, art: "home", image: "assets/images/metric-vermehrungsrate.jpg" },
    { key: "lebensqualitaet", label: "Lebensqualität", max: 32, color: "red", x: 51, y: 47, w: 22, h: 27, art: "park", image: "assets/images/metric-lebensqualitaet.jpg", control: true },
    { key: "aufklaerung", label: "Bildung", max: 32, color: "orange", x: 76, y: 47, w: 22, h: 27, art: "school", image: "assets/images/metric-aufklaerung.jpg", control: true }
  ];

  const metricTooltips = {
    politik: "Wenn Menschen Sicherheit, Arbeit und Hoffnung spüren, trauen sie der Regierung mehr zu. Wird der Alltag zu hart, kippt Vertrauen schnell in Unmut.",
    sanierung: "Sanierung ist Vorsorge: reparieren, bevor Schäden riesig werden. Gute Kreisläufe und saubere Technik halten Umweltprobleme kleiner.",
    produktion: "Ein stärkerer Wirtschaftsmotor hilft zuerst: mehr Arbeit, mehr Waren, mehr Geld. Wird er zu heiß gefahren, entstehen Probleme, die anderswo Punkte kosten.",
    umweltbelastung: "Natur kann eine Weile viel abfedern. Ist der Puffer voll, trifft die Belastung plötzlich Gesundheit, Wohnen und Lebensqualität.",
    bevoelkerung: "Viele Menschen können ein Land lebendig und stark machen. Wenn Platz, Arbeit und Versorgung nicht mithalten, wird aus Nähe schnell Gedränge.",
    vermehrungsrate: "Viele Geburten können ein Land wachsen lassen, aber nur wenn Versorgung und Chancen mitwachsen. Bildung und bessere Lebensplanung verändern oft, wie groß Familien werden.",
    lebensqualitaet: "Wenn Menschen gut leben können, bleiben sie eher und vertrauen der Politik mehr. Fällt die Lebensqualität zu tief, schrumpfen Hoffnung, Rückhalt und Bevölkerung.",
    aufklaerung: "Wer mehr versteht, plant eher voraus: Gesundheit, Umwelt, Beruf und Familie. Das hebt oft die Lebensqualität, macht große Familien aber weniger selbstverständlich."
  };

  const metricByKey = metrics.reduce((map, metric) => {
    map[metric.key] = metric;
    return map;
  }, {});

  const effectDirections = {
    politik: 1,
    sanierung: 1,
    produktion: 1,
    umweltbelastung: -1,
    bevoelkerung: 1,
    vermehrungsrate: -1,
    lebensqualitaet: 1,
    aufklaerung: 1
  };

  const controlKeys = ["sanierung", "produktion", "lebensqualitaet", "aufklaerung"];

  const scenarios = {
    industrieland: {
      label: "Industrieland",
      description: "Hohe Produktion, bessere Bildung, spürbare Umweltbelastung.",
      actionPoints: 8,
      values: {
        politik: 2,
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
        politik: 2,
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
        politik: 2,
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
    vermehrungsrate: { meter: [350, 525, 32, 175], label: [392, 588, 248, 50], value: [392, 704] },
    lebensqualitaet: { meter: [650, 490, 32, 205], label: [703, 545, 265, 50], value: [703, 700] },
    aufklaerung: { meter: [1030, 500, 32, 205], label: [1082, 558, 212, 50], value: [1082, 704] }
  };

  const arrowPaths = {
    "sanierung->umweltbelastung": "M500 220 L500 90 L1082 90 L1082 138",
    "sanierung->sanierung": "M504 304 C520 338 494 366 456 366 C430 366 410 354 392 336",
    "produktion->produktion": "M812 306 L812 342 L724 342",
    "produktion->umweltbelastung": "M945 280 L1050 280",
    "umweltbelastung->umweltbelastung": "M1212 252 L1212 292 C1185 318 1135 320 1098 296",
    "umweltbelastung->lebensqualitaet": "M1210 295 L1210 445 L684 445 L684 502",
    "aufklaerung->lebensqualitaet": "M1080 595 L970 595",
    "aufklaerung->vermehrungsrate": "M1210 610 L1210 760 L420 760 C392 760 370 742 370 704",
    "aufklaerung->aufklaerung": "M1168 610 L1168 650 C1138 678 1100 690 1062 674",
    "lebensqualitaet->politik": "M660 600 L660 400 L40 400 L40 280",
    "lebensqualitaet->lebensqualitaet": "M764 618 C740 660 720 668 684 642",
    "lebensqualitaet->vermehrungsrate": "M682 690 L382 690",
    "vermehrungsrate->bevoelkerung": "M382 628 L32 628",
    "bevoelkerung->lebensqualitaet": "M144 590 L144 480 L545 480 L545 545 L650 545"
  };

  const initialLanguageValue = initialLanguage();
  const state = {
    screen: "intro",
    view: "control",
    language: initialLanguageValue,
    leaderName: "",
    scenarioKey: "industrieland",
    round: 1,
    actionPoints: scenarios.industrieland.actionPoints,
    running: false,
    paused: false,
    resultReason: "",
    message: i18n(initialLanguageValue).messages.distributeAll,
    activeStep: null,
    simulation: null,
    showPlots: false,
    allocations: blankAllocations(),
    history: [],
    initialValues: initialValues("industrieland"),
    values: initialValues("industrieland")
  };

  let timer = null;
  let tooltipIntent = null;
  let tooltipHideTimer = null;
  let tooltipClickSuppression = { trigger: null, until: 0 };
  applyLanguage();

  function initialLanguage() {
    try {
      const savedLanguage = window.localStorage.getItem("oekolopoly-language");
      if (languageOptions[savedLanguage]) return savedLanguage;
    } catch (error) {
      return DEFAULT_LANGUAGE;
    }

    return DEFAULT_LANGUAGE;
  }

  function i18n(language) {
    return translations[language] || translations[DEFAULT_LANGUAGE];
  }

  function text() {
    return i18n(state.language);
  }

  function persistLanguage() {
    try {
      window.localStorage.setItem("oekolopoly-language", state.language);
    } catch (error) {
      // Language selection should still work when storage is unavailable.
    }
  }

  function applyLanguage() {
    const language = languageOptions[state.language] ? state.language : DEFAULT_LANGUAGE;
    document.documentElement.lang = languageOptions[language].htmlLang;
  }

  function syncLeaderNameInput() {
    const nameInput = app.querySelector("input[name='leaderName']");
    if (nameInput) state.leaderName = nameInput.value;
  }

  function setLanguage(language) {
    if (!languageOptions[language]) return;

    syncLeaderNameInput();
    state.language = language;
    applyLanguage();
    persistLanguage();
    render();
  }

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

  function canStartRound() {
    return state.round >= 5 || remainingActionPoints() === 0;
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

  function renderDeltaBadge(value) {
    const tone = value >= 0 ? "positive" : "negative";
    return `<strong class="delta-badge ${tone}">${signed(value)}</strong>`;
  }

  function metricLabel(key) {
    const labels = text().metrics;
    return labels[key] || (metricByKey[key] ? metricByKey[key].label : key);
  }

  function effectScoreForLevel(key, level, baseValues) {
    const values = Object.assign({}, baseValues, { [key]: level });

    return relations.reduce((score, relation) => {
      const [from, to, curveKey] = relation;
      if (from !== key) return score;

      const direction = effectDirections[to] || 1;
      const delta = curves[curveKey](level, { values });
      return score + (direction * delta);
    }, 0);
  }

  function nearestEffectChange(key) {
    const outgoingRelations = relations.filter(([from]) => from === key);
    if (!outgoingRelations.length) return { hasEffects: false };

    const baseValues = valuesAfterAllocations(state.values, state.allocations);
    const currentLevel = clampMetricValue(key, Math.round(baseValues[key]));
    const metric = metricByKey[key];
    const min = metricMinValue(key);
    const max = metric.max;
    const baseScore = effectScoreForLevel(key, currentLevel, baseValues);
    let better = null;
    let worse = null;

    for (let distance = 1; currentLevel - distance >= min || currentLevel + distance <= max; distance += 1) {
      const candidates = [currentLevel + distance, currentLevel - distance]
        .filter((level) => level >= min && level <= max);

      candidates.forEach((level) => {
        const score = effectScoreForLevel(key, level, baseValues);

        if (better === null && score > baseScore) better = level;
        if (worse === null && score < baseScore) worse = level;
      });

      if (better !== null && worse !== null) break;
    }

    return {
      hasEffects: true,
      better,
      worse
    };
  }

  function effectChangeText(key) {
    const change = nearestEffectChange(key);
    if (!change.hasEffects) return "Wirkung: keine direkte Wirkung";

    const better = change.better === null ? "nicht besser" : `ab ${change.better} besser`;
    const worse = change.worse === null ? "nicht schlechter" : `ab ${change.worse} schlechter`;
    return `Wirkung: ${better} / ${worse}`;
  }

  function renderStationTooltip(key, tooltipText) {
    const analysisText = effectChangeText(key);

    return `
      <p class="station-tooltip" id="station-tooltip-${key}" role="tooltip" data-tooltip-version="situative-effects">
        ${escapeHtml(tooltipText)}
        <br>
        <strong class="station-tooltip-analysis">${escapeHtml(analysisText)}</strong>
      </p>
    `;
  }

  function consoleLabel(key) {
    return text().metricShort[key] || metricLabel(key);
  }

  function scenarioLabel(key) {
    const scenario = text().scenarios[key];
    return scenario ? scenario.label : scenarios[key].label;
  }

  function scenarioDescription(key) {
    const scenario = text().scenarios[key];
    return scenario ? scenario.description : scenarios[key].description;
  }

  function metricMinValue(key) {
    return key === "politik" ? -10 : 0;
  }

  function clampMetricValue(key, value) {
    const metric = metricByKey[key];
    return clamp(value, metricMinValue(key), metric.max);
  }

  function normalizedValue(key, value) {
    const metric = metricByKey[key];
    return clamp((value / metric.max) * 100, 0, 100);
  }

  function valuesAfterAllocations(values, allocations) {
    const nextValues = Object.assign({}, values);

    controlKeys.forEach((key) => {
      const delta = allocations[key] || 0;
      nextValues[key] = clampMetricValue(key, nextValues[key] + delta);
    });

    return nextValues;
  }

  function metricHistoryPoints(metric) {
    const points = [{ step: 0, value: state.initialValues[metric.key] }];
    let previousValues = Object.assign({}, state.initialValues);

    state.history.forEach((entry) => {
      const allocationValues = entry.allocationValues
        ? entry.allocationValues
        : valuesAfterAllocations(previousValues, entry.allocations || blankAllocations());

      points.push({ step: entry.round * 2 - 1, value: allocationValues[metric.key] });
      points.push({ step: entry.round * 2, value: entry.values[metric.key] });
      previousValues = Object.assign({}, entry.values);
    });

    if (!state.running && state.screen === "game" && state.round <= MAX_ROUNDS) {
      const currentStep = state.round * 2 - 1;
      const hasCurrentPoint = points.some((point) => point.step === currentStep);
      const allocationValues = valuesAfterAllocations(state.values, state.allocations);

      if (!hasCurrentPoint && usedActionPoints(state.allocations) > 0) {
        points.push({ step: currentStep, value: allocationValues[metric.key] });
      }
    }

    return points;
  }

  function renderStationPlot(metric) {
    const label = metricLabel(metric.key);
    const points = metricHistoryPoints(metric);
    const plot = {
      left: 28,
      right: 268,
      top: 12,
      bottom: 115
    };
    const minValue = 0;
    const maxValue = metric.max;
    const xForStep = (step) => plot.left + ((plot.right - plot.left) * step / (MAX_ROUNDS * 2));
    const yForValue = (value) => {
      const ratio = (clamp(value, minValue, maxValue) - minValue) / (maxValue - minValue || 1);
      return plot.bottom - ((plot.bottom - plot.top) * ratio);
    };
    const path = points.map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${xForStep(point.step).toFixed(1)} ${yForValue(point.value).toFixed(1)}`;
    }).join(" ");
    const currentValue = points.length ? Math.round(points[points.length - 1].value) : Math.round(state.values[metric.key]);

    return `
      <svg class="station-plot" viewBox="0 0 280 144" role="img" aria-label="${text().plots.aria(label)}">
        <rect class="plot-panel" x="1" y="1" width="278" height="142"></rect>
        ${Array.from({ length: MAX_ROUNDS * 2 + 1 }, (_, step) => {
          const x = xForStep(step);
          const yearLine = step % 2 === 0;
          return `<line class="plot-step ${yearLine ? "is-year" : "is-half"}" x1="${x}" y1="${plot.top}" x2="${x}" y2="${plot.bottom}"></line>`;
        }).join("")}
        ${[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = plot.bottom - ((plot.bottom - plot.top) * ratio);
          return `<line class="plot-value-line" x1="${plot.left}" y1="${y}" x2="${plot.right}" y2="${y}"></line>`;
        }).join("")}
        <line class="plot-axis" x1="${plot.left}" y1="${plot.bottom}" x2="${plot.right}" y2="${plot.bottom}"></line>
        <line class="plot-axis" x1="${plot.left}" y1="${plot.top}" x2="${plot.left}" y2="${plot.bottom}"></line>
        ${path ? `<path class="plot-line plot-${metric.color}" d="${path}"></path>` : ""}
        ${points.map((point) => `<circle class="plot-point plot-${metric.color}" cx="${xForStep(point.step)}" cy="${yForValue(point.value)}" r="3.1"></circle>`).join("")}
        ${Array.from({ length: MAX_ROUNDS }, (_, index) => {
          const year = index + 1;
          const x = xForStep(year * 2 - 1);
          return `<text class="plot-year" x="${x}" y="135">${year}</text>`;
        }).join("")}
        <text class="plot-value-label" x="8" y="18">${currentValue}</text>
      </svg>
    `;
  }

  function render() {
    cancelTooltipIntent();
    hideStationTooltips();

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

  function renderLanguageSelector(placement) {
    const modifier = placement ? ` language-switcher-${placement}` : "";
    const name = `language-${placement || "main"}`;
    const label = text().languageLabel;

    return `
      <fieldset class="language-switcher${modifier}" aria-label="${label}">
        <legend>${label}</legend>
        ${Object.keys(languageOptions).map((key) => {
          const option = languageOptions[key];
          const checked = key === state.language ? "checked" : "";

          return `
            <label>
              <input type="radio" name="${name}" value="${key}" data-language-option ${checked}>
              <span>
                <strong>${option.code}</strong>
                <small>${option.label}</small>
              </span>
            </label>
          `;
        }).join("")}
      </fieldset>
    `;
  }

  function renderIntro() {
    const selectedScenario = scenarios[state.scenarioKey] || scenarios.schwellenland;
    const selectedScenarioKey = scenarios[state.scenarioKey] ? state.scenarioKey : "schwellenland";
    const copy = text().intro;

    app.innerHTML = `
      <section class="intro-screen" data-scenario="${state.scenarioKey}">
        <div class="intro-shade"></div>
        ${renderLanguageSelector("intro")}
        <div class="intro-copy">
          <p class="kicker">${copy.kicker}</p>
          <h1>Ökolopoly</h1>
          <p>${copy.description}</p>
          <form class="name-form" data-action="start-game">
            <label for="leader-name">${copy.leaderName}</label>
            <div class="name-row">
              <input id="leader-name" name="leaderName" maxlength="28" autocomplete="off" placeholder="${copy.namePlaceholder}" value="${escapeHtml(state.leaderName)}">
              <button type="submit">${copy.startTerm}</button>
            </div>
            <fieldset class="scenario-picker">
              <legend>${copy.chooseScenario}</legend>
              ${Object.keys(scenarios).map((key) => renderScenarioOption(key)).join("")}
            </fieldset>
            <div class="scenario-preview">
              <strong>${scenarioLabel(selectedScenarioKey)}</strong>
              <span>${scenarioDescription(selectedScenarioKey)}</span>
              <dl>
                ${renderScenarioPreviewRows(selectedScenario)}
              </dl>
            </div>
          </form>
        </div>
        <p class="intro-attribution">
          Diese neue Version knüpft an Frederic Vesters Ökolopoly an.
          Das kybernetische Umweltspiel erschien 1984 bei Ravensburger.
          Als Planspiel macht es Rückwirkungen erfahrbar und simuliert die Zusammenhänge zwischen Gesellschaft, Wirtschaft und Umwelt.
          <a href="impressum.html">Impressum</a>
        </p>
      </section>
    `;
  }

  function renderScenarioOption(key) {
    const checked = key === state.scenarioKey ? "checked" : "";

    return `
      <label class="scenario-option">
        <input type="radio" name="scenario" value="${key}" ${checked}>
        <span>${scenarioLabel(key)}</span>
      </label>
    `;
  }

  function renderScenarioPreviewRows(scenario) {
    const labels = text().scenarioPreview;
    const previewRows = [
      [labels.sanierung, scenario.values.sanierung],
      [labels.produktion, scenario.values.produktion],
      [labels.umweltbelastung, scenario.values.umweltbelastung],
      [labels.aufklaerung, scenario.values.aufklaerung],
      [labels.lebensqualitaet, scenario.values.lebensqualitaet],
      [labels.vermehrungsrate, scenario.values.vermehrungsrate],
      [labels.bevoelkerung, scenario.values.bevoelkerung],
      [labels.politik, scenario.values.politik],
      [labels.actionPoints, scenario.actionPoints]
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
      </section>
    `;
  }

  function renderHeader() {
    const copy = text();
    const viewLabel = state.view === "control" ? copy.views.effects : copy.views.control;
    const viewIcon = state.view === "control" ? "⇄" : "▦";
    const disabled = state.running ? "disabled" : "";
    const left = remainingActionPoints();
    const startDisabled = state.running || !canStartRound() ? "disabled" : "";
    const fastForwardDisabled = state.running || canStartRound() ? "" : "disabled";

    return `
      <header class="topline">
        <div class="top-title">
          <p class="system-name">Ökolopoly</p>
          <h2>${copy.header.roundTitle(escapeHtml(state.leaderName), state.round, MAX_ROUNDS)}</h2>
          <p class="top-hint">${escapeHtml(state.message)}</p>
        </div>
        <div class="top-actions">
          <button class="icon-button quiet" data-action="restart" title="${copy.header.reset}" aria-label="${copy.header.reset}">
            <span>↺</span>
            <small>${copy.header.reset}</small>
          </button>
          <div class="top-ap-compact" aria-label="${copy.header.actionPoints}">
            <span>${copy.header.actionPoints}</span>
            <output>${left}</output>
          </div>
          <button class="icon-button" data-action="toggle-view" ${disabled} title="${copy.header.switchView}" aria-label="${copy.header.switchView}">
            <span>${viewIcon}</span>
            <small>${viewLabel}</small>
          </button>
          <button class="icon-button play-button" data-action="start-simulation" ${startDisabled} title="${copy.header.startRound}" aria-label="${copy.header.startRound}">
            <span>▶</span>
            <small>${copy.header.start}</small>
          </button>
          <button class="icon-button fast-forward-button" data-action="fast-forward" ${fastForwardDisabled} title="${copy.header.fastForward}" aria-label="${copy.header.fastForward}">
            <span>&gt;&gt;</span>
            <small>${copy.header.immediately}</small>
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

  function renderMetricIcon(metric) {
    const icons = {
      parliament: `
        <path d="M13 28h38"></path>
        <path d="M18 28v24M32 28v24M46 28v24"></path>
        <path d="M10 52h44"></path>
        <path d="M14 24 32 12l18 12"></path>
      `,
      fields: `
        <path d="M13 50c14-22 25-32 39-34-2 16-11 29-33 38"></path>
        <path d="M13 50c10-2 20-9 30-24"></path>
        <path d="M15 51l-6 6"></path>
      `,
      factory: `
        <path d="M11 50V25l14 8v-8l14 8V17h10v33"></path>
        <path d="M11 50h42"></path>
        <path d="M20 44h4M31 44h4M42 44h4"></path>
      `,
      dump: `
        <path d="M12 18 19 8l10 7-7 10Z"></path>
        <path d="M22 21h15c7 0 11 4 14 11l4 10"></path>
        <path d="M14 28c4 8 5 17 2 27"></path>
        <path d="M29 31c-5 7-7 15-6 24"></path>
        <path d="M44 33c-4 7-6 14-5 22"></path>
        <path d="M8 48c10-4 19-4 30 0 7 2 13 2 19-1"></path>
        <path d="M9 56c10-4 19-4 30 0 7 2 13 2 19-1"></path>
      `,
      city: `
        <circle cx="22" cy="22" r="8"></circle>
        <circle cx="43" cy="24" r="6"></circle>
        <path d="M9 52c2-10 7-16 13-16s11 6 13 16"></path>
        <path d="M34 50c2-8 6-12 12-12 5 0 9 4 11 12"></path>
      `,
      home: `
        <circle cx="21" cy="15" r="5"></circle>
        <circle cx="38" cy="15" r="5"></circle>
        <path d="M13 38v-9c0-5 3-8 8-8s8 3 8 8v9"></path>
        <path d="M31 38v-9c0-5 3-8 8-8s8 3 8 8v9"></path>
        <path d="M10 47c15-3 30-8 47-23"></path>
        <path d="M57 24h-9M57 24l-3 9"></path>
        <path d="M12 57v-9h7v9"></path>
        <path d="M29 57V44h7v13"></path>
        <path d="M46 57V37h7v20"></path>
      `,
      park: `
        <path d="M32 55s20-12 20-30a12 12 0 0 0-20-8 12 12 0 0 0-20 8c0 18 20 30 20 30Z"></path>
      `,
      school: `
        <path d="M10 21 32 11l22 10-22 10-22-10Z"></path>
        <path d="M18 27v14c8 6 20 6 28 0V27"></path>
        <path d="M54 21v17"></path>
      `
    };

    return `
      <svg class="metric-icon" viewBox="0 0 64 64" aria-hidden="true">
        ${icons[metric.art] || icons.fields}
      </svg>
    `;
  }

  function renderStation(metric) {
    const label = metricLabel(metric.key);
    const value = state.values[metric.key];
    const percent = normalizedValue(metric.key, value);
    const planned = state.allocations[metric.key] || 0;
    const controlClass = metric.control ? "is-adjustable" : "";
    const isPlotVisible = state.showPlots;
    const artLabel = isPlotVisible
      ? text().plots.showImage(label)
      : text().plots.showPlot(label);
    const controls = metric.control && !state.running
      ? `
        <div class="station-controls">
          <button data-action="adjust" data-key="${metric.key}" data-delta="1" aria-label="${text().controls.increase(label)}">+</button>
          <button data-action="adjust" data-key="${metric.key}" data-delta="-1" aria-label="${text().controls.decrease(label)}">&minus;</button>
        </div>
      `
      : "";
    const tooltipText = metricTooltips[metric.key] || "";
    const tooltipId = `station-tooltip-${metric.key}`;
    const tooltipAttributes = tooltipText
      ? ` data-tooltip-trigger aria-describedby="${tooltipId}"`
      : "";

    return `
      <article class="station ${controlClass} station-${metric.art}" style="left:${metric.x}%; top:${metric.y}%; width:${metric.w}%; height:${metric.h}%;">
        <div class="meter meter-${metric.color}" aria-label="${label}: ${Math.round(value)}">
          <div class="meter-fill" style="height:${percent}%"></div>
          <span class="meter-value">${Math.round(value)}</span>
        </div>
        <button class="station-art station-art-button ${isPlotVisible ? "is-plot-visible" : ""}" data-action="toggle-plot" data-key="${metric.key}" aria-label="${artLabel}"${tooltipAttributes}>
          ${isPlotVisible ? renderStationPlot(metric) : renderMetricIcon(metric)}
        </button>
        ${tooltipText ? renderStationTooltip(metric.key, tooltipText) : ""}
        <h3>${label}</h3>
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
    const activeFlowTone = state.activeStep && state.activeStep.delta >= 0 ? "positive" : "negative";

    return `
      <div class="retro-board effects-board">
        <svg class="effect-diagram" viewBox="0 0 1403 790" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${text().effects.aria}">
          <defs>
            <marker id="arrow-head" viewBox="0 0 34 34" refX="32" refY="17" markerWidth="34" markerHeight="34" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
              <path d="M 1 1 L 33 17 L 1 33 z"></path>
            </marker>
          </defs>
          ${Object.keys(arrowPaths).map((key) => `
            <path class="effect-line ${activeRelation === key ? "active" : ""}" data-relation="${key}" d="${arrowPaths[key]}"></path>
          `).join("")}
          ${activePath ? `
            <path class="effect-flow effect-flow-${activeFlowTone}" d="${activePath}"></path>
            <path class="effect-flow effect-flow-white" d="${activePath}"></path>
          ` : ""}
          ${metrics.map(renderEffectNode).join("")}
        </svg>
      </div>
    `;
  }

  function renderEffectNode(metric) {
    const node = effectNodes[metric.key];
    const label = metricLabel(metric.key);
    const value = state.values[metric.key];
    const percent = normalizedValue(metric.key, value);
    const activeMetricStep = state.activeStep && state.activeStep.to === metric.key && Number.isFinite(state.activeStep.fromValue)
      ? state.activeStep
      : null;
    const fromPercent = activeMetricStep
      ? normalizedValue(metric.key, activeMetricStep.fromValue)
      : percent;
    const [meterX, meterY, meterW, meterH] = node.meter;
    const [labelX, labelY, labelW, labelH] = node.label;
    const [valueX, valueY] = node.value;
    const fillHeight = Math.max(4, (meterH - 8) * percent / 100);
    const fillY = meterY + meterH - 4 - fillHeight;
    const fromFillHeight = Math.max(4, (meterH - 8) * fromPercent / 100);
    const fromFillY = meterY + meterH - 4 - fromFillHeight;
    const fillClass = activeMetricStep ? `is-changing ${activeMetricStep.delta >= 0 ? "is-rising" : "is-falling"}` : "";
    const fillAnimation = activeMetricStep ? `
      <animate attributeName="y" from="${fromFillY}" to="${fillY}" dur="1.25s" fill="freeze"></animate>
      <animate attributeName="height" from="${fromFillHeight}" to="${fillHeight}" dur="1.25s" fill="freeze"></animate>
    ` : "";
    const tickLines = [0.2, 0.4, 0.6, 0.8].map((tick) => {
      const y = meterY + meterH * tick;
      return `<line class="effect-meter-tick" x1="${meterX}" y1="${y}" x2="${meterX + meterW}" y2="${y}"></line>`;
    }).join("");

    return `
      <g class="effect-node node-${metric.key}">
        <rect class="effect-meter-shell" x="${meterX}" y="${meterY}" width="${meterW}" height="${meterH}" rx="16" ry="16"></rect>
        ${tickLines}
        <rect class="effect-meter-fill fill-${metric.color} ${fillClass}" x="${meterX + 5}" y="${fillY}" width="${meterW - 10}" height="${fillHeight}">
          ${fillAnimation}
        </rect>
        <rect class="effect-label-box" x="${labelX}" y="${labelY}" width="${labelW}" height="${labelH}" rx="12" ry="12"></rect>
        <text class="effect-label-text" x="${labelX + 14}" y="${labelY + 33}">${escapeHtml(label)}</text>
        <text class="effect-value-text" x="${valueX}" y="${valueY}">${Math.round(value)}</text>
      </g>
    `;
  }

  function renderBottomBar() {
    const copy = text();
    const left = remainingActionPoints();
    const startDisabled = state.running || !canStartRound() ? "disabled" : "";
    const pauseDisabled = state.running ? "" : "disabled";
    const bottomToggleLabel = state.view === "control" ? copy.views.state : copy.views.control;
    const activeText = state.activeStep
      ? renderDeltaBadge(state.activeStep.delta)
      : escapeHtml(state.message);

    return `
      <footer class="bottom-console">
        <section class="ap-display">
          <h3>${copy.header.actionPoints}</h3>
          <output>${left}</output>
        </section>
        <section class="allocation-list" aria-label="${copy.bottom.allocatedActionPoints}">
          ${controlKeys.map((key) => `
            <div>
              <span>${consoleLabel(key)}</span>
              <strong>${signed(state.allocations[key])}</strong>
            </div>
          `).join("")}
        </section>
        <section class="console-message">
          <p>${activeText}</p>
        </section>
        <section class="round-actions">
          <button data-action="toggle-view" ${state.running ? "disabled" : ""}>${bottomToggleLabel}</button>
          <button data-action="start-simulation" ${startDisabled}>${copy.bottom.startRound}</button>
          <button data-action="pause" ${pauseDisabled}>${state.paused ? copy.bottom.continue : copy.bottom.pause}</button>
        </section>
      </footer>
    `;
  }

  function renderResult() {
    const copy = text();
    const evaluation = evaluateGame();
    const resultOutcome = state.resultReason === "dismissed" ? "fail" : "success";
    const resultTone = evaluation.tone || resultOutcome;
    app.innerHTML = `
      <section class="result-screen" data-scenario="${state.scenarioKey}" data-outcome="${resultOutcome}" data-result-tone="${resultTone}">
        <div class="result-panel" data-result-tone="${resultTone}">
          <div class="result-summary-panel">
            <div class="result-panel-top">
              <p class="kicker">${copy.result.kicker(state.history.length)}</p>
              <button class="result-restart-top" data-action="restart">${copy.result.newTerm}</button>
            </div>
            <h1>${evaluation.title}</h1>
            <p>${evaluation.text}</p>
            <dl class="result-grid">
              ${metrics.map((metric) => `
                <div>
                  <dt>${metricLabel(metric.key)}</dt>
                  <dd>${Math.round(state.values[metric.key])}</dd>
                </div>
              `).join("")}
            </dl>
          </div>
          <div class="result-diagram-panel">
            <div class="result-plots" aria-label="${copy.result.plotsAria}">
              ${metrics.map((metric) => `
                <article class="result-plot-card">
                  <h2>${metricLabel(metric.key)}</h2>
                  <div class="result-plot-frame">
                    ${renderStationPlot(metric)}
                  </div>
                </article>
              `).join("")}
            </div>
            <button data-action="restart">${copy.result.newTerm}</button>
          </div>
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
    state.message = canStartRound()
      ? text().messages.allAllocated
      : text().messages.distributeAll;
    render();
  }

  function toggleView() {
    if (state.running) return;
    state.view = state.view === "control" ? "effects" : "control";
    state.message = state.view === "control"
      ? text().messages.controlView
      : text().messages.effectsView;
    render();
  }

  function startSimulation() {
    if (state.running) return;

    if (!canStartRound()) {
      state.message = text().messages.allocateBeforeStart;
      render();
      return;
    }

    state.view = "effects";
    state.running = true;
    state.paused = false;
    state.activeStep = null;
    state.simulation = buildSimulation();
    state.message = text().messages.effectsRunning;
    render();
    scheduleNextStep();
  }

  function fastForwardSimulation() {
    if (!state.running) {
      if (!canStartRound()) {
        state.message = text().messages.allocateBeforeFastForward;
        render();
        return;
      }

      state.running = true;
      state.paused = false;
      state.activeStep = null;
      state.simulation = buildSimulation();
    }

    if (!state.simulation) return;

    clearTimeout(timer);
    state.activeStep = null;
    finishRound();
  }

  function buildSimulation() {
    const startValues = Object.assign({}, state.values);
    const draft = Object.assign({}, state.values);
    const steps = [];

    controlKeys.forEach((key) => {
      const delta = state.allocations[key];
      if (!delta) return;
      draft[key] = clampMetricValue(key, draft[key] + delta);
      steps.push({
        type: "allocation",
        from: null,
        to: key,
        delta,
        title: text().simulation.controlTitle,
        text: text().simulation.direct(metricLabel(key))
      });
    });

    const allocationValues = Object.assign({}, draft);

    relations.forEach(([from, to, curveKey]) => {
      const context = { values: draft };
      const delta = curves[curveKey](draft[from], context);
      if (!delta) return;

      draft[to] = clampMetricValue(to, draft[to] + delta);
      steps.push({
        type: "curve",
        from,
        to,
        delta,
        curveKey,
        title: curveKey,
        text: text().simulation.affects(metricLabel(from), metricLabel(to))
      });
    });

    const actionPointPreview = calculateNextActionPoints(draft);

    return {
      index: 0,
      steps,
      startValues,
      allocationValues,
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

      const fromValue = state.values[step.to];
      const toValue = clampMetricValue(step.to, fromValue + step.delta);
      step.fromValue = fromValue;
      step.toValue = toValue;
      state.values[step.to] = toValue;
      state.activeStep = step;
      sim.index += 1;
      render();
      scheduleNextStep();
    }, state.activeStep ? 1520 : 960);
  }

  function finishRound() {
    clearTimeout(timer);
    const sim = state.simulation;

    state.values = Object.assign({}, sim.finalValues);
    state.actionPoints = sim.nextActionPoints;
    state.history.push({
      round: state.round,
      beforeValues: Object.assign({}, sim.startValues),
      allocationValues: Object.assign({}, sim.allocationValues),
      allocations: Object.assign({}, state.allocations),
      values: Object.assign({}, state.values),
      actionPointDetails: sim.actionPointDetails
    });

    state.activeStep = null;
    state.running = false;
    state.paused = false;
    state.simulation = null;
    state.allocations = blankAllocations();

    if (state.values.politik < 0) {
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
    state.message = text().messages.yearActionPoints(state.round, state.actionPoints);
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
      ? text().messages.paused
      : text().messages.runningAgain;
    render();
    scheduleNextStep();
  }

  function evaluateGame() {
    const values = state.values;
    const copy = text().evaluation;

    if (state.resultReason === "dismissed") {
      return Object.assign({ tone: "fail" }, copy.dismissed);
    }

    const score = values.politik + values.lebensqualitaet + values.sanierung + values.aufklaerung
      + Math.max(0, 32 - values.umweltbelastung)
      + Math.max(0, 28 - values.vermehrungsrate);

    if (score >= 105) {
      return Object.assign({ tone: "stable" }, copy.stable);
    }

    if (score >= 78) {
      return Object.assign({ tone: "shaky" }, copy.shaky);
    }

    return Object.assign({ tone: "weak" }, copy.weak);
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
    state.message = text().messages.distributeAll;
    state.activeStep = null;
    state.simulation = null;
    state.showPlots = false;
    state.allocations = blankAllocations();
    state.history = [];
    state.initialValues = initialValues(state.scenarioKey);
    state.values = initialValues(state.scenarioKey);
    render();
  }

  function tooltipTriggerFromEvent(event) {
    return event.target.closest ? event.target.closest("[data-tooltip-trigger]") : null;
  }

  function relatedTargetInside(trigger, relatedTarget) {
    return relatedTarget instanceof Node && trigger.contains(relatedTarget);
  }

  function cancelTooltipIntent() {
    if (tooltipIntent && tooltipIntent.timer) {
      clearTimeout(tooltipIntent.timer);
    }

    tooltipIntent = null;
  }

  function hideStationTooltips() {
    if (tooltipHideTimer) {
      clearTimeout(tooltipHideTimer);
      tooltipHideTimer = null;
    }

    app.querySelectorAll(".station.is-tooltip-visible").forEach((station) => {
      station.classList.remove("is-tooltip-visible");
    });
  }

  function scheduleTooltipHide(delay) {
    if (tooltipHideTimer) clearTimeout(tooltipHideTimer);
    tooltipHideTimer = setTimeout(hideStationTooltips, delay);
  }

  function showStationTooltip(trigger) {
    const station = trigger.closest(".station");
    if (!station) return;

    hideStationTooltips();
    station.classList.add("is-tooltip-visible");

    if (tooltipIntent && tooltipIntent.trigger === trigger) {
      tooltipIntent.shown = true;
      tooltipIntent.timer = null;
    }
  }

  function startTooltipIntent(trigger, event) {
    if (state.screen !== "game" || state.view !== "control") return;
    if (!trigger || trigger.disabled) return;
    if (tooltipIntent && tooltipIntent.trigger === trigger && tooltipIntent.pointerType === event.pointerType) return;

    cancelTooltipIntent();
    if (event.pointerType === "mouse") hideStationTooltips();
    if (tooltipHideTimer) {
      clearTimeout(tooltipHideTimer);
      tooltipHideTimer = null;
    }

    tooltipIntent = {
      trigger,
      pointerId: event.pointerId,
      pointerType: event.pointerType || "mouse",
      startX: event.clientX,
      startY: event.clientY,
      shown: false,
      timer: setTimeout(() => showStationTooltip(trigger), TOOLTIP_DELAY)
    };
  }

  function suppressNextTooltipClick(trigger) {
    tooltipClickSuppression = {
      trigger,
      until: Date.now() + 900
    };
  }

  function consumeSuppressedTooltipClick(event) {
    const { trigger, until } = tooltipClickSuppression;
    if (!trigger || Date.now() > until) return false;
    if (trigger === event.target || trigger.contains(event.target)) {
      tooltipClickSuppression = { trigger: null, until: 0 };
      return true;
    }

    return false;
  }

  function handleTooltipMove(event) {
    if (!tooltipIntent || tooltipIntent.pointerType === "mouse" || tooltipIntent.pointerId !== event.pointerId) return;

    const moved = Math.hypot(event.clientX - tooltipIntent.startX, event.clientY - tooltipIntent.startY);
    if (moved <= TOOLTIP_MOVE_TOLERANCE) return;

    const wasShown = tooltipIntent.shown;
    cancelTooltipIntent();
    if (wasShown) hideStationTooltips();
  }

  function releaseTooltipIntent(event) {
    if (!tooltipIntent || tooltipIntent.pointerId !== event.pointerId) return;

    const { trigger, shown, pointerType } = tooltipIntent;
    cancelTooltipIntent();

    if (shown && pointerType !== "mouse") {
      suppressNextTooltipClick(trigger);
      scheduleTooltipHide(TOOLTIP_RELEASE_VISIBLE_MS);
      return;
    }

    if (pointerType !== "mouse") hideStationTooltips();
  }

  app.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-action='start-game']");
    if (!form) return;

    event.preventDefault();
    const data = new FormData(form);
    const scenarioKey = String(data.get("scenario") || "schwellenland");
    state.leaderName = String(data.get("leaderName") || "").trim() || text().defaults.leaderName;
    state.scenarioKey = scenarios[scenarioKey] ? scenarioKey : "schwellenland";
    state.actionPoints = initialActionPoints(state.scenarioKey);
    state.initialValues = initialValues(state.scenarioKey);
    state.values = Object.assign({}, state.initialValues);
    state.allocations = blankAllocations();
    state.showPlots = false;
    state.screen = "game";
    state.view = "control";
    state.message = text().messages.initialActionPoints(state.actionPoints);
    render();
  });

  app.addEventListener("pointerover", (event) => {
    if (event.pointerType !== "mouse") return;

    const trigger = tooltipTriggerFromEvent(event);
    if (!trigger || relatedTargetInside(trigger, event.relatedTarget)) return;

    startTooltipIntent(trigger, event);
  });

  app.addEventListener("pointerout", (event) => {
    if (event.pointerType !== "mouse") return;

    const trigger = tooltipTriggerFromEvent(event);
    if (!trigger || relatedTargetInside(trigger, event.relatedTarget)) return;

    if (tooltipIntent && tooltipIntent.trigger === trigger) cancelTooltipIntent();
    hideStationTooltips();
  });

  app.addEventListener("pointerdown", (event) => {
    const trigger = tooltipTriggerFromEvent(event);
    if (!trigger) {
      hideStationTooltips();
      return;
    }

    if (event.pointerType === "mouse") return;
    startTooltipIntent(trigger, event);
  });

  app.addEventListener("pointermove", handleTooltipMove);
  app.addEventListener("pointerup", releaseTooltipIntent);
  app.addEventListener("pointercancel", releaseTooltipIntent);

  app.addEventListener("contextmenu", (event) => {
    const trigger = tooltipTriggerFromEvent(event);
    if (!trigger) return;
    if (tooltipIntent || trigger.closest(".station.is-tooltip-visible")) event.preventDefault();
  });

  app.addEventListener("click", (event) => {
    if (consumeSuppressedTooltipClick(event)) {
      event.preventDefault();
      return;
    }

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
    } else if (action === "fast-forward") {
      fastForwardSimulation();
    } else if (action === "restart") {
      restart();
    } else if (action === "toggle-plot") {
      state.showPlots = !state.showPlots;
      render();
    }
  });

  app.addEventListener("change", (event) => {
    if (event.target.matches("[data-language-option]")) {
      setLanguage(event.target.value);
      return;
    }

    if (!event.target.matches("input[name='scenario']")) return;
    syncLeaderNameInput();
    const scenarioKey = event.target.value;
    state.scenarioKey = scenarios[scenarioKey] ? scenarioKey : "schwellenland";
    render();
  });

  function bootDebugView() {
    if (!["#play", "#effects", "#flow"].includes(window.location.hash)) return;

    state.screen = "game";
    state.leaderName = text().defaults.debugLeader;
    state.view = window.location.hash === "#play" ? "control" : "effects";
    if (window.location.hash === "#flow") {
      state.activeStep = {
        from: "lebensqualitaet",
        to: "lebensqualitaet",
        delta: 2,
        title: "f10-Lebensqualitaet-auf-Lebensqualitaet",
        fromValue: state.values.lebensqualitaet - 2,
        toValue: state.values.lebensqualitaet
      };
      state.running = true;
      state.paused = true;
    }
    state.message = window.location.hash === "#flow"
      ? text().messages.debugFlow
      : state.view === "effects"
        ? text().messages.debugEffects
        : text().messages.debugControl;
  }

  bootDebugView();
  render();
}());
