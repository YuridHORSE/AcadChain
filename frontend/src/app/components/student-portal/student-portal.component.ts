// src/app/components/student-portal/student-portal.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ContractService } from '../../services/contract.service';
import { CredentialType, CredentialDetails, CREDENTIAL_TYPE_LABELS } from '../../models/credential.model';

@Component({
  selector: 'app-student-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-portal.component.html',
})
export class StudentPortalComponent {
  contract = inject(ContractService);
  fb       = inject(FormBuilder);

  credentialTypes = Object.entries(CREDENTIAL_TYPE_LABELS).map(([v, l]) => ({
    value: Number(v) as CredentialType, label: l,
  }));

  form = this.fb.group({
    credentialType:  [CredentialType.DIPLOMA, Validators.required],
    studentId:       ['', Validators.required],
    program:         ['', Validators.required],
    institutionName: ['', Validators.required],
  });

  isSearching = signal(false);
  result      = signal<CredentialDetails | null>(null);
  notFound    = signal(false);
  errorMsg    = signal<string | null>(null);

  typeLabels = CREDENTIAL_TYPE_LABELS;

  async search() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isSearching.set(true);
    this.result.set(null);
    this.notFound.set(false);
    this.errorMsg.set(null);

    try {
      const v = this.form.value;
      const tokenId = await this.contract.findCredential(
        v.studentId!,
        v.program!,
        v.institutionName!,
        Number(v.credentialType) as CredentialType
      );

      if (!tokenId || tokenId === 0) {
        this.notFound.set(true);
        return;
      }

      const data = await this.contract.verifyCredential(tokenId);
      this.result.set(data);
    } catch (err: any) {
      this.errorMsg.set(err?.message ?? 'Search failed.');
    } finally {
      this.isSearching.set(false);
    }
  }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!(c?.invalid && c?.touched);
  }

  getTypeLabel(t: CredentialType): string { return this.typeLabels[t] ?? 'Unknown'; }

  formatDate(d: Date): string {
    return d.toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' });
  }

  reset() {
    this.result.set(null);
    this.notFound.set(false);
    this.errorMsg.set(null);
    this.form.reset({ credentialType: CredentialType.DIPLOMA });
  }
}