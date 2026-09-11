import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { runExperiment } from '../experiments/run.ts';
import { scenarios } from '../shared/experiments.ts';
import { experimentCsv, experimentHandout } from '../src/features/laboratory/report.ts';

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
  'experiments/checks.ts',
  'src/features/laboratory/report.ts',
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
  '| Sistema | Cenário | Verificações | Comandos confirmados | Tempo irrigando | Leitura na faixa | Volume nominal |',
  '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
];
let failures = 0;
let total = 0;
for (const zoneId of ['north', 'south'] as const)
  for (const scenario of scenarios) {
    const report = runExperiment({ scenario: scenario.id, seed: 2026, zoneId });
    const passed = report.checks.filter((check) => check.passed).length;
    total += report.checks.length;
    failures += report.checks.length - passed;
    await writeFile(
      resolve(directory, `${scenario.id}-${zoneId}.json`),
      JSON.stringify({ ...report, sourceFingerprint: fingerprint }, null, 2),
    );
    await writeFile(resolve(directory, `${scenario.id}-${zoneId}.csv`), experimentCsv(report));
    await writeFile(resolve(directory, `${scenario.id}-${zoneId}.html`), experimentHandout(report));
    lines.push(
      `| ${zoneId} | ${scenario.name} | ${passed}/${report.checks.length} | ${report.metrics.confirmedCommands}/${report.metrics.totalCommands} | ${report.metrics.openSeconds} s | ${report.metrics.inRangePercent}% | ${report.metrics.totalLiters} L |`,
    );
  }
lines.push(
  '',
  'Os JSONs contêm séries, comandos, eventos, parâmetros e critérios. Não são evidência de hardware físico, economia de água ou desempenho agronômico.',
);
await writeFile(resolve(directory, 'RESUMO.md'), lines.join('\n'));
console.log(`Evidências: ${directory}`);
console.log(`${total - failures}/${total} verificações em ${scenarios.length * 2} ensaios atendidas.`);
process.exitCode = failures ? 1 : 0;
