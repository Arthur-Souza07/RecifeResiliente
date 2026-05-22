export interface Incident {
  id: string;
  category: 'alagamento' | 'deslizamento' | 'arvore_caida' | 'bueiro_entupido' | 'queda_energia' | 'outros';
  title: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  severity: 'critico' | 'alto' | 'medio' | 'baixo';
  description: string;
  status: 'pendente' | 'em_atendimento' | 'resolvido';
  reportingTime: string;
  citizenName?: string;
  citizenPhone?: string;
  reporterType: 'citizen' | 'agent';
  agencyAssigned?: string;
}

export interface Sensor {
  id: string;
  name: string;
  riverName: string;
  neighborhood: string;
  currentLevel: number; // in meters
  warningLevel: number;
  criticalLevel: number;
  status: 'normal' | 'alerta' | 'critico';
  lastUpdated: string;
}

export interface WeatherStation {
  id: string;
  name: string;
  neighborhood: string;
  rainAmount24h: number; // in mm
  rainAmount3h: number; // in mm
  alertStatus: 'verde' | 'amarelo' | 'laranja' | 'vermelho';
}

export interface Shelter {
  id: string;
  name: string;
  neighborhood: string;
  capacity: number;
  currentOccupants: number;
  itemsNeeded: string[];
  phone: string;
  latitude: number;
  longitude: number;
  riskZone: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  neighborhood: string;
  availableBeds: number;
  doctorsOnDuty: number;
  generatorStatus: 'operacional' | 'falha' | 'desativado';
  status: 'normal' | 'sobrecarregado' | 'emergencia';
}

export interface FloodedStreet {
  id: string;
  name: string;
  neighborhood: string;
  status: 'alagado' | 'risco' | 'normal';
  severity: 'critico' | 'alto' | 'medio' | 'baixo';
  referencePoint: string;
  alternativeRoute: string;
  latitude: number;
  longitude: number;
}

export interface FleetUnit {
  id: string;
  code: string;
  service: 'CTTU' | 'Defesa Civil' | 'SAMU' | 'EMLURB' | 'Bombeiros';
  driver: string;
  latitude: number;
  longitude: number;
  status: 'disponivel' | 'atendimento' | 'deslocamento';
}

export interface CrisisState {
  incidents: Incident[];
  sensors: Sensor[];
  stations: WeatherStation[];
  shelters: Shelter[];
  hospitals: Hospital[];
  fleet: FleetUnit[];
  floodedStreets?: FloodedStreet[];
  updatedAt: string;
}
