export type ComponentKind = 'controller' | 'sensor' | 'valve' | 'pump' | 'reservoir' | 'emitter';
export const componentCatalog: Record<
  ComponentKind,
  {
    name: string;
    example: string;
    description: string;
    details: string[];
    integration: string;
  }
> = {
  controller: {
    name: 'Microcontrolador',
    example: 'Placa de desenvolvimento inspirada no ESP32 DevKitC',
    description:
      'É a ponte entre o software e o campo: recebe comandos, aciona a saída e envia leituras e confirmações.',
    details: [
      'Módulo com blindagem metálica e antena impressa',
      'Duas fileiras de pinos, porta USB, botões EN e BOOT',
      'Módulo de relé ilustrado ao lado: separa o sinal lógico do acionamento',
    ],
    integration:
      'Hoje este papel é executado por um dispositivo simulado em Node.js. Um ESP32, outro microcontrolador ou gateway precisaria de firmware/adaptador para cumprir o contrato da API e o prazo local de fechamento.',
  },
  sensor: {
    name: 'Sensor de umidade',
    example: 'Sonda capacitiva inspirada no SEN0193',
    description:
      'A sonda acompanha a condição do solo. O sistema recebe um índice normalizado de 0 a 100 e compara essa leitura com os limites configurados.',
    details: [
      'Sonda alongada com superfície sensível e marca de inserção',
      'Circuito eletrônico e conector de três vias acima do solo',
      'Cabo de sinal ilustrativo; eletrônica exposta não deve ser enterrada',
    ],
    integration:
      'Sensores capacitivos, sondas industriais ou outros instrumentos podem ocupar este papel mediante calibração e um adaptador. O protótipo atual simula o índice; não mede umidade volumétrica real.',
  },
  valve: {
    name: 'Válvula solenoide',
    example: 'Válvula normalmente fechada, corpo em latão',
    description:
      'Libera ou interrompe o fluxo para uma área. Cada canteiro possui seu próprio acionamento e pode irrigar de forma independente.',
    details: [
      'Conexões roscadas e corpo hidráulico em latão',
      'Bobina eletromagnética preta e conector elétrico',
      'Anel luminoso é uma indicação didática do estado, não uma peça física',
    ],
    integration:
      'A API trabalha com abrir, fechar e confirmar, independentemente do fabricante. Tensão, relé/driver, proteção elétrica e comportamento de falha precisam ser definidos e validados em uma implementação física.',
  },
  pump: {
    name: 'Bomba de água',
    example: 'Conjunto motor e bomba centrífuga',
    description:
      'Representa a origem da pressão que transportaria água do reservatório para as linhas de gotejamento.',
    details: [
      'Carcaça do motor com aletas de refrigeração',
      'Base, cabeçote hidráulico, conexões e caixa de ligação',
      'Tubulação central alimenta as duas válvulas',
    ],
    integration:
      'É contexto hidráulico da maquete. O contrato atual controla válvulas; não comanda uma bomba separada nem mede pressão. Um acionamento de bomba exigiria uma extensão do sistema.',
  },
  reservoir: {
    name: 'Reservatório',
    example: 'Tanque com tampa e reforços externos',
    description:
      'Representa a fonte de abastecimento. A água segue para a bomba, o coletor, a válvula da área e os gotejadores.',
    details: [
      'Corpo cilíndrico com anéis de reforço',
      'Tampa de inspeção e conexão inferior',
      'Não há sensor de nível implementado neste protótipo',
    ],
    integration:
      'O consumo exibido é a soma do volume nominal aplicado pelos dispositivos simulados. O nível do tanque e a disponibilidade de água não são medidos nem simulados.',
  },
  emitter: {
    name: 'Gotejador',
    example: 'Emissor pontual junto à planta',
    description:
      'Aplica água perto das raízes. As gotas caem no solo, formando uma região visualmente mais úmida.',
    details: [
      '18 emissores por canteiro, um por planta',
      'Vazão nominal adotada: 2 litros por hora por emissor',
      'Gotas ampliadas para apresentação; o volume não é contado pela quantidade de partículas',
    ],
    integration:
      'O volume por planta é uma divisão uniforme do volume da área. Não representa absorção pela planta, uniformidade real, perdas ou um ensaio de eficiência hídrica.',
  },
};
export interface FieldComponent {
  id: string;
  kind: ComponentKind;
  zoneId?: string;
  label: string;
}
export const fieldComponents: FieldComponent[] = [
  { id: 'reservoir', kind: 'reservoir', label: 'Reservatório' },
  { id: 'pump', kind: 'pump', label: 'Bomba' },
  ...['north', 'south'].flatMap((zoneId) => {
    const suffix = zoneId === 'north' ? 'N' : 'S';
    return [
      {
        id: `controller-${zoneId}`,
        kind: 'controller' as const,
        zoneId,
        label: `Microcontrolador ${suffix}`,
      },
      { id: `valve-${zoneId}`, kind: 'valve' as const, zoneId, label: `Válvula ${suffix}` },
      { id: `sensor-${zoneId}`, kind: 'sensor' as const, zoneId, label: `Sensor de umidade ${suffix}` },
      { id: `emitter-${zoneId}`, kind: 'emitter' as const, zoneId, label: `Gotejador ${suffix}` },
    ];
  }),
];
