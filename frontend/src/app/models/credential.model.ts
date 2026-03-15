// src/app/models/credential.model.ts

export enum CredentialType {
  DIPLOMA              = 0,
  TRANSCRIPT           = 1,
  CERTIFICATE          = 2,
  HONOR_AWARD          = 3,
  PROFESSIONAL_LICENSE = 4,
}

export enum CredentialStatus {
  ACTIVE    = 0,
  REVOKED   = 1,
  SUSPENDED = 2,
}

export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  [CredentialType.DIPLOMA]:              'Diploma',
  [CredentialType.TRANSCRIPT]:           'Transcript of Records (TOR)',
  [CredentialType.CERTIFICATE]:          'Certificate of Completion',
  [CredentialType.HONOR_AWARD]:          'Honor / Award',
  [CredentialType.PROFESSIONAL_LICENSE]: 'Professional License',
};

export const CREDENTIAL_STATUS_LABELS: Record<CredentialStatus, string> = {
  [CredentialStatus.ACTIVE]:    'Active',
  [CredentialStatus.REVOKED]:   'Revoked',
  [CredentialStatus.SUSPENDED]: 'Suspended',
};

export interface CredentialDetails {
  tokenId:         number;
  exists:          boolean;
  status:          CredentialStatus;
  credentialType:  CredentialType;
  studentName:     string;
  studentId:       string;
  program:         string;
  institution:     string;
  yearGraduated:   string;
  honors:          string;
  verificationUrl: string;
  issuedBy:        string;
  issuedAt:        Date;
  tokenURI?:       string;
  ipfsMetadata?:   CredentialMetadata;
  auditLog?:       AuditEntry[];
}

export interface AuditEntry {
  status:    CredentialStatus;
  reason:    string;
  changedBy: string;
  timestamp: Date;
}

export interface CredentialMetadata {
  name:           string;
  studentId:      string;
  program:        string;
  institution:    string;
  yearGraduated:  string;
  honors:         string;
  credentialType: string;
  image:          string;
  description?:   string;
}

export interface IssueCredentialForm {
  credentialType:       CredentialType;
  studentName:          string;
  studentId:            string;
  studentWalletAddress: string;
  program:              string;
  yearGraduated:        string;
  honors:               string;
  image:                File | null;
}

export type VerifyStatus = 'valid' | 'fake' | 'revoked' | 'suspended' | 'idle' | 'loading';