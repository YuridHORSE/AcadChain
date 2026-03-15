// src/app/components/issuer-portal/issuer-portal.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WalletService }   from '../../services/wallet.service';
import { ContractService } from '../../services/contract.service';
import { CredentialType, CREDENTIAL_TYPE_LABELS } from '../../models/credential.model';

interface IssuanceResult { tokenId: number; txHash: string; verifyUrl: string; }

@Component({
  selector: 'app-issuer-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './issuer-portal.component.html',
})
export class IssuerPortalComponent {
  wallet   = inject(WalletService);
  contract = inject(ContractService);
  fb       = inject(FormBuilder);

  credentialTypes = Object.entries(CREDENTIAL_TYPE_LABELS).map(([v, l]) => ({
    value: Number(v) as CredentialType, label: l,
  }));
  honorsOptions = ['', 'Summa Cum Laude', 'Magna Cum Laude', 'Cum Laude',
                   "Dean's List", 'With Honors', 'N/A'];

  form = this.fb.group({
    credentialType:       [CredentialType.DIPLOMA, Validators.required],
    studentName:          ['', [Validators.required, Validators.minLength(2)]],
    studentId:            ['', Validators.required],
    studentWalletAddress: ['', [Validators.required, Validators.pattern(/^0x[a-fA-F0-9]{40}$/)]],
    program:              ['', Validators.required],
    yearGraduated:        ['', Validators.required],
    honors:               [''],
  });

  isSubmitting    = signal(false);
  successResult   = signal<IssuanceResult | null>(null);
  errorMsg        = signal<string | null>(null);
  imageFile       = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { this.errorMsg.set('File must be under 10MB.'); return; }
    this.imageFile.set(file);
    if (file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = e => this.imagePreviewUrl.set(e.target?.result as string);
      r.readAsDataURL(file);
    } else { this.imagePreviewUrl.set(null); }
    this.errorMsg.set(null);
  }

  async submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.imageFile()) { this.errorMsg.set('Please upload the credential document or image.'); return; }

    this.isSubmitting.set(true);
    this.errorMsg.set(null);
    this.successResult.set(null);

    try {
      const v = this.form.value;
      const result = await this.contract.issueCredential({
        credentialType:       Number(v.credentialType) as CredentialType,
        studentName:          v.studentName!,
        studentId:            v.studentId!,
        studentWalletAddress: v.studentWalletAddress!,
        program:              v.program!,
        yearGraduated:        v.yearGraduated!,
        honors:               v.honors ?? '',
        imageFile:            this.imageFile()!,
        institutionName:      this.wallet.institutionName() ?? '',
      });
      this.successResult.set(result);
      this.form.reset({ credentialType: CredentialType.DIPLOMA, honors: '' });
      this.imageFile.set(null);
      this.imagePreviewUrl.set(null);
    } catch (err: any) {
      this.errorMsg.set(err?.reason ?? err?.message ?? 'Transaction failed.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!(c?.invalid && c?.touched);
  }

  reset() { this.successResult.set(null); this.errorMsg.set(null); }
  sepoliaUrl(h: string) { return `https://sepolia.etherscan.io/tx/${h}`; }
}