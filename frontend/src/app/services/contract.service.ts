// src/app/services/contract.service.ts
import { Injectable } from '@angular/core';
import { ethers }     from 'ethers';
import { WalletService }           from './wallet.service';
import { IpfsService }             from './ipfs.service';
import { CREDENTIAL_REGISTRY_ABI } from './credential.abi';
import { environment }             from '../../environments/environment';
import {
  CredentialDetails, CredentialType, CredentialStatus,
  CREDENTIAL_TYPE_LABELS, AuditEntry
} from '../models/credential.model';

@Injectable({ providedIn: 'root' })
export class ContractService {

  private readonly address = environment.CONTRACT_ADDRESS;

  constructor(
    private wallet: WalletService,
    private ipfs:   IpfsService,
  ) {}

  private getReadContract(): ethers.Contract {
    const provider = this.wallet.getProvider()
      ?? new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    return new ethers.Contract(this.address, CREDENTIAL_REGISTRY_ABI, provider);
  }

  private getWriteContract(): ethers.Contract {
    const signer = this.wallet.getSigner();
    if (!signer) throw new Error('Wallet not connected. Please connect MetaMask.');
    return new ethers.Contract(this.address, CREDENTIAL_REGISTRY_ABI, signer);
  }

  async checkIsInstitution(address: string): Promise<{ isInstitution: boolean; name: string }> {
    try {
      const r = await this.getReadContract()['getInstitution'](address);
      return { isInstitution: r.isAuthorized, name: r.name };
    } catch { return { isInstitution: false, name: '' }; }
  }

  async issueCredential(data: {
    credentialType:       CredentialType;
    studentName:          string;
    studentId:            string;
    studentWalletAddress: string;
    program:              string;
    yearGraduated:        string;
    honors:               string;
    imageFile:            File;
    institutionName:      string;
  }): Promise<{ tokenId: number; txHash: string; verifyUrl: string }> {

    // 1. Upload metadata to IPFS
    const tokenURI = await this.ipfs.uploadCredentialMetadata({
      studentName:    data.studentName,
      studentId:      data.studentId,
      program:        data.program,
      institution:    data.institutionName,
      yearGraduated:  data.yearGraduated,
      honors:         data.honors,
      credentialType: CREDENTIAL_TYPE_LABELS[data.credentialType],
      imageFile:      data.imageFile,
    });

    const baseVerifyUrl = `${window.location.origin}/verify`;

    // 2. Call smart contract
    const contract = this.getWriteContract();
    const tx: ethers.ContractTransactionResponse = await contract['issueCredential'](
      data.credentialType,
      data.studentName,
      data.studentId,
      data.program,
      data.yearGraduated,
      data.honors,
      tokenURI
    );

    const receipt = await tx.wait();

    // 3. Parse tokenId from event
    let tokenId = 0;
    if (receipt?.logs) {
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === 'CredentialIssued') {
            tokenId = Number(parsed.args['tokenId']);
            break;
          }
        } catch {}
      }
    }

    const verifyUrl = `${baseVerifyUrl}?id=${tokenId}`;
    return { tokenId, txHash: tx.hash, verifyUrl };
  }

  async verifyCredential(tokenId: number): Promise<CredentialDetails> {
    const contract = this.getReadContract();
    const r        = await contract['verifyCredential'](tokenId);

    const details: CredentialDetails = {
      tokenId,
      exists:          r.exists,
      status:          r.isRevoked
                         ? CredentialStatus.REVOKED
                         : r.isSuspended
                           ? CredentialStatus.SUSPENDED
                           : CredentialStatus.ACTIVE,
      credentialType:  Number(r.credentialType) as CredentialType,
      studentName:     r.studentName,
      studentId:       r.studentId,
      program:         r.program,
      institution:     r.institution,
      yearGraduated:   r.yearGraduated,
      honors:          r.honors,
      verificationUrl: r.verificationUrl,
      issuedBy:        r.issuedBy,
      issuedAt:        new Date(Number(r.issuedAt) * 1000),
    };

    if (details.exists) {
      try {
        const rawLog = await contract['getAuditLog'](tokenId);
        details.auditLog = rawLog.map((e: any) => ({
          status:    Number(e.status) as CredentialStatus,
          reason:    e.reason,
          changedBy: e.changedBy,
          timestamp: new Date(Number(e.timestamp) * 1000),
        } as AuditEntry));
      } catch {}

      try {
        const uri = await contract['tokenURI'](tokenId);
        details.tokenURI = uri;
        if (uri.startsWith('ipfs://'))
          details.ipfsMetadata = await this.ipfs.fetchMetadata(uri);
      } catch {}
    }

    return details;
  }

  async findCredential(
    studentId: string, program: string,
    institutionName: string, credentialType: CredentialType
  ): Promise<number> {
    return Number(await this.getReadContract()['findCredential'](
      studentId, program, institutionName, credentialType
    ));
  }

  async revokeCredential(tokenId: number, reason: string): Promise<string> {
    const tx = await this.getWriteContract()['revokeCredential'](tokenId, reason);
    await tx.wait(); return tx.hash;
  }

  async suspendCredential(tokenId: number, reason: string): Promise<string> {
    const tx = await this.getWriteContract()['suspendCredential'](tokenId, reason);
    await tx.wait(); return tx.hash;
  }

  async reinstateCredential(tokenId: number, reason: string): Promise<string> {
    const tx = await this.getWriteContract()['reinstateCredential'](tokenId, reason);
    await tx.wait(); return tx.hash;
  }

  async totalCredentials(): Promise<number> {
    return Number(await this.getReadContract()['totalCredentials']());
  }
}