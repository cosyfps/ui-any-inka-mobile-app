#!/usr/bin/env node
/**
 * Valida el reporte de coverage de Jest antes de dejar pasar el pipeline.
 *
 * Ademas del umbral, comprueba que el reporte sea real. Sin suites que ejecutar, Jest
 * escribe un summary vacio donde cada `pct` es el string "Unknown": el promedio daba NaN
 * y, como `NaN < 80` es false, el job imprimia "OK" y reportaba verde sin haber medido
 * absolutamente nada. Un reporte vacio ahora es un fallo explicito.
 */
const fs = require('fs');
const path = require('path');

const THRESHOLD = 80;
const METRICS = ['lines', 'statements', 'functions', 'branches'];
const SUMMARY_PATH = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(SUMMARY_PATH)) {
  fail('no se genero coverage/coverage-summary.json');
}

let summary;
try {
  summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));
} catch (error) {
  fail(`coverage-summary.json no es JSON valido: ${error.message}`);
}

const files = Object.keys(summary).filter(key => key !== 'total');
if (files.length === 0) {
  fail('el reporte no incluye ningun archivo; Jest no encontro suites que ejecutar');
}

if (!summary.total) {
  fail('el reporte no trae la seccion "total"');
}

const values = METRICS.map(metric => {
  const entry = summary.total[metric];
  const pct = entry && entry.pct;
  if (typeof pct !== 'number' || !Number.isFinite(pct)) {
    fail(`la metrica "${metric}" no es numerica (valor: ${JSON.stringify(pct)})`);
  }
  return pct;
});

console.log(`Archivos medidos: ${files.length}`);
METRICS.forEach((metric, index) => {
  console.log(`  ${metric.padEnd(11)} ${values[index].toFixed(2)}%`);
});

const below = METRICS.filter((_, index) => values[index] < THRESHOLD);
if (below.length > 0) {
  fail(`estas metricas no alcanzan el ${THRESHOLD}%: ${below.join(', ')}`);
}

const average = values.reduce((acc, value) => acc + value, 0) / values.length;
console.log(`OK: las 4 metricas superan el ${THRESHOLD}% (promedio ${average.toFixed(2)}%)`);
