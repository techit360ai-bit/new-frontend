import { domainGet, domainPost, domainPatch } from "@/lib/domainApi";

export interface Contract {
  id: string;
  founderId: string;
  collaboratorId: string;
  collaboratorName: string;
  projectName: string;
  role: string;
  equityPercent: number;
  weeklyHours: number;
  skills: string[];
  vestingMonths: number;
  cliffMonths: number;
  status: "draft" | "pending-signature" | "pending-countersign" | "active";
  founderSignedAt: string | null;
  founderSignature: string | null;
  collaboratorSignedAt: string | null;
  collaboratorSignature: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractPayload {
  collaboratorId: string;
  collaboratorName: string;
  projectName: string;
  role: string;
  equityPercent: number;
  weeklyHours: number;
  skills: string[];
  vestingMonths: number;
  cliffMonths: number;
}

export async function fetchContracts(): Promise<Contract[]> {
  const data = await domainGet<{ contracts: Contract[] }>("/contracts");
  return data.contracts ?? [];
}

export async function createContract(payload: CreateContractPayload): Promise<Contract> {
  const data = await domainPost<{ ok: true; contract: Contract }>("/contracts", payload);
  return data.contract;
}

export async function fetchContract(id: string): Promise<Contract> {
  const data = await domainGet<{ contract: Contract }>(`/contracts/${id}`);
  return data.contract;
}

export async function signContract(id: string): Promise<Contract> {
  const data = await domainPatch<{ ok: true; contract: Contract }>(`/contracts/${id}/sign`);
  return data.contract;
}

export async function countersignContract(id: string): Promise<Contract> {
  const data = await domainPatch<{ ok: true; contract: Contract }>(`/contracts/${id}/countersign`);
  return data.contract;
}
