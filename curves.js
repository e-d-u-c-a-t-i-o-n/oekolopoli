(function () {
  "use strict";

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function interpolate(points, x) {
    if (x <= points[0][0]) return points[0][1];

    for (let i = 1; i < points.length; i += 1) {
      const left = points[i - 1];
      const right = points[i];
      if (x <= right[0]) {
        const span = right[0] - left[0] || 1;
        const ratio = (x - left[0]) / span;
        return left[1] + (right[1] - left[1]) * ratio;
      }
    }

    return points[points.length - 1][1];
  }

  function step(points, x) {
    let value = points[0][1];
    for (let i = 0; i < points.length; i += 1) {
      if (x >= points[i][0]) value = points[i][1];
    }
    return value;
  }

  function makeCurve(points, mode) {
    return function curve(input, context) {
      const x = Number.isFinite(input) ? input : 0;
      const y = mode === "linear" ? interpolate(points, x) : step(points, x);
      const scale = context && context.scale ? context.scale : 1;
      return Math.round(y * scale);
    };
  }

  function populationToActionPoints(population, context) {
    const values = context && context.values ? context.values : {};
    const production = values.produktion || 0;
    const lifeQuality = values.lebensqualitaet || 0;
    const supplyFactor = population > 0 ? (production + lifeQuality) / population : 1;
    const positive = step([
      [0, 0],
      [10, 1],
      [17, 2],
      [22, 3],
      [26, 4],
      [30, 5],
      [34, 6],
      [38, 7],
      [42, 8],
      [46, 9]
    ], population);

    if (supplyFactor >= 0.75) {
      return positive;
    }

    const negativeBase = Math.abs(step([
      [0, 0],
      [10, -1],
      [17, -2],
      [22, -3],
      [26, -4],
      [30, -5],
      [34, -6],
      [38, -7],
      [42, -8],
      [46, -9]
    ], population));
    const multiplier = supplyFactor >= 0.6 ? 1 : supplyFactor >= 0.45 ? 2 : supplyFactor >= 0.3 ? 3 : 4;

    return -negativeBase * multiplier;
  }

  function reproductionToPopulation(reproduction, context) {
    const population = context && context.values ? context.values.bevoelkerung || 0 : 0;
    const populationFactor = population >= 28 ? 3 : population >= 18 ? 2 : 1;
    return makeCurve([
      [0, -4],
      [4, -3],
      [8, -2],
      [12, -1],
      [16, 0],
      [17, 1],
      [21, 2],
      [26, 3],
      [32, 3]
    ], "step")(reproduction, { scale: populationFactor });
  }

  const curves = {
    "f1-Sanierung-auf-Umweltbelastung": makeCurve([
      [0, 2], [4, 0], [8, -1], [14, -2], [21, -3], [24, -4],
      [27, -5], [28, -6], [30, -7], [31, -8], [32, -9]
    ], "step"),

    "f2-Sanierung-auf-Sanierung": makeCurve([
      [0, 0], [22, -1], [24, -2], [26, -3], [28, -1], [30, 0],
      [32, 0]
    ], "step"),

    "f3-Produktion-auf-Produktion": makeCurve([
      [0, 0], [7, 1], [22, 2], [28, 1], [32, 1]
    ], "step"),

    "f4-Produktion-auf-Umweltbelastung": makeCurve([
      [0, 0], [5, 0], [6, 1], [9, 1], [10, 2], [13, 2],
      [15, 3], [16, 3], [18, 4], [19, 4], [20, 5], [21, 5],
      [22, 6], [23, 6], [24, 7], [25, 8], [26, 9], [27, 11],
      [28, 14], [29, 18], [30, 22], [32, 22]
    ], "linear"),

    "f5-Umweltbelastung-auf-Umweltbelastung": makeCurve([
      [0, 0], [5, -1], [15, -2], [21, -3], [25, 0], [32, 0]
    ], "step"),

    "f6-Umweltbelastung-auf-Lebensqualitaet": makeCurve([
      [0, 2], [1, 2], [3, 1], [8, 1], [9, 0], [11, 0],
      [12, -1], [15, -1], [16, -2], [18, -2], [19, -3], [20, -3],
      [21, -4], [22, -5], [23, -6], [24, -7], [25, -9],
      [26, -12], [27, -15], [28, -18], [29, -25], [32, -25]
    ], "linear"),

    "f7-Aufklaerung-auf-Aufklaerung": makeCurve([
      [0, 0], [3, -1], [6, 0], [15, 1], [22, 2], [25, 1],
      [29, 0], [32, 0]
    ], "step"),

    "f8-Aufklaerung-auf-Lebensqualitaet": makeCurve([
      [0, -2], [7, -1], [11, 0], [15, 1], [19, 2], [23, 3],
      [26, 4], [29, 5], [31, 6], [32, 6]
    ], "step"),

    "f9-Aufklaerung-auf-Vermehrungsrate": makeCurve([
      [0, 1], [2, 0], [8, 0], [10, -1], [14, -2],
      [18, -3], [23, -4], [28, -5], [32, -5]
    ], "step"),

    "f10-Lebensqualitaet-auf-Lebensqualitaet": makeCurve([
      [0, 0], [1, 1], [3, 1], [4, 0], [10, 0], [11, 1],
      [13, 1], [14, 2], [15, 1], [17, 0], [19, -1],
      [24, -2], [27, -1], [30, 0], [32, 0]
    ], "step"),

    "f11-Lebensqualitaet-auf-Vermehrungsrate": makeCurve([
      [0, -15], [1, -8], [3, -5], [6, 0], [10, 3],
      [12, 3], [13, 2], [21, 2], [22, 1], [32, 1]
    ], "linear"),

    "f12-Lebensqualitaet-auf-Politik": makeCurve([
      [0, -10], [1, -8], [2, -5], [4, -2], [6, 0], [9, 1],
      [12, 1], [13, 2], [20, 2], [21, 3], [24, 4], [27, 5],
      [30, 5], [32, 5]
    ], "linear"),

    "f13-Vermehrungsrate-auf-Bevoelkerung": reproductionToPopulation,

    "f14-Bevoelkerung-auf-Lebensqualitaet": makeCurve([
      [0, -5], [1, -2], [2, 0], [18, -1], [25, -2],
      [30, -3], [38, -4], [40, -5], [41, -6], [42, -7],
      [43, -8], [45, -10], [48, -10]
    ], "step"),

    "fA-Einfluss-der-Bevoelkerung": populationToActionPoints,

    "fB-Einfluss-der-Politik": makeCurve([
      [-10, -8], [-8, -5], [-6, -1], [0, 0], [7, 1],
      [21, 2], [30, 3], [40, 3]
    ], "step"),

    "fC-Einfluss-der-Produktion": makeCurve([
      [0, -4], [4, 0], [7, 2], [9, 3], [11, 4], [14, 5],
      [17, 6], [20, 7], [23, 8], [25, 9], [27, 11],
      [28, 0], [29, -5], [32, -5]
    ], "linear"),

    "fD-Einfluss-der-Lebensqualitaet": makeCurve([
      [0, -6], [3, -4], [5, 0], [7, 1], [9, 2], [18, 3],
      [23, 4], [27, 5], [32, 5]
    ], "step")
  };

  // Alias fuer die im Briefing einmal mit Leerzeichen genannte Schreibweise.
  curves["f3 Produktion-auf-Produktion"] = curves["f3-Produktion-auf-Produktion"];

  const relations = [
    ["sanierung", "umweltbelastung", "f1-Sanierung-auf-Umweltbelastung"],
    ["sanierung", "sanierung", "f2-Sanierung-auf-Sanierung"],
    ["produktion", "produktion", "f3-Produktion-auf-Produktion"],
    ["produktion", "umweltbelastung", "f4-Produktion-auf-Umweltbelastung"],
    ["umweltbelastung", "umweltbelastung", "f5-Umweltbelastung-auf-Umweltbelastung"],
    ["umweltbelastung", "lebensqualitaet", "f6-Umweltbelastung-auf-Lebensqualitaet"],
    ["aufklaerung", "aufklaerung", "f7-Aufklaerung-auf-Aufklaerung"],
    ["aufklaerung", "lebensqualitaet", "f8-Aufklaerung-auf-Lebensqualitaet"],
    ["aufklaerung", "vermehrungsrate", "f9-Aufklaerung-auf-Vermehrungsrate"],
    ["lebensqualitaet", "lebensqualitaet", "f10-Lebensqualitaet-auf-Lebensqualitaet"],
    ["lebensqualitaet", "vermehrungsrate", "f11-Lebensqualitaet-auf-Vermehrungsrate"],
    ["lebensqualitaet", "politik", "f12-Lebensqualitaet-auf-Politik"],
    ["vermehrungsrate", "bevoelkerung", "f13-Vermehrungsrate-auf-Bevoelkerung"],
    ["bevoelkerung", "lebensqualitaet", "f14-Bevoelkerung-auf-Lebensqualitaet"]
  ];

  window.OekolopolyCurves = {
    clamp,
    curves,
    relations
  };
}());
