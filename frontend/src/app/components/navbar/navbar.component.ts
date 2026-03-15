// src/app/components/navbar/navbar.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WalletService }   from '../../services/wallet.service';
import { ContractService } from '../../services/contract.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  wallet   = inject(WalletService);
  contract = inject(ContractService);

  isConnecting = false;
  errorMsg: string | null = null;

  ngOnInit() {}

  async connect() {
    this.isConnecting = true;
    this.errorMsg     = null;
    try {
      const address = await this.wallet.connectWallet();
      const { isInstitution, name } = await this.contract.checkIsInstitution(address);
      if (isInstitution) this.wallet.setInstitution(name);
    } catch (err: any) {
      this.errorMsg = err?.message ?? 'Failed to connect wallet.';
    } finally {
      this.isConnecting = false;
    }
  }

  disconnect() { this.wallet.disconnect(); }

  shortAddress(addr: string): string {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  }
}