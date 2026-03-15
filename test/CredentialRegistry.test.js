//test/CredentialRegistry.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialRegistry", function () {
  let registry;
  let owner, institution, institution2, stranger;

  const CredType = { DIPLOMA: 0, TRANSCRIPT: 1, CERTIFICATE: 2, HONOR_AWARD: 3, PROFESSIONAL_LICENSE: 4 };

  const SAMPLE = {
    type:    CredType.DIPLOMA,
    name:    "Juan Dela Cruz",
    id:      "2020-12345",
    program: "BS Computer Science",
    year:    "2024",
    honors:  "Cum Laude",
    uri:     "ipfs://QmSampleCID/metadata.json",
  };

  beforeEach(async () => {
    [owner, institution, institution2, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CredentialRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  // Deployment 
  describe("Deployment", () => {
    it("sets the deployer as contract owner", async () => {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("automatically authorizes the deployer as an institution", async () => {
      const inst = await registry.institutions(owner.address);
      expect(inst.isAuthorized).to.be.true;
    });

    it("starts with zero credentials issued", async () => {
      expect(await registry.totalCredentials()).to.equal(0);
    });
  });

  // Institution Authorization 
  describe("Institution Authorization", () => {
    it("owner can authorize an institution", async () => {
      await registry.authorizeInstitution(
        institution.address, "UP Diliman", "NCR"
      );
      const inst = await registry.institutions(institution.address);
      expect(inst.isAuthorized).to.be.true;
      expect(inst.name).to.equal("UP Diliman");
    });

    it("non-owner cannot authorize an institution", async () => {
      await expect(
        registry.connect(stranger).authorizeInstitution(
          institution.address, "Fake School", "NCR"
        )
      ).to.be.reverted;
    });

    it("owner can revoke an institution", async () => {
      await registry.authorizeInstitution(institution.address, "UP Diliman", "NCR");
      await registry.revokeInstitutionAccess(institution.address);
      const inst = await registry.institutions(institution.address);
      expect(inst.isAuthorized).to.be.false;
    });
  });

  // Credential Issuance 
  describe("Credential Issuance", () => {
    beforeEach(async () => {
      await registry.authorizeInstitution(institution.address, "UP Diliman", "NCR");
    });

    it("authorized institution can issue a credential", async () => {
      await registry.connect(institution).issueCredential(
        SAMPLE.type, SAMPLE.name, SAMPLE.id,
        SAMPLE.program, SAMPLE.year, SAMPLE.honors, SAMPLE.uri
      );
      expect(await registry.totalCredentials()).to.equal(1);
    });

    it("unauthorized wallet cannot issue a credential", async () => {
      await expect(
        registry.connect(stranger).issueCredential(
          SAMPLE.type, SAMPLE.name, SAMPLE.id,
          SAMPLE.program, SAMPLE.year, SAMPLE.honors, SAMPLE.uri
        )
      ).to.be.revertedWith("AcadChain: caller is not an authorized institution");
    });

    it("emits CredentialIssued event", async () => {
      await expect(
        registry.connect(institution).issueCredential(
          SAMPLE.type, SAMPLE.name, SAMPLE.id,
          SAMPLE.program, SAMPLE.year, SAMPLE.honors, SAMPLE.uri
        )
      ).to.emit(registry, "CredentialIssued");
    });

    it("prevents duplicate credential issuance for same student + program + type", async () => {
      await registry.connect(institution).issueCredential(
        SAMPLE.type, SAMPLE.name, SAMPLE.id,
        SAMPLE.program, SAMPLE.year, SAMPLE.honors, SAMPLE.uri
      );
      await expect(
        registry.connect(institution).issueCredential(
          SAMPLE.type, SAMPLE.name, SAMPLE.id,
          SAMPLE.program, SAMPLE.year, SAMPLE.honors, SAMPLE.uri
        )
      ).to.be.revertedWith("AcadChain: credential already issued");
    });

    it("allows same student to have different credential types", async () => {
      await registry.connect(institution).issueCredential(
        CredType.DIPLOMA, SAMPLE.name, SAMPLE.id,
        SAMPLE.program, SAMPLE.year, SAMPLE.honors, SAMPLE.uri
      );
      await registry.connect(institution).issueCredential(
        CredType.TRANSCRIPT, SAMPLE.name, SAMPLE.id,
        SAMPLE.program, SAMPLE.year, "", SAMPLE.uri
      );
      expect(await registry.totalCredentials()).to.equal(2);
    });

    it("stores correct credential data on-chain", async () => {
      await registry.connect(institution).issueCredential(
        SAMPLE.type, SAMPLE.name, SAMPLE.id,
        SAMPLE.program, SAMPLE.year, SAMPLE.honors, SAMPLE.uri
      );
      const result = await registry.verifyCredential(1);
      expect(result.studentName).to.equal(SAMPLE.name);
      expect(result.program).to.equal(SAMPLE.program);
      expect(result.honors).to.equal(SAMPLE.honors);
      expect(result.institution).to.equal("UP Diliman");
    });
  });

  // Credential Verification 
  describe("Credential Verification", () => {
    beforeEach(async () => {
      await registry.authorizeInstitution(institution.address, "UP Diliman", "NCR");
      await registry.connect(institution).issueCredential(
        SAMPLE.type, SAMPLE.name, SAMPLE.id,
        SAMPLE.program, SAMPLE.year, SAMPLE.honors, SAMPLE.uri
      );
    });

    it("verifies a legitimate credential", async () => {
      const result = await registry.verifyCredential(1);
      expect(result.exists).to.be.true;
      expect(result.isRevoked).to.be.false;
      expect(result.studentName).to.equal(SAMPLE.name);
    });

    it("returns exists=false for a non-existent credential", async () => {
      const result = await registry.verifyCredential(9999);
      expect(result.exists).to.be.false;
    });

    it("anyone can verify without a wallet (stranger can call)", async () => {
      const result = await registry.connect(stranger).verifyCredential(1);
      expect(result.exists).to.be.true;
    });

    it("findCredential returns the correct tokenId", async () => {
      const tokenId = await registry.findCredential(
        SAMPLE.id, SAMPLE.program, "UP Diliman", SAMPLE.type
      );
      expect(tokenId).to.equal(1);
    });

    it("findCredential returns 0 for non-existent credential", async () => {
      const tokenId = await registry.findCredential(
        "fake-id", "Fake Program", "Fake School", CredType.DIPLOMA
      );
      expect(tokenId).to.equal(0);
    });
  });

  // Credential Revocation 
  describe("Credential Revocation", () => {
    beforeEach(async () => {
      await registry.authorizeInstitution(institution.address, "UP Diliman", "NCR");
      await registry.connect(institution).issueCredential(
        SAMPLE.type, SAMPLE.name, SAMPLE.id,
        SAMPLE.program, SAMPLE.year, SAMPLE.honors, SAMPLE.uri
      );
    });

    it("issuing institution can revoke a credential", async () => {
      await registry.connect(institution).revokeCredential(1, "Academic dishonesty");
      const result = await registry.verifyCredential(1);
      expect(result.isRevoked).to.be.true;
    });

    it("contract owner can revoke any credential", async () => {
      await registry.connect(owner).revokeCredential(1, "Admin revocation");
      const result = await registry.verifyCredential(1);
      expect(result.isRevoked).to.be.true;
    });

    it("stranger cannot revoke a credential", async () => {
      await expect(
        registry.connect(stranger).revokeCredential(1, "Malicious attempt")
      ).to.be.revertedWith("AcadChain: not authorized to revoke this credential");
    });

    it("cannot revoke an already revoked credential", async () => {
      await registry.connect(institution).revokeCredential(1, "First revocation");
      await expect(
        registry.connect(institution).revokeCredential(1, "Second attempt")
      ).to.be.revertedWith("AcadChain: already revoked");
    });

    it("emits CredentialRevoked event with reason", async () => {
      await expect(
        registry.connect(institution).revokeCredential(1, "Plagiarism found")
      ).to.emit(registry, "CredentialRevoked").withArgs(
        1, institution.address, "Plagiarism found",
        await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
      );
    });
  });
});