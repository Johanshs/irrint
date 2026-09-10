import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { runExperiment } from '../experiments/run.ts';
import { scenarios } from '../shared/experiments.ts';

const directory = resolve('.local', 'reports', new Date().toISOString().replaceAll(':', '-'));
await mkdir(directory, { recursive: true });
const hash = createHash('sha256');
for (const file of [
  'shared/contracts.ts',
  'shared/control.ts',
  'shared/experiments.ts',
  'shared/water.ts',
  'simulator/device.ts',
  'experiments/run.ts',
]) {
  hash.update(file);
  hash.update(await readFile(file));
}
const fingerprint = hash.digest('hex');
const lines = [
  '# Evidências dos cenários de irrigação',
  '',
  `Gerado em: ${new Date().toISOString()}`,
  '',
  `SHA-256 das fontes do modelo: ${fingerprint}`,
  '',
  'Execução direta do controlador e do modelo de dispositivo, com relógio virtual. Os testes HTTP são executados separadamente por npm test.',
  '',
  '| Cenário | Verificações | Comandos confirmados | Válvula norte aberta | Leitura na faixa | Volume nominal |',
  '| --- | ---: | ---: | ---: | ---: | ---: |',
];
let failures = 0;
for (const scenario of scenarios) {
  const report = runExperiment({ scenario: scenario.id, seed: 2026 });
  const passed = report.checks.filter((check) => check.passed).length;
  failures += report.checks.length - passed;
  await writeFile(
    resolve(directory, `${scenario.id}.json`),
    JSON.stringify({ ...report, sourceFingerprint: fingerprint }, null, 2),
  );
  lines.push(
    `| ${scenario.name} | ${passed}/${report.checks.length} | ${report.metrics.confirmedCommands}/${report.metrics.totalCommands} | ${report.metrics.openSeconds} s | ${report.metrics.inRangePercent}% | ${report.metrics.totalLiters} L |`,
  );
}
lines.push(
  '',
  'Os JSONs contêm séries, comandos, eventos, parâmetros e critérios. Não são evidência de hardware físico, economia de água ou desempenho agronômico.',
);
await writeFile(resolve(directory, 'RESUMO.md'), lines.join('\n'));
console.log(`Evidências: ${directory}`);
console.log(`${9 - failures}/9 verificações dos três cenários atendidas.`);
process.exitCode = failures ? 1 : 0;
