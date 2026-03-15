// src/app/services/credential.abi.ts
export const CREDENTIAL_REGISTRY_ABI = [
  // Events
  { "anonymous": false, "inputs": [{ "indexed": true, "name": "tokenId", "type": "uint256" }, { "indexed": false, "name": "credentialType", "type": "uint8" }, { "indexed": false, "name": "studentName", "type": "string" }, { "indexed": false, "name": "studentId", "type": "string" }, { "indexed": true, "name": "issuedBy", "type": "address" }, { "indexed": false, "name": "institution", "type": "string" }, { "indexed": false, "name": "timestamp", "type": "uint256" }], "name": "CredentialIssued", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "name": "tokenId", "type": "uint256" }, { "indexed": true, "name": "by", "type": "address" }, { "indexed": false, "name": "reason", "type": "string" }, { "indexed": false, "name": "timestamp", "type": "uint256" }], "name": "CredentialRevoked", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "name": "tokenId", "type": "uint256" }, { "indexed": true, "name": "by", "type": "address" }, { "indexed": false, "name": "reason", "type": "string" }, { "indexed": false, "name": "timestamp", "type": "uint256" }], "name": "CredentialSuspended", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "name": "tokenId", "type": "uint256" }, { "indexed": true, "name": "by", "type": "address" }, { "indexed": false, "name": "reason", "type": "string" }, { "indexed": false, "name": "timestamp", "type": "uint256" }], "name": "CredentialReinstated", "type": "event" },

  // Write functions
  {
    "inputs": [
      { "name": "credentialType", "type": "uint8"  },
      { "name": "studentName",    "type": "string" },
      { "name": "studentId",      "type": "string" },
      { "name": "program",        "type": "string" },
      { "name": "yearGraduated",  "type": "string" },
      { "name": "honors",         "type": "string" },
      { "name": "tokenURI_",      "type": "string" }
    ],
    "name": "issueCredential",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable", "type": "function"
  },
  { "inputs": [{ "name": "tokenId", "type": "uint256" }, { "name": "reason", "type": "string" }], "name": "revokeCredential",    "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "name": "tokenId", "type": "uint256" }, { "name": "reason", "type": "string" }], "name": "suspendCredential",   "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "name": "tokenId", "type": "uint256" }, { "name": "reason", "type": "string" }], "name": "reinstateCredential", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "name": "institutionWallet", "type": "address" }, { "name": "name", "type": "string" }, { "name": "region", "type": "string" }], "name": "authorizeInstitution",    "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "name": "institutionWallet", "type": "address" }], "name": "revokeInstitutionAccess", "outputs": [], "stateMutability": "nonpayable", "type": "function" },

  // Read functions
  {
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "name": "verifyCredential",
    "outputs": [{
      "components": [
        { "name": "exists",          "type": "bool"    },
        { "name": "isRevoked",       "type": "bool"    },
        { "name": "isSuspended",     "type": "bool"    },
        { "name": "credentialType",  "type": "uint8"   },
        { "name": "studentName",     "type": "string"  },
        { "name": "studentId",       "type": "string"  },
        { "name": "program",         "type": "string"  },
        { "name": "institution",     "type": "string"  },
        { "name": "yearGraduated",   "type": "string"  },
        { "name": "honors",          "type": "string"  },
        { "name": "verificationUrl", "type": "string"  },
        { "name": "issuedBy",        "type": "address" },
        { "name": "issuedAt",        "type": "uint256" }
      ],
      "name": "", "type": "tuple"
    }],
    "stateMutability": "view", "type": "function"
  },
  { "inputs": [{ "name": "studentId", "type": "string" }, { "name": "program", "type": "string" }, { "name": "institutionName", "type": "string" }, { "name": "credentialType_", "type": "uint8" }], "name": "findCredential", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  {
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "name": "getAuditLog",
    "outputs": [{
      "components": [
        { "name": "status",    "type": "uint8"   },
        { "name": "reason",    "type": "string"  },
        { "name": "changedBy", "type": "address" },
        { "name": "timestamp", "type": "uint256" }
      ],
      "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "name": "wallet", "type": "address" }],
    "name": "getInstitution",
    "outputs": [
      { "name": "name",         "type": "string"  },
      { "name": "region",       "type": "string"  },
      { "name": "isAuthorized", "type": "bool"    },
      { "name": "totalIssued",  "type": "uint256" },
      { "name": "totalRevoked", "type": "uint256" }
    ],
    "stateMutability": "view", "type": "function"
  },
  { "inputs": [], "name": "totalCredentials", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "name": "tokenId", "type": "uint256" }], "name": "tokenURI", "outputs": [{ "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [{ "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }
];