import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { CrisisState, Incident } from "./src/types.js";

// Setup safe __dirname resolution for both ES modules and CommonJS
const getSafeDirname = (): string => {
  if (typeof __dirname !== "undefined") {
    return __dirname;
  }
  try {
    const metaUrl = (new Function("return import.meta.url"))();
    return path.dirname(fileURLToPath(metaUrl));
  } catch (e) {
    return process.cwd();
  }
};
const _dirname = getSafeDirname();

const app = express();
app.use(express.json());

const PORT = 3000;

// Shared in-memory crisis state
let crisisState: CrisisState = {
  incidents: [
    {
      id: "inc-001",
      category: "deslizamento",
      title: "Deslizamento de Barreira em Encosta",
      neighborhood: "Dois Unidos",
      latitude: -8.0054,
      longitude: -34.9082,
      severity: "critico",
      description: "Deslizamento parcial de encosta de risco atingindo os fundos de duas residências. Risco de novos deslizamento em caso de chuva contínua.",
      status: "em_atendimento",
      reportingTime: new Date(Date.now() - 4 * 3600000).toISOString(),
      reporterType: "agent",
      citizenName: "Coord. Cássio Araujo",
      citizenPhone: "81 98888-0011",
      agencyAssigned: "Defesa Civil"
    },
    {
      id: "inc-002",
      category: "alagamento",
      title: "Alagamento Crítico de Via de Trânsito Rápido",
      neighborhood: "Imbiribeira (Av. Mascarenhas de Morais)",
      latitude: -8.1023,
      longitude: -34.9125,
      severity: "alto",
      description: "Acúmulo severo de águas pluviais impedindo a circulação de veículos de pequeno porte próximo à UPA da Imbiribeira.",
      status: "pendente",
      reportingTime: new Date(Date.now() - 3 * 3600000).toISOString(),
      reporterType: "citizen",
      citizenName: "Manoel Bezerra da Silva",
      citizenPhone: "81 99776-5544"
    },
    {
      id: "inc-003",
      category: "arvore_caida",
      title: "Queda de Árvore Ficus Interditando Canal",
      neighborhood: "Graças (Av. Rui Barbosa)",
      latitude: -8.0415,
      longitude: -34.9011,
      severity: "medio",
      description: "Árvore de grande porte caiu sobre fiação elétrica e impede tráfego parcial na pista de rolamento esquerda.",
      status: "em_atendimento",
      reportingTime: new Date(Date.now() - 2 * 3600000).toISOString(),
      reporterType: "agent",
      citizenName: "Sub-inspetor Geral",
      citizenPhone: "81 98112-2233",
      agencyAssigned: "EMLURB"
    },
    {
      id: "inc-004",
      category: "bueiro_entupido",
      title: "Bueiros obstruídos com galhos e resíduos",
      neighborhood: "Bairro do Recife",
      latitude: -8.0631,
      longitude: -34.8712,
      severity: "baixo",
      description: "Obstrução de galerias de drenagem pluvial nas imediações da Praça do Marco Zero. Início de espelhamento d'água na calçada.",
      status: "pendente",
      reportingTime: new Date(Date.now() - 1 * 3600000).toISOString(),
      reporterType: "citizen",
      citizenName: "Beatriz Lacerda Moura",
      citizenPhone: "81 99123-0987"
    },
    {
      id: "inc-005",
      category: "deslizamento",
      title: "Deslizamento Iminente de Talude",
      neighborhood: "Ibura",
      latitude: -8.1154,
      longitude: -34.9452,
      severity: "critico",
      description: "Trincas severas identificadas em solo após infiltração intensa de águas. Solicitada desocupação preventiva imediata de 5 famílias.",
      status: "pendente",
      reportingTime: new Date(Date.now() - 0.5 * 3600000).toISOString(),
      reporterType: "agent",
      citizenName: "Eq. Técnico Defesa Civil",
      citizenPhone: "81 98888-0022"
    }
  ],
  sensors: [
    {
      id: "sens-001",
      name: "Rio Capibaribe - Ponte Duarte Coelho",
      riverName: "Rio Capibaribe",
      neighborhood: "Santo Antônio",
      currentLevel: 4.88,
      warningLevel: 4.00,
      criticalLevel: 5.00,
      status: "alerta",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "sens-002",
      name: "Rio Beberibe - Cajueiro",
      riverName: "Rio Beberibe",
      neighborhood: "Cajueiro",
      currentLevel: 5.92,
      warningLevel: 5.00,
      criticalLevel: 5.80,
      status: "critico",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "sens-003",
      name: "Rio Tejipió - Coqueiral",
      riverName: "Rio Tejipió",
      neighborhood: "Coqueiral",
      currentLevel: 6.25,
      warningLevel: 5.20,
      criticalLevel: 6.00,
      status: "critico",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "sens-004",
      name: "Canal Agamenon Magalhães - Espinheiro",
      riverName: "Canal Agamenon Magalhães",
      neighborhood: "Espinheiro",
      currentLevel: 3.12,
      warningLevel: 2.80,
      criticalLevel: 3.30,
      status: "alerta",
      lastUpdated: new Date().toISOString()
    }
  ],
  stations: [
    {
      id: "sta-001",
      name: "Cemaden Recife Antigo",
      neighborhood: "Bairro do Recife",
      rainAmount24h: 122.5,
      rainAmount3h: 38.6,
      alertStatus: "laranja"
    },
    {
      id: "sta-002",
      name: "Cemaden Ibura",
      neighborhood: "Ibura",
      rainAmount24h: 154.2,
      rainAmount3h: 68.4,
      alertStatus: "vermelho"
    },
    {
      id: "sta-003",
      name: "Cemaden Dois Unidos",
      neighborhood: "Dois Unidos",
      rainAmount24h: 138.8,
      rainAmount3h: 46.2,
      alertStatus: "laranja"
    },
    {
      id: "sta-004",
      name: "Cemaden Arruda",
      neighborhood: "Arruda",
      rainAmount24h: 142.1,
      rainAmount3h: 51.5,
      alertStatus: "vermelho"
    },
    {
      id: "sta-005",
      name: "Cemaden Boa Viagem",
      neighborhood: "Boa Viagem",
      rainAmount24h: 88.4,
      rainAmount3h: 18.2,
      alertStatus: "amarelo"
    }
  ],
  shelters: [
    {
      id: "she-001",
      name: "Escola Municipal Beberibe",
      neighborhood: "Beberibe",
      capacity: 150,
      currentOccupants: 118,
      itemsNeeded: ["Colchões", "Lençóis de solteiro", "Água mineral", "Leite em pó"],
      phone: "81 3355-1212",
      latitude: -8.0122,
      longitude: -34.8955,
      riskZone: false
    },
    {
      id: "she-002",
      name: "Quadra Poliesportiva do Ibura",
      neighborhood: "Ibura",
      capacity: 200,
      currentOccupants: 172,
      itemsNeeded: ["Kits de higiene pessoal", "Fraldas descartáveis", "Roupas e agasalhos"],
      phone: "81 3355-3434",
      latitude: -8.1189,
      longitude: -34.9491,
      riskZone: false
    },
    {
      id: "she-003",
      name: "Centro de Convivência Imbiribeira",
      neighborhood: "Imbiribeira",
      capacity: 100,
      currentOccupants: 42,
      itemsNeeded: ["Alimentos não-perecíveis", "Cobertores e toalhas"],
      phone: "81 3355-5656",
      latitude: -8.0991,
      longitude: -34.9182,
      riskZone: false
    },
    {
      id: "she-004",
      name: "Paróquia Coração de Maria (Casa Amarela)",
      neighborhood: "Casa Amarela",
      capacity: 120,
      currentOccupants: 90,
      itemsNeeded: ["Sabonete", "Creme dental", "Absorventes"],
      phone: "81 3355-7878",
      latitude: -8.0255,
      longitude: -34.9199,
      riskZone: false
    }
  ],
  hospitals: [
    {
      id: "hosp-001",
      name: "Hospital da Restauração (HR)",
      neighborhood: "Derby",
      availableBeds: 14,
      doctorsOnDuty: 32,
      generatorStatus: "operacional",
      status: "sobrecarregado"
    },
    {
      id: "hosp-002",
      name: "UPA do Ibura",
      neighborhood: "Ibura",
      availableBeds: 1,
      doctorsOnDuty: 8,
      generatorStatus: "operacional",
      status: "emergencia"
    },
    {
      id: "hosp-003",
      name: "Hospital Otávio de Freitas (HOF)",
      neighborhood: "Sancho",
      availableBeds: 8,
      doctorsOnDuty: 14,
      generatorStatus: "operacional",
      status: "sobrecarregado"
    },
    {
      id: "hosp-004",
      name: "UPA da Imbiribeira",
      neighborhood: "Imbiribeira",
      availableBeds: 6,
      doctorsOnDuty: 11,
      generatorStatus: "operacional",
      status: "normal"
    }
  ],
  fleet: [
    {
      id: "fleet-001",
      code: "DC-04",
      service: "Defesa Civil",
      driver: "Oficial Cavalcanti",
      latitude: -8.1170,
      longitude: -34.9460,
      status: "atendimento"
    },
    {
      id: "fleet-002",
      code: "CTTU-R08",
      service: "CTTU",
      driver: "Agente Eliane L.",
      latitude: -8.1020,
      longitude: -34.9130,
      status: "atendimento"
    },
    {
      id: "fleet-003",
      code: "CBM-192",
      service: "Bombeiros",
      driver: "Sgt. Albuquerque",
      latitude: -8.0060,
      longitude: -34.9090,
      status: "atendimento"
    },
    {
      id: "fleet-004",
      code: "EML-602",
      service: "EMLURB",
      driver: "Encarregado Severino",
      latitude: -8.0420,
      longitude: -34.9015,
      status: "atendimento"
    },
    {
      id: "fleet-005",
      code: "SAMU-03",
      service: "SAMU",
      driver: "Socorrista Marcos",
      latitude: -8.0550,
      longitude: -34.8850,
      status: "disponivel"
    }
  ],
  floodedStreets: [
    {
      id: "flood-001",
      name: "Avenida Marechal Mascarenhas de Morais",
      neighborhood: "Imbiribeira",
      status: "alagado",
      severity: "critico",
      referencePoint: "Próximo à UPA de Imbiribeira, sentido Centro",
      alternativeRoute: "Cruzar pela pista leste opera em mão dupla pela CTTU, ou utilizar a Avenida Sul para desvios secundários.",
      latitude: -8.1023,
      longitude: -34.9125
    },
    {
      id: "flood-002",
      name: "Avenida Sul",
      neighborhood: "São José",
      status: "alagado",
      severity: "alto",
      referencePoint: "Debaixo do pontilhão da linha férrea, ponto de bacia pluvial",
      alternativeRoute: "Desviar pela Avenida Agamenon Magalhães em direção a Afogados e utilizar a pista lateral da Avenida Abdias de Carvalho.",
      latitude: -8.0750,
      longitude: -34.8900
    },
    {
      id: "flood-003",
      name: "Avenida Dr. José Rufino",
      neighborhood: "Areias",
      status: "risco",
      severity: "medio",
      referencePoint: "Nas proximidades do Colégio Maria Auxiliadora",
      alternativeRoute: "Utilizar a Avenida Recife para acessar a BR-101 Sul ou seguir pela Avenida San Martin em direção oposta.",
      latitude: -8.0780,
      longitude: -34.9220
    },
    {
      id: "flood-004",
      name: "Avenida Governador Agamenon Magalhães",
      neighborhood: "Espinheiro",
      status: "alagado",
      severity: "alto",
      referencePoint: "Cruzamento com a Avenida Rui Barbosa, alagamento de faixas laterais",
      alternativeRoute: "Seguir pela faixa central de trânsito rápido ou desviar por dentro das Graças usando a Rua Amélia.",
      latitude: -8.0460,
      longitude: -34.8950
    },
    {
      id: "flood-005",
      name: "Avenida Caxangá",
      neighborhood: "Cordeiro",
      status: "risco",
      severity: "baixo",
      referencePoint: "Próximo ao Hospital Getúlio Vargas",
      alternativeRoute: "Passagem pelo corredor exclusivo de BRT ou utilizar a Rua Real da Torre para acessar o viaduto principal.",
      latitude: -8.0480,
      longitude: -34.9250
    }
  ],
  updatedAt: new Date().toISOString()
};

// Lazy initialization of Gemini client to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// REST APIs
app.get("/api/crisis-state", (req, res) => {
  res.json(crisisState);
});

// Create/Submit incident (from Citizen or Agent)
app.post("/api/incident", (req, res) => {
  const { category, title, neighborhood, description, severity, citizenName, citizenPhone, reporterType, latitude, longitude } = req.body;

  if (!category || !title || !neighborhood || !description) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Pre-configured coordinate mapping for Recife neighborhoods if not provided
  let lat = latitude || -8.0578;
  let lng = longitude || -34.8829;

  const mapping: { [key: string]: { lat: number, lng: number } } = {
    "Dois Unidos": { lat: -8.0054, lng: -34.9082 },
    "Ibura": { lat: -8.1154, lng: -34.9452 },
    "Imbiribeira (Av. Mascarenhas de Morais)": { lat: -8.1023, lng: -34.9125 },
    "Imbiribeira": { lat: -8.1023, lng: -34.9125 },
    "Graças (Av. Rui Barbosa)": { lat: -8.0415, lng: -34.9011 },
    "Graças": { lat: -8.0415, lng: -34.9011 },
    "Bairro do Recife": { lat: -8.0631, lng: -34.8712 },
    "Casa Amarela": { lat: -8.0255, lng: -34.9199 },
    "Beberibe": { lat: -8.0122, lng: -34.8955 },
    "Santo Amaro": { lat: -8.0478, lng: -34.8752 },
    "Afogados": { lat: -8.0772, lng: -34.9065 },
    "Vasco da Gama": { lat: -8.0185, lng: -34.9252 },
    "Iputinga": { lat: -8.0385, lng: -34.9412 }
  };

  if (mapping[neighborhood]) {
    lat = mapping[neighborhood].lat;
    lng = mapping[neighborhood].lng;
  }

  // Auto calculate initial severity based on category if empty
  let calculatedSeverity = severity || "medio";
  if (category === "deslizamento") {
    calculatedSeverity = "critico";
  } else if (category === "alagamento") {
    calculatedSeverity = "alto";
  }

  const newIncident: Incident = {
    id: `inc-${Math.floor(1000 + Math.random() * 9000)}`,
    category,
    title,
    neighborhood,
    latitude: lat,
    longitude: lng,
    severity: calculatedSeverity,
    description,
    status: "pendente",
    reportingTime: new Date().toISOString(),
    citizenName: citizenName || "Repórter Anônimo",
    citizenPhone: citizenPhone || "Não informado",
    reporterType: reporterType || "citizen"
  };

  crisisState.incidents.unshift(newIncident);
  crisisState.updatedAt = new Date().toISOString();

  // Simulate updating a sensor slightly in case of heavy flooding reports
  if (category === "alagamento" && neighborhood.includes("Mascarenhas")) {
    const sensor = crisisState.sensors.find(s => s.id === "sens-004");
    if (sensor) {
      sensor.currentLevel = Math.min(3.35, sensor.currentLevel + 0.05);
      if (sensor.currentLevel >= sensor.criticalLevel) sensor.status = "critico";
    }
  }

  res.status(201).json({ progress: "Incident registered successfully!", incident: newIncident });
});

// Update incident status or assign agency
app.post("/api/incident/:id/update", (req, res) => {
  const { id } = req.params;
  const { status, agencyAssigned } = req.body;

  const incident = crisisState.incidents.find(inc => inc.id === id);
  if (!incident) {
    return res.status(404).json({ error: "Incident not found" });
  }

  if (status) incident.status = status;
  if (agencyAssigned) incident.agencyAssigned = agencyAssigned;

  // Simulate fleet allocation when in_attendance is requested
  if (status === "em_atendimento" && agencyAssigned) {
    const assignedFleet = crisisState.fleet.find(f => f.service === agencyAssigned && f.status === "disponivel");
    if (assignedFleet) {
      assignedFleet.status = "atendimento";
      // Position fleet relative to the incident
      assignedFleet.latitude = incident.latitude + (Math.random() - 0.5) * 0.002;
      assignedFleet.longitude = incident.longitude + (Math.random() - 0.5) * 0.002;
    }
  }

  crisisState.updatedAt = new Date().toISOString();
  res.json({ success: true, incident });
});

// AI Executive Crisis Report Generation
app.post("/api/gemini/report", async (req, res) => {
  try {
    const ai = getGeminiClient();

    const statsSummary = {
      total: crisisState.incidents.length,
      pending: crisisState.incidents.filter(i => i.status === "pendente").length,
      inAttendance: crisisState.incidents.filter(i => i.status === "em_atendimento").length,
      resolved: crisisState.incidents.filter(i => i.status === "resolvido").length,
      criticalCount: crisisState.incidents.filter(i => i.severity === "critico").length,
      criticalRivers: crisisState.sensors.filter(s => s.status === "critico").map(s => s.name),
      criticalEstations: crisisState.stations.filter(st => st.alertStatus === "vermelho").map(st => st.name),
      sheltersAverageOccupancy: Math.round(
        (crisisState.shelters.reduce((acc, current) => acc + current.currentOccupants, 0) /
          crisisState.shelters.reduce((acc, current) => acc + current.capacity, 0)) * 100
      )
    };

    const detailsText = crisisState.incidents.map(inc => 
      `- [${inc.severity.toUpperCase()}] na localidade ${inc.neighborhood}: ${inc.title} (${inc.description.slice(0, 70)}...) - Status: ${inc.status}`
    ).join("\n");

    const prompt = `Você é o Arquiteto de Resposta e Assessor Técnico da Defesa Civil de Recife.
Gere um Relatório Operacional Executivo de Situação Crítica (Briefing do Prefeito & Gabinete de Crises) com base nos dados reais do sistema em tempo real:

Métricas Consolidadas de Crise:
- Total de Ocorrências Ativas: ${statsSummary.total} (${statsSummary.pending} pendentes, ${statsSummary.inAttendance} em atendimento, ${statsSummary.resolved} resolvidos)
- Situações de Segurança Nível Crítico: ${statsSummary.criticalCount} ocorrendo agora.
- Rios e Canais Transbordando / Críticos: ${statsSummary.criticalRivers.join(", ") || "Nenhum no momento"}
- Estações Meteorológicas com Alerta Vermelho: ${statsSummary.criticalEstations.join(", ") || "Nenhuma"}
- Taxa de Ocupação Média dos Abrigos Temporários: ${statsSummary.sheltersAverageOccupancy}%

Lista Geral de Ocorrências:
${detailsText}

O relatório deve conter as seguintes seções estruturadas profissionalmente em português:
1. EXTRATO DE SITUAÇÃO DA CRISE (Relatório curto sobre o impacto climático nas últimas horas e gravidade atual)
2. FOCOS CRÍTICOS DE URGÊNCIA (Identificação de áreas onde as forças operacionais como Defesa Civil, EMLURB e Corpo de Bombeiros devem se concentrar IMEDIATAMENTE - especialmente com relação a rios transbordando e áreas de grande risco como encostas do Ibura e Dois Unidos)
3. STATUS OPERACIONAL DA INFRAESTRUTURA (Avaliação de hospitais, capacidade atual de abrigos, energia elétrica e pontos prioritários de inundação na logística urbana como CTTU)
4. DIRETRIZES DE PRONTIDÃO (3 recomendações técnicas operacionais urgentes para os secretários municipais coordenarem a contenção)

Mantenha uma linguagem extremamente técnica, objetiva, formal e limpa. Não inclua observações fora das seções e não mencione códigos internos do arquivo. ATENÇÃO: Nunca retorne nenhum tipo de marcação markdown como asteriscos '**' ou hashtags '##' ou '###' ou '####' para cabeçalhos ou destaques de texto. Retorne o texto de forma puramente limpa e sem formatação especial.`;

    if (!ai) {
      // Return beautiful mock briefing if API Key is not set or placeholder
      const mockReport = `RELATÓRIO OPERACIONAL DE CRISES - GABINETE CONJUNTO

1. EXTRATO DE SITUAÇÃO DA CRISE
A cidade do Recife enfrenta um evento climatológico adverso classificado como severo, acumulando precipitações que superam 154mm em pontos vulneráveis (atendidos pela estação Cemaden Ibura) nas últimas 24 horas. O volume pluviométrico elevado, associado à maré alta de 2.2 metros, provocou um estado de estresse severo na bacia hidrográfica do Capibaribe e Beberibe. Atualmente, o sistema monitora ${statsSummary.total} ocorrências ativas, das quais ${statsSummary.criticalCount} são classificadas como críticas.

2. FOCOS CRÍTICOS DE URGÊNCIA
- Encostas - RPA 3 e RPA 6: O maciço do Ibura e do Dois Unidos registram saturação do solo superior a 90%. É recomendável focar a mobilização da Defesa Civil imediata no Córrego do Jenipapo e nas áreas de talude do Ibura para evacuação forçada preventiva das habitações sob alertas severos de trincas estruturais.
- Transbordo dos Corpos Hídricos: O Rio Beberibe (Cajueiro) ultrapassou a cota crítica operativa atingindo 5.92m (limiar crítico de 5.80m). O Rio Tejipió em Coqueiral também se encontra em estado severo de inundação atingindo 6.25m. A zona circundante está alagando residências de baixa calha.

3. STATUS OPERACIONAL DA INFRAESTRUTURA
- Abrigos Públicos: Taxa de ocupação consolidada está crítica, atingindo ${statsSummary.sheltersAverageOccupancy}% da capacidade total instalada nos 4 polos principais. A Quadra Poliesportiva do Ibura relata ocupação crítica de 86%. Urgência no direcionamento de mantimentos (colchões, kits de higiene e lençóis).
- Corredores de Mobilidade: A Av. Mascarenhas de Morais (CTTU) está bloqueada em pontos fundamentais devido a bolsões severos de inundação, limitando e impedindo acesso regular de ambulâncias à UPA local.
- Rede Hospitalar: A UPA do Ibura encontra-se com capacidade saturada (95% de ocupação e apenas 1 leito livre), operando estritamente em caráter de emergência prioritária sob geradores funcionais.

4. DIRETRIZES DE PRONTIDÃO E RECOMENDAÇÕES URBANAS
1. Ativação da Célula Específica da CTTU: Desviar trajeto de veículos de socorro pesado da Mascarenhas para rota secundária e posicionar reboques nos cruzamentos críticos operados por agentes.
2. Deslocamento Coordenado de EMLURB para Limpeza e Desobstrução: Posicionar as equipes de manutenção para retirada de barreiras e desobstrução das vias do Derby, Graças e Dois Unidos que ligam os hospitais.
3. Divulgação do Alerta de Abrigos Temporários: Emitir avisos públicos via rádio e push notifications direcionando os desalojados das áreas adjacentes ao Rio Tejipió para o polo da Imbiribeira, que ainda dispõe de 58 vagas úteis.

(Alerta: Este briefing operacional foi gerado de forma simulada pela plataforma local por falta de uma API Key Gemini configurada nos Secrets do AI Studio. Configure a chave para obter análise dinâmica generativa baseada em inteligência artificial.)`;

      return res.json({ report: mockReport, simulated: true });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ report: response.text || "Erro ao obter relatório." });
  } catch (error: any) {
    console.error("Gemini Report generation error:", error);
    res.status(500).json({ error: "Erro interno no servidor ao chamar a inteligência artificial: " + error.message });
  }
});

// AI Image Verification endpoint
app.post("/api/verify-incident-image", async (req, res) => {
  const { image, category, neighborhood, latitude, longitude, localTime } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Faltando imagem base64 para validação" });
  }

  try {
    const ai = getGeminiClient();

    // extract clean base64 data and mimeType
    let base64Data = image;
    let mimeType = "image/jpeg";
    if (image.includes(";base64,")) {
      const parts = image.split(";base64,");
      const match = parts[0].match(/data:(image\/\w+)/);
      if (match) mimeType = match[1];
      base64Data = parts[1];
    }

    if (!ai) {
      // Simulate real AI picture verification nicely
      const simulateVerification = {
        concrete: true,
        confidence: Math.floor(75 + Math.random() * 21), // 75-95%
        isThreat: true,
        concernLevel: category === "deslizamento" ? "critico" : category === "alagamento" ? "alto" : "medio",
        weatherMatch: `Consistente com o período do dia (${localTime}). Sem indícios de discrepâncias solares ou sombras desalinhadas.`,
        justification: `Verificação automatizada local (Offline): A imagem indica elementos físicos reais correspondentes à categoria '${category}' inserida para o bairro '${neighborhood}'.`,
        suggestedTitle: `${category === 'alagamento' ? 'Alagamento severo acumulado em sarjeta pluvial' : category === 'deslizamento' ? 'Instabilidade de encosta arenosa com ranhuras estruturais' : 'Obstrução física sob via pluvial registrada por cidadão'}`
      };
      return res.json({ analysis: simulateVerification, simulated: true });
    }

    const promptString = `Você é o Agente de Auditoria de Imagens e Auditor Climático da Defesa Civil do Recife.
Analise a imagem fornecida enviada por um cidadão reportando uma ocorrência da categoria '${category}' no bairro '${neighborhood}' em Recife.
Contexto do relato do cidadão:
- Geolocalização de envio: Latitude ${latitude || -8.0578}, Longitude ${longitude || -34.8829}
- Horário local de envio: ${localTime || new Date().toISOString()}

Avalie o seguinte e retorne um objeto JSON estrito com as propriedades exatas:
1. "concrete": booleano indicando se a imagem é real e mostra um fato concreto de perigo/risco, útil para a Defesa Civil de Recife, ao invés de ser falsa, gerada por IA, desconexa do tempo de Recife, ou mock. (Considere se o ambiente, clima ou iluminação é compatível com o horário reportado: ${localTime || 'horário não informado'} e coordenadas de Recife).
2. "confidence": número entre 0 e 100 indicando a confiabilidade da imagem de fato retratar o incidente local relatado.
3. "isThreat": booleano indicando se de fato o que está na imagem representa um perigo real de resiliência urbana (alagamento severo, deslizamento de terra, entulhos obstruindo rios, bueiro regurgitando, árvore caída ou prestes a cair).
4. "concernLevel": string ("baixo", "medio", "alto", "critico") refletindo o nível de gravidade dos riscos urbanos mostrados na cena.
5. "weatherMatch": string explicando se as condições do tempo na imagem (ex: chuva, nublado, sol, noite, dia, sombras) são consistentes com o horário extraído de '${localTime}'.
6. "justification": string curta em português justificando sua análise da imagem (por que ela é concreta ou possivelmente inadequada/falsa).
7. "suggestedTitle": de acordo com o que você vê na imagem, sugira um título conciso profissional para a ocorrência em português (ex: "Acúmulo de lama na calçada", "Alagamento atingindo nível de pneu", "Sem sinais visíveis de risco").

Certifique-se de que a resposta seja APENAS o JSON válido sem bloco de código markdown adicionais ou textos explicativos fora do JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        },
        {
          text: promptString
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const textOutput = response.text?.trim() || "{}";
    let analysisResult;
    try {
      analysisResult = JSON.parse(textOutput);
    } catch (parseError) {
      console.warn("Could not parse Gemini JSON response, extracting via regex:", textOutput);
      const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         analysisResult = JSON.parse(jsonMatch[0]);
      } else {
         throw new Error("Resposta inválida do Gemini (não formatada em JSON).");
      }
    }

    res.json({ analysis: analysisResult });
  } catch (error: any) {
    console.error("Gemini Image Verification error:", error);
    res.status(500).json({ error: "Erro ao auditar imagem com IA: " + error.message });
  }
});

// Interactive AI Citizen Chatbot in Portuguese (Trained in Recife Geography & Floods)
async function handleChatCore(messages: any[]) {
  const ai = getGeminiClient();

  // Prepare contextual instruction with emergency shelter, contacts, and flooded roads
  const systemInstruction = `Você é o Assessor Virtual de Resposta a Emergências do portal "Recife Resiliente", um canal inteligente e oficial da Prefeitura do Recife de assistência direta aos cidadãos durante crises urbanas (enchentes, alagamentos, deslizamentos, tempestades de maré).
Seu objetivo é instruir e salvar vidas de forma segura, clara, direta, empática e prestativa em Língua Portuguesa.

DIRETRIZES SOBRE VIAS E ROTAS ALTERNATIVAS (RUAS ALAGADAS E DESVIOS):
Você possui dados atualizados de monitoramento de tráfego e drenagem do Recife:
1. Avenida Marechal Mascarenhas de Morais (Imbiribeira): ALAGADA próximo à UPA, com bloqueio crítico. Rota alternativa viável: cruzar pela pista leste operada em mão dupla pela CTTU, ou utilizar a Avenida Sul para desvios secundários.
2. Avenida Sul (São José): ALAGADA debaixo do pontilhão ferroviário (bloqueio de alto risco). Rota alternativa viável: desviar pela Avenida Agamenon Magalhães/Rua São Miguel sentido Afogados e seguir por vias internas de São José.
3. Avenida Dr. José Rufino (Areias): SOB RISCO DE ALAGAMENTO (médio risco nas imediações do Colégio Maria Auxiliadora). Rota alternativa viável: pegar a Avenida Recife para acessar a BR-101 Sul ou seguir pela Avenida San Martin.
4. Avenida Governador Agamenon Magalhães (Espinheiro): ALAGADA nas faixas laterais junto ao cruzamento com a Av. Rui Barbosa. Rota alternativa viável: utilizar estritamente as faixas centrais (elevado rápido) ou desviar pelas vias internas das Graças (ex: Rua Amélia).
5. Avenida Caxangá (Cordeiro): SOB RISCO DE ALAGAMENTO de maré alta (região perto do Hospital Getúlio Vargas). Rota alternativa viável: seguir pelo corredor elevado exclusivo de ônibus/BRT (está seco e passável) ou desviar pela Rua Real da Torre.

Sempre que perguntarem se alguma dessas ruas está alagada ou se há risco, confirme o status consultando as regras acima e recomende EXPLICITAMENTE a rota alternativa de escape correspondente. Se perguntarem por alguma outra rua que não esteja nesta lista, declare de forma amigável que não recebemos alertas operacionais no nosso radar pluvial para essa localidade no momento, mas recomende cautela e desvios de poças profundas.

OUTRAS DIRETRIZES DE RESPOSTA:
- Se o cidadão relatar perigo iminente (água entrando em casa, deslizamento de encosta, estalos nas paredes), ordene de maneira clara e urgente que ele saia da habitação e ligue imediatamente para a Defesa Civil do Recife no número 0800 081 3400 (Ligação gratuita e 24h) ou Corpo de Bombeiros (193).
- Cite os abrigos ativos hoje do município caso perguntado:
  1. Escola Municipal Beberibe (Bairro Beberibe, Fone: 81 3355-1212)
  2. Quadra Poliesportiva do Ibura (Bairro Ibura, Fone: 81 3355-3434)
  3. Centro de Convivência Imbiribeira (Bairro Imbiribeira, Fone: 81 3355-5656)
  4. Paróquia Coração de Maria (Bairro Casa Amarela, Fone: 81 3355-7878)
- Forneça dicas cruciais de segurança para alagamentos: Evite contato físico com águas decorrentes de inundações para prevenir leptospirose; desligue o disjuntor principal de energia se a água subir próximo a tomadas; nunca dirija em ruas muito alagadas; evite áreas sob árvores e encostas instáveis.
- Seja sempre amigável e focado, evite jargões científicos indecifráveis, seja extremamente objetivo pois a pessoa pode estar lendo no celular sob uma tempestade com bateria fraca.
- ATENÇÃO: Nunca sob hipótese alguma retorne marcações markdown no texto, como negritos marcados com asteriscos '**' ou cabeçalhos marcados com '##' ou '###'. Escreva tudo de forma puramente textual sem decorações de marcação markdown.`;

  if (!ai) {
    // Safe offline chatbot simulation
    const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let answer = "";

    if (userMessage.includes("emergência") || userMessage.includes("perigo") || userMessage.includes("risco") || userMessage.includes("ajuda")) {
      answer = `ATENÇÃO CIDADÃO: Se você está enfrentando perigo iminente (rachaduras estruturais, estalos nas paredes da encosta, ou nível da água invadindo tomadas elétricas):
1. Evacue sua casa imediatamente. Pegue apenas eletroportáteis, documentos e remédios essenciais.
2. Contate a Defesa Civil do Recife ligando para 0800 081 3400 (serviço gratuito de plantão 24h).
3. Caso haja pessoas presas ou feridas, contate o Corpo de Bombeiros (193) ou SAMU (192).`;
    } else if (userMessage.includes("mascarenhas") || userMessage.includes("imbiribeira") || userMessage.includes("upa")) {
      answer = `⚠️ ALERTA DE VIA: A Avenida Marechal Mascarenhas de Morais (Imbiribeira) está atualmente classificada como ALAGADA com bloqueio crítico (especialmente perto da UPA).
🚙 ROTA ALTERNATIVA: Utilize a pista leste operada em mão dupla pela CTTU, ou mude o trajeto pela Avenida Sul para realizar desvios secundários.`;
    } else if (userMessage.includes("avenida sul") || userMessage.includes("av sul") || userMessage.includes("são josé") || userMessage.includes("sao jose")) {
      answer = `⚠️ ALERTA DE VIA: A Avenida Sul (São José) está ALAGADA sob o pontilhão da linha férrea, apresentando bloqueio severo e perigoso.
🚙 ROTA ALTERNATIVA: Desvie pela Avenida Agamenon Magalhães/Rua São Miguel sentido Afogados e siga por vias internas.`;
    } else if (userMessage.includes("josé rufino") || userMessage.includes("jose rufino") || userMessage.includes("areias")) {
      answer = `⚠️ ALERTA DE VIA: A Avenida Dr. José Rufino (Areias) apresenta RISCO DE ALAGAMENTO iminente perto do Colégio Maria Auxiliadora.
🚙 ROTA ALTERNATIVA: Pegue a Avenida Recife para acessar a BR-101 Sul ou siga pela Avenida San Martin.`;
    } else if (userMessage.includes("agamenon") || userMessage.includes("espinheiro")) {
      answer = `⚠️ ALERTA DE VIA: A Avenida Governador Agamenon Magalhães (Espinheiro) está ALAGADA nas faixas laterais (cruzamento com a Av. Rui Barbosa).
🚙 ROTA ALTERNATIVA: Utilize estritamente as faixas centrais (elevado de trânsito rápido) ou desvie por dentro das Graças usando a Rua Amélia.`;
    } else if (userMessage.includes("caxangá") || userMessage.includes("caxanga") || userMessage.includes("cordeiro")) {
      answer = `⚠️ ALERTA DE VIA: A Avenida Caxangá (Cordeiro) apresenta pontos de atenção e RISCO DE ALAGAMENTO por maré alta perto do Hospital Getúlio Vargas.
🚙 ROTA ALTERNATIVA: Prossiga preferencialmente pelo corredor exclusivo de BRT/ônibus (está seco e livre) ou faça o desvio por dentro pela Rua Real da Torre.`;
    } else if (userMessage.includes("rota") || userMessage.includes("alternativa") || userMessage.includes("desvio") || userMessage.includes("passar")) {
      answer = `Nosso radar pluvial monitora as seguintes vias e rotas alternativas no Recife hoje:
1. Av. Mascarenhas de Morais (Alagada/Crítica) -> Desvio pelo binário leste-oeste configurado pela CTTU.
2. Av. Sul (Alagada/Alto Risco) -> Desvio pela Agamenon Magalhães e Afogados.
3. Av. Dr. José Rufino (Sob Risco/Médio) -> Desvio pela Avenida Recife ou San Martin.
4. Av. Agamenon Magalhães no Espinheiro (Alagada nas Laterais) -> Desvio pelas faixas rápidas centrais ou Rua Amélia.
5. Av. Caxangá (Sob Risco/Baixo) -> Desvio usando o corredor exclusivo de BRT ou Rua Real da Torre.

Diga qual via deseja consultar ou informe seu destino para que possamos sugerir o caminho ideal!`;
    } else if (userMessage.includes("abrigo") || userMessage.includes("onde ir") || userMessage.includes("dormir")) {
      answer = `Prefeitura do Recife abriu pontos oficiais de acolhimento nesta emergência. Segue a lista ativa:
- Escola Municipal Beberibe (Zona Norte - Beberibe | Fone: 81 3355-1212)
- Quadra Poliesportiva do Ibura (Zona Sul/Encostas - Ibura | Fone: 81 3355-3434)
- Centro de Convivência Imbiribeira (SUL - Prox. UPA Imbiribeira | Fone: 81 3355-5656)
- Paróquia Coração de Maria (Norte/Noroeste - Casa Amarela | Fone: 81 3355-7878)

Dica de segurança: Planeje seu deslocamento por vias seguras e evite baixadas suscetíveis a inundações físicas.`;
    } else if (userMessage.includes("alagado") || userMessage.includes("chuva") || userMessage.includes("enchente")) {
      answer = `Orientações de Segurança do Recife Resiliente para Alagamentos e Chuvas:
- Prevenção à Saúde: Evite contato físico com águas pluviais alagadas de deságue urbano para prevenir o risco grave de Leptospirose.
- Rede Elétrica: Desligue a chave geral (disjuntor) caso a água alcance a altura das fiações rasteiras ou tomadas baixas da propriedade.
- Evite Mobilidade Arriscada: Não tente atravessar ruas alagadas ou pontes secundárias a pé ou em carros leves; a força da correnteza pode arrastar o veículo.
- Contato Civil de Alerta: Defesa Civil no 0800 081 3400.`;
    } else {
      answer = `Olá! Sou a Assistente Virtual do Recife Resiliente. Posso ajudar você com informações de vias, rotas alternativas e segurança em tempo real.

Pergunte-me por exemplo:
- "A Avenida Mascarenhas de Morais está alagada? Qual a rota alternativa?"
- "Onde fica o abrigo mais próximo?"
- "O que fazer se a água ameaçar invadir minha casa?"
- "Qual o telefone da Defesa Civil?"

(Nota: Chat em modo de resiliência ativo. Configure sua chave Gemini nos Secrets para respostas generativas baseadas em IA.)`;
    }

    return { text: answer, simulated: true };
  }

  // Format previous conversation into chat history for Gemini SDK chats API
  const formattedHistory = messages.slice(0, -1).map(m => ({
    role: m.role === "user" ? "user" as const : "model" as const,
    parts: [{ text: m.content }]
  }));

  const chatInstance = ai.chats.create({
    model: "gemini-3.5-flash",
    config: {
      systemInstruction,
      temperature: 0.7,
    },
    history: formattedHistory
  });

  const response = await chatInstance.sendMessage({
    message: messages[messages.length - 1].content
  });

  return { text: response.text || "Desculpe, não consegui processar sua resposta." };
}

app.post("/api/gemini/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }
  try {
    const result = await handleChatCore(messages);
    res.json(result);
  } catch (error: any) {
    console.error("Gemini Chat error:", error);
    res.status(500).json({ error: "Erro ao chamar o Gemini: " + error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }
  try {
    const result = await handleChatCore([{ role: "user", content: message }]);
    res.json(result);
  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Erro interno no chatbot da central." });
  }
});

// Serve frontend assets via Vite in development, or Static in Production
async function bootstrapServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(_dirname, "../dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Recife Resiliente API] Executando com sucesso na porta ${PORT}`);
  });
}

bootstrapServer().catch((err) => {
  console.error("Erro ao inicializar o servidor Express-Vite:", err);
});
