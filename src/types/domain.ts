export interface Domain {
  id: string;
  domain: string;
  registrar?: string;
  expiresAt?: Date;
  dnsProvider?: string;
  domainStatus?: string;
  status: DomainStatus;
  lastCheck?: Date;
  isImportant?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DomainStatus = 'normal' | 'expiring' | 'expired' | 'failed' | 'unregistered';

export interface WhoisData {
  domain: string;
  registrar?: string;
  expirationDate?: Date;
  creationDate?: Date;
  status?: string[];
  nameServers?: string[];
}

export interface ImportResult {
  success: Domain[];
  errors: string[];
  total: number;
} 