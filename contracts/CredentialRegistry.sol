// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CredentialRegistry is ERC721URIStorage, Ownable {

    enum CredentialType {
        DIPLOMA,
        TRANSCRIPT,
        CERTIFICATE,
        HONOR_AWARD,
        PROFESSIONAL_LICENSE
    }

    enum CredentialStatus {
        ACTIVE,
        REVOKED,
        SUSPENDED
    }

    struct Credential {
        uint256        tokenId;
        CredentialType credentialType;
        CredentialStatus status;
        string         studentName;
        string         studentId;
        string         program;
        string         institution;
        string         yearGraduated;
        string         honors;
        string         verificationUrl;
        address        issuedBy;
        uint256        issuedAt;
    }

    struct Institution {
        string  name;
        string  region;
        bool    isAuthorized;
        uint256 totalIssued;
        uint256 totalRevoked;
    }

    struct AuditEntry {
        CredentialStatus status;
        string           reason;
        address          changedBy;
        uint256          timestamp;
    }

    struct VerifyResult {
        bool   exists;
        bool   isRevoked;
        bool   isSuspended;
        uint8  credentialType;
        string studentName;
        string studentId;
        string program;
        string institution;
        string yearGraduated;
        string honors;
        string verificationUrl;
        address issuedBy;
        uint256 issuedAt;
    }

    uint256 private _tokenIdCounter;

    mapping(uint256 => Credential)   public credentials;
    mapping(address => Institution)  public institutions;
    mapping(bytes32 => uint256)      public credentialHash;
    mapping(uint256 => AuditEntry[]) public auditLog;

    event CredentialIssued(
        uint256 indexed tokenId,
        CredentialType  credentialType,
        string          studentName,
        string          studentId,
        address indexed issuedBy,
        string          institution,
        uint256         timestamp
    );
    event CredentialRevoked(uint256 indexed tokenId, address indexed by, string reason, uint256 timestamp);
    event CredentialSuspended(uint256 indexed tokenId, address indexed by, string reason, uint256 timestamp);
    event CredentialReinstated(uint256 indexed tokenId, address indexed by, string reason, uint256 timestamp);
    event InstitutionAuthorized(address indexed wallet, string name, string region);
    event InstitutionRevoked(address indexed wallet);

    modifier onlyInstitution() {
        require(
            institutions[msg.sender].isAuthorized,
            "AcadChain: caller is not an authorized institution"
        );
        _;
    }

    modifier credentialExists(uint256 tokenId) {
        require(
            tokenId > 0 && tokenId <= _tokenIdCounter,
            "AcadChain: credential does not exist"
        );
        _;
    }

    constructor() ERC721("AcadChain", "ACAD") {
        institutions[msg.sender] = Institution({
            name: "Admin / Test Institution",
            region: "NCR",
            isAuthorized: true,
            totalIssued: 0,
            totalRevoked: 0
        });
        emit InstitutionAuthorized(msg.sender, "Admin / Test Institution", "NCR");
    }

    // ─── Admin Functions ──────────────────────────────────────────────────────

    function authorizeInstitution(
        address institutionWallet,
        string memory name,
        string memory region
    ) external onlyOwner {
        require(institutionWallet != address(0), "Invalid address");
        require(bytes(name).length > 0, "Name required");
        institutions[institutionWallet] = Institution({
            name: name,
            region: region,
            isAuthorized: true,
            totalIssued: 0,
            totalRevoked: 0
        });
        emit InstitutionAuthorized(institutionWallet, name, region);
    }

    function revokeInstitutionAccess(address institutionWallet) external onlyOwner {
        institutions[institutionWallet].isAuthorized = false;
        emit InstitutionRevoked(institutionWallet);
    }

    // ─── Issue Credential ─────────────────────────────────────────────────────

    function issueCredential(
        CredentialType credentialType,
        string memory  studentName,
        string memory  studentId,
        string memory  program,
        string memory  yearGraduated,
        string memory  honors,
        string memory  tokenURI_
    ) external onlyInstitution returns (uint256) {
        require(bytes(studentName).length > 0,   "Student name required");
        require(bytes(studentId).length > 0,     "Student ID required");
        require(bytes(program).length > 0,       "Program required");
        require(bytes(yearGraduated).length > 0, "Year required");
        require(bytes(tokenURI_).length > 0,     "Token URI required");

        string memory institutionName = institutions[msg.sender].name;

        bytes32 dupHash = keccak256(abi.encodePacked(
            studentId, program, institutionName, uint8(credentialType)
        ));
        require(credentialHash[dupHash] == 0, "AcadChain: credential already issued");

        _tokenIdCounter++;
        uint256 newId = _tokenIdCounter;

        _safeMint(msg.sender, newId);
        _setTokenURI(newId, tokenURI_);

        credentials[newId] = Credential({
            tokenId:         newId,
            credentialType:  credentialType,
            status:          CredentialStatus.ACTIVE,
            studentName:     studentName,
            studentId:       studentId,
            program:         program,
            institution:     institutionName,
            yearGraduated:   yearGraduated,
            honors:          honors,
            verificationUrl: tokenURI_,
            issuedBy:        msg.sender,
            issuedAt:        block.timestamp
        });

        credentialHash[dupHash] = newId;

        auditLog[newId].push(AuditEntry({
            status:    CredentialStatus.ACTIVE,
            reason:    "Credential issued",
            changedBy: msg.sender,
            timestamp: block.timestamp
        }));

        institutions[msg.sender].totalIssued++;

        emit CredentialIssued(
            newId, credentialType, studentName, studentId,
            msg.sender, institutionName, block.timestamp
        );

        return newId;
    }

    // ─── Status Management ────────────────────────────────────────────────────

    function revokeCredential(uint256 tokenId, string memory reason)
        external credentialExists(tokenId)
    {
        require(
            credentials[tokenId].issuedBy == msg.sender || owner() == msg.sender,
            "AcadChain: not authorized to revoke this credential"
        );
        require(
            credentials[tokenId].status != CredentialStatus.REVOKED,
            "AcadChain: already revoked"
        );
        require(bytes(reason).length > 0, "Reason required");

        credentials[tokenId].status = CredentialStatus.REVOKED;
        auditLog[tokenId].push(AuditEntry({
            status:    CredentialStatus.REVOKED,
            reason:    reason,
            changedBy: msg.sender,
            timestamp: block.timestamp
        }));
        institutions[credentials[tokenId].issuedBy].totalRevoked++;
        emit CredentialRevoked(tokenId, msg.sender, reason, block.timestamp);
    }

    function suspendCredential(uint256 tokenId, string memory reason)
        external credentialExists(tokenId)
    {
        require(
            credentials[tokenId].issuedBy == msg.sender || owner() == msg.sender,
            "AcadChain: not authorized"
        );
        require(
            credentials[tokenId].status == CredentialStatus.ACTIVE,
            "AcadChain: not active"
        );
        require(bytes(reason).length > 0, "Reason required");

        credentials[tokenId].status = CredentialStatus.SUSPENDED;
        auditLog[tokenId].push(AuditEntry({
            status:    CredentialStatus.SUSPENDED,
            reason:    reason,
            changedBy: msg.sender,
            timestamp: block.timestamp
        }));
        emit CredentialSuspended(tokenId, msg.sender, reason, block.timestamp);
    }

    function reinstateCredential(uint256 tokenId, string memory reason)
        external credentialExists(tokenId)
    {
        require(
            credentials[tokenId].issuedBy == msg.sender || owner() == msg.sender,
            "AcadChain: not authorized"
        );
        require(
            credentials[tokenId].status == CredentialStatus.SUSPENDED,
            "AcadChain: not suspended"
        );

        credentials[tokenId].status = CredentialStatus.ACTIVE;
        auditLog[tokenId].push(AuditEntry({
            status:    CredentialStatus.ACTIVE,
            reason:    reason,
            changedBy: msg.sender,
            timestamp: block.timestamp
        }));
        emit CredentialReinstated(tokenId, msg.sender, reason, block.timestamp);
    }

    // ─── Read Functions ───────────────────────────────────────────────────────

    function verifyCredential(uint256 tokenId)
        external view
        returns (VerifyResult memory result)
    {
        if (tokenId == 0 || tokenId > _tokenIdCounter) {
            result.exists = false;
            return result;
        }

        Credential memory c = credentials[tokenId];
        result.exists         = true;
        result.isRevoked      = (c.status == CredentialStatus.REVOKED);
        result.isSuspended    = (c.status == CredentialStatus.SUSPENDED);
        result.credentialType = uint8(c.credentialType);
        result.studentName    = c.studentName;
        result.studentId      = c.studentId;
        result.program        = c.program;
        result.institution    = c.institution;
        result.yearGraduated  = c.yearGraduated;
        result.honors         = c.honors;
        result.verificationUrl = c.verificationUrl;
        result.issuedBy       = c.issuedBy;
        result.issuedAt       = c.issuedAt;
        return result;
    }

    function findCredential(
        string memory studentId,
        string memory program,
        string memory institutionName,
        CredentialType credentialType_
    ) external view returns (uint256) {
        return credentialHash[keccak256(abi.encodePacked(
            studentId, program, institutionName, uint8(credentialType_)
        ))];
    }

    function getAuditLog(uint256 tokenId)
        external view credentialExists(tokenId)
        returns (AuditEntry[] memory)
    {
        return auditLog[tokenId];
    }

    function getInstitution(address wallet)
        external view
        returns (
            string memory name,
            string memory region,
            bool    isAuthorized,
            uint256 totalIssued,
            uint256 totalRevoked
        )
    {
        Institution memory i = institutions[wallet];
        return (i.name, i.region, i.isAuthorized, i.totalIssued, i.totalRevoked);
    }

    function totalCredentials() external view returns (uint256) {
        return _tokenIdCounter;
    }
}