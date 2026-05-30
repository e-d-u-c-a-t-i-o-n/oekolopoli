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
    const supply = (values.produktion || 0) + (values.lebensqualitaet || 0) - population;

    if (supply < 0) {
      return step([
        [0, 0],
        [10, -1],
        [15, -2],
        [20, -4],
        [25, -6],
        [30, -8],
        [38, -9],
        [48, -9]
      ], population);
    }

    return step([
      [0, 0],
      [10, 1],
      [16, 2],
      [21, 3],
      [25, 4],
      [30, 5],
      [34, 6],
      [38, 7],
      [42, 8],
      [48, 9]
    ], population);
  }

  function reproductionToPopulation(reproduction, context) {
    const population = context && context.values ? context.values.bevoelkerung || 0 : 0;
    const populationFactor = population >= 28 ? 3 : population >= 18 ? 2 : 1;
    return makeCurve([
      [0, -4],
      [5, -2],
      [9, -1],
      [14, 0],
      [16, 1],
      [20, 2],
      [25, 3],
      [32, 3]
    ], "step")(reproduction, { scale: populationFactor });
  }

  const curves = {
    "f1-Sanierung-auf-Umweltbelastung": makeCurve([
      [0, 0], [4, -1], [9, -2], [15, -3], [21, -4], [24, -5],
      [26, -6], [28, -7], [30, -8], [32, -9]
    ], "step"),

    "f2-Sanierung-auf-Sanierung": makeCurve([
      [0, 0], [18, 0], [20, -1], [22, -3], [24, -4], [27, -5],
      [32, -6]
    ], "step"),

    "f3-Produktion-auf-Produktion": makeCurve([
      [0, 0], [6, 0], [7, 1], [21, 1], [22, 2], [27, 2],
      [28, 0], [29, -8], [32, -10]
    ], "step"),

    "f4-Produktion-auf-Umweltbelastung": makeCurve([
      [0, 0], [5, 0], [6, 1], [9, 2], [13, 3], [16, 4],
      [18, 5], [20, 6], [23, 8], [25, 10], [27, 14], [28, 18],
      [29, 22], [32, 22]
    ], "linear"),

    "f5-Umweltbelastung-auf-Umweltbelastung": makeCurve([
      [0, 0], [4, -1], [12, -1], [13, -2], [18, -2], [19, -3],
      [22, -3], [23, -4], [25, -2], [27, 0], [32, 0]
    ], "step"),

    "f6-Umweltbelastung-auf-Lebensqualitaet": makeCurve([
      [0, 2], [3, 0], [8, -1], [12, -2], [16, -3], [19, -5],
      [22, -7], [24, -10], [26, -14], [28, -20], [32, -25]
    ], "linear"),

    "f7-Aufklaerung-auf-Aufklaerung": makeCurve([
      [0, 0], [3, -1], [7, 0], [15, 1], [21, 2],
      [24, 1], [30, 0], [32, 0]
    ], "step"),

    "f8-Aufklaerung-auf-Lebensqualitaet": makeCurve([
      [0, -2], [9, -1], [13, 1], [16, 2], [20, 3], [24, 4],
      [28, 5], [29, 6], [32, 6]
    ], "step"),

    "f9-Aufklaerung-auf-Vermehrungsrate": makeCurve([
      [0, 1], [2, 0], [10, 1], [15, 2], [20, 3],
      [24, -3], [27, -4], [29, -5], [32, -5]
    ], "step"),

    "f10-Lebensqualitaet-auf-Lebensqualitaet": makeCurve([
      [0, 0], [1, 1], [4, 0], [10, 1], [13, 2], [14, 1],
      [17, 0], [18, -1], [23, -2], [26, -1], [29, 0], [32, 0]
    ], "step"),

    "f11-Lebensqualitaet-auf-Vermehrungsrate": makeCurve([
      [0, -15], [1, -8], [3, -5], [7, 0], [10, 3],
      [12, 1], [21, 0], [32, 0]
    ], "linear"),

    "f12-Lebensqualitaet-auf-Politik": makeCurve([
      [0, -10], [2, -8], [4, -4], [7, -1], [10, 0], [12, 1],
      [21, 2], [25, 3], [28, 4], [30, 5], [32, 5]
    ], "linear"),

    "f13-Vermehrungsrate-auf-Bevoelkerung": reproductionToPopulation,

    "f14-Bevoelkerung-auf-Lebensqualitaet": makeCurve([
      [0, -5], [2, -2], [3, 0], [15, -1], [25, -2],
      [31, -3], [40, -4], [44, -5], [46, -8], [48, -10]
    ], "step"),

    "fA-Einfluss-der-Bevoelkerung": populationToActionPoints,

    "fB-Einfluss-der-Politik": makeCurve([
      [0, -5], [1, -2], [4, -1], [6, 0], [8, 1],
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
