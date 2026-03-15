// src/app/services/wallet.service.ts
declare global { interface Window { ethereum?: any; } }
import { Injectable, signal } from '@angular/core';
import { ethers } from 'ethers';

@Injectable({ providedIn: 'root' })
export class WalletService {

  connectedAddress = signal<string | null>(null);
  isInstitution    = signal<boolean>(false);
  institutionName  = signal<string | null>(null);
  networkName      = signal<string>('Not connected');

  private provider: ethers.BrowserProvider | null = null;
  private signer:   ethers.JsonRpcSigner   | null = null;

  async connectWallet(): Promise<string> {
    if (!window.ethereum) throw new Error('MetaMask not found. Please install MetaMask.');

    this.provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await this.provider.send('eth_requestAccounts', []);
    this.signer    = await this.provider.getSigner();

    const address = accounts[0];
    this.connectedAddress.set(address);

    const network = await this.provider.getNetwork();
    this.networkName.set(this.getNetworkLabel(network.chainId));

    // Listen for account/network changes
    window.ethereum.on('accountsChanged', (accs: string[]) => {
      if (accs.length === 0) this.disconnect();
      else { this.connectedAddress.set(accs[0]); this.refreshInstitution(accs[0]); }
    });
    window.ethereum.on('chainChanged', () => window.location.reload());

    return address;
  }

  async refreshInstitution(address: string) {
    this.isInstitution.set(false);
    this.institutionName.set(null);
  }

  setInstitution(name: string) {
    this.isInstitution.set(true);
    this.institutionName.set(name);
  }

  disconnect() {
    this.connectedAddress.set(null);
    this.isInstitution.set(false);
    this.institutionName.set(null);
    this.networkName.set('Not connected');
    this.provider = null;
    this.signer   = null;
  }

  getProvider(): ethers.BrowserProvider | null { return this.provider; }
  getSigner():   ethers.JsonRpcSigner   | null { return this.signer;   }

  private getNetworkLabel(chainId: bigint): string {
    switch (chainId) {
      case 1337n:      return 'Ganache Local';
      case 11155111n:  return 'Sepolia Testnet';
      case 1n:         return 'Ethereum Mainnet';
      default:         return `Chain ${chainId}`;
    }
  }
}