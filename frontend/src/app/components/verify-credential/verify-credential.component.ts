// src/app/components/verify-credential/verify-credential.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { ContractService }  from '../../services/contract.service';
import { IpfsService }      from '../../services/ipfs.service';
import {
  CredentialDetails, VerifyStatus,
  CREDENTIAL_TYPE_LABELS, CREDENTIAL_STATUS_LABELS,
  CredentialType, CredentialStatus
} from '../../models/credential.model';

@Component({
  selector: 'app-verify-credential',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-credential.component.html',
})
export class VerifyCredentialComponent implements OnInit {
  contract   = inject(ContractService);
  ipfs       = inject(IpfsService);

  tokenIdInput = '';
  status       = signal<VerifyStatus>('idle');
  credential   = signal<CredentialDetails | null>(null);
  errorMsg     = signal<string | null>(null);
  totalCount   = signal<number>(0);
  showAudit    = signal<boolean>(false);

  typeLabels   = CREDENTIAL_TYPE_LABELS;
  statusLabels = CREDENTIAL_STATUS_LABELS;
  CredentialStatus = CredentialStatus;

  ngOnInit() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) { this.tokenIdInput = id; this.verify(); }
    this.contract.totalCredentials().then(n => this.totalCount.set(n)).catch(() => {});
  }

  async verify() {
    const id = parseInt(String(this.tokenIdInput).trim(), 10);
    if (!id || id <= 0) { this.errorMsg.set('Please enter a valid Credential ID.'); return; }

    this.status.set('loading');
    this.credential.set(null);
    this.errorMsg.set(null);
    this.showAudit.set(false);

    try {
      const data = await this.contract.verifyCredential(id);
      this.credential.set(data);
      if (!data.exists)                                    this.status.set('fake');
      else if (data.status === CredentialStatus.REVOKED)   this.status.set('revoked');
      else if (data.status === CredentialStatus.SUSPENDED) this.status.set('suspended');
      else                                                 this.status.set('valid');
    } catch (err: any) {
      this.errorMsg.set(err?.message ?? 'Verification failed.');
      this.status.set('idle');
    }
  }

  getBannerText(): string {
    switch (this.status()) {
      case 'valid':     return '✅ VALID CREDENTIAL — Officially Issued on Blockchain';
      case 'fake':      return '⛔ NOT FOUND — This credential is NOT registered on the blockchain';
      case 'revoked':   return '🚫 REVOKED — This credential has been permanently invalidated';
      case 'suspended': return '⏸️ SUSPENDED — This credential is temporarily under review';
      default: return '';
    }
  }

  getBannerClass(): string {
    switch (this.status()) {
      case 'valid':     return 'alert-success';
      case 'fake':      return 'alert-danger';
      case 'revoked':   return 'alert-danger';
      case 'suspended': return 'alert-warning';
      default: return '';
    }
  }

  getStatusBadgeClass(s: CredentialStatus): string {
    switch (s) {
      case CredentialStatus.ACTIVE:    return 'bg-success';
      case CredentialStatus.REVOKED:   return 'bg-danger';
      case CredentialStatus.SUSPENDED: return 'bg-warning text-dark';
    }
  }

  getTypeLabel(t: CredentialType): string { return this.typeLabels[t] ?? 'Unknown'; }
  getStatusLabel(s: CredentialStatus): string { return this.statusLabels[s] ?? 'Unknown'; }

  formatDate(d: Date): string {
    return d.toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' });
  }
  formatAddr(a: string): string { return a ? `${a.slice(0,8)}...${a.slice(-6)}` : ''; }
  toggleAudit() { this.showAudit.update(v => !v); }
  reset() {
    this.tokenIdInput = '';
    this.status.set('idle');
    this.credential.set(null);
    this.errorMsg.set(null);
  }
}