export interface AgentSeed {
  id: string;
  name: string;
  address: string;
  city: string;
  contactNumber: string;
  email: string;
  commissionRate: number;
}

export const AGENTS_SEED: AgentSeed[] = [
  { id: "AGT-001", name: "James Thornton", address: "14 Victoria Street", city: "London", contactNumber: "+44 207 456 7890", email: "james.thornton@agency.co.uk", commissionRate: 8 },
  { id: "AGT-002", name: "Sophie Williams", address: "7 Park Lane", city: "Manchester", contactNumber: "+44 161 234 5678", email: "sophie.w@salesrep.co.uk", commissionRate: 12 },
  { id: "AGT-003", name: "Richard Blake", address: "22 Castle Road", city: "Edinburgh", contactNumber: "+44 131 667 8899", email: "r.blake@wholesale.co.uk", commissionRate: 3 },
  { id: "AGT-004", name: "Emma Clarke", address: "5 Broad Street", city: "Birmingham", contactNumber: "+44 121 789 0011", email: "emma.clarke@agents.co.uk", commissionRate: 15 },
  { id: "AGT-005", name: "Daniel Morris", address: "33 Ocean Drive", city: "Brighton", contactNumber: "+44 1273 445 678", email: "dmorris@jewelsales.co.uk", commissionRate: 6 },
  { id: "AGT-006", name: "Fiona Reid", address: "9 Market Square", city: "Leeds", contactNumber: "+44 113 332 1122", email: "fiona.reid@retailreps.co.uk", commissionRate: 9 },
  { id: "AGT-007", name: "Thomas Grant", address: "18 Harbour View", city: "Bristol", contactNumber: "+44 117 556 7788", email: "tgrant@agentnetwork.co.uk", commissionRate: 2 },
  { id: "AGT-008", name: "Alice Patterson", address: "41 Queen Street", city: "Glasgow", contactNumber: "+44 141 998 7766", email: "alice.p@salesforce.co.uk", commissionRate: 21 },
];
