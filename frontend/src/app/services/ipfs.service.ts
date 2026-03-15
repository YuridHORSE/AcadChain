// src/app/services/ipfs.service.ts
import { Injectable } from '@angular/core';
import { CredentialMetadata } from '../models/credential.model';

@Injectable({ providedIn: 'root' })
export class IpfsService {

  async uploadCredentialMetadata(data: {
    studentName:    string;
    studentId:      string;
    program:        string;
    institution:    string;
    yearGraduated:  string;
    honors:         string;
    credentialType: string;
    imageFile:      File;
  }): Promise<string> {
    // Demo mode: skip IPFS upload, return a local placeholder URI
    const metadata: CredentialMetadata = {
      name:           `${data.credentialType} — ${data.studentName}`,
      studentId:      data.studentId,
      program:        data.program,
      institution:    data.institution,
      yearGraduated:  data.yearGraduated,
      honors:         data.honors,
      credentialType: data.credentialType,
      image:          '',
      description:    `Official academic credential issued by ${data.institution} via AcadChain.`,
    };
    const json = JSON.stringify(metadata);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    return url;
  }

  async fetchMetadata(uri: string): Promise<CredentialMetadata> {
    try {
      const res = await fetch(uri);
      return res.json();
    } catch {
      return {} as CredentialMetadata;
    }
  }

  ipfsToHttps(ipfsUri: string): string {
    if (!ipfsUri) return '';
    if (ipfsUri.startsWith('ipfs://'))
      return ipfsUri.replace('ipfs://', 'https://nftstorage.link/ipfs/');
    return ipfsUri;
  }
}