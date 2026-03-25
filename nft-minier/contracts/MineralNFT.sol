// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * MineralNFT — ERC-721 pour la certification minière
 * Katanga, République Démocratique du Congo
 *
 * Adresse déployée : 0xE7A51a1136968A33fE06bAc07B5794757E349Fbb
 * Owner            : 0xdb5745DeeDcF8e6e0099460bf94c96b56804EC70
 * Réseau           : Ganache (localhost:7545)
 * Nom / Symbole    : MineralNFT / MINRL
 *
 * Compatible avec :
 *   - Backend Flask  (routes/blockchain.py → real_mint_nft())
 *   - Frontend React (services/blockchain.js → mintNFTOnChain())
 *   - Truffle test   (test/test_mineral.js  → mintMineralToken())
 *
 * Signature principale :
 *   mintMineralToken(to, lotId, site, mineralType, impurityLevel,
 *                    confidence, iaSignature, isAuthentic,
 *                    certificateHash, ipfsHash,
 *                    cuGrade, coGrade, feGrade, weight)
 *
 * @openzeppelin/contracts v4.8.0
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MineralNFT is ERC721URIStorage, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // ─── Structure principale ──────────────────────────────────────────────
    struct MineralData {
        // Identification
        string  lotId;            // ID unique du lot  (ex: "KAMOA-2603-142")
        string  site;             // Site minier       ("KAMOA" | "KANSOKO" | "KCC")
        string  mineralType;      // Type de minerai   ("copper" | "cobalt" | "mixed")
        string  impurityLevel;    // Niveau impuretés  ("low" | "medium" | "high")

        // Résultat IA
        uint256 confidence;       // Score IA × 100    (ex: 9650 = 96.50%)
        string  iaSignature;      // Hash signature IA (ex: "0x7ccffb17ae1da04d")
        bool    isAuthentic;      // true = AUTHENTIQUE, false = SUSPECT

        // Certification
        string  certificateHash;  // Hash du certificat JSON
        string  ipfsHash;         // CID IPFS           (ex: "ipfs://QmXy...")

        // Données chimiques (× 100 pour 2 décimales)
        uint256 cuGrade;          // Cuivre  %×100      (ex: 324 = 3.24%)
        uint256 coGrade;          // Cobalt  %×100      (ex: 12  = 0.12%)
        uint256 feGrade;          // Fer     %×100      (ex: 123 = 1.23%)
        uint256 weight;           // Poids   t×100      (ex: 2530 = 25.30 t)

        // Méta
        uint256 mintedAt;         // Timestamp Unix du minting
        address mintedBy;         // Adresse qui a appelé mintMineralToken
        bool    dgmrValidated;    // true après validation du régulateur DGMR
        string  dgmrStatus;       // "AUTHENTIQUE" | "SUSPECT" | "EN_ATTENTE"
    }

    // ─── State ─────────────────────────────────────────────────────────────
    mapping(uint256 => MineralData) public mineralData;
    mapping(string  => uint256)     public lotToTokenId;   // lotId → tokenId
    mapping(uint256 => string)      private _tokenURIMap;  // tokenId → URI

    // ─── Events ────────────────────────────────────────────────────────────
    event MineralMinted(
        uint256 indexed tokenId,
        address indexed to,
        string  lotId,
        string  site,
        string  mineralType,
        bool    isAuthentic,
        uint256 confidence
    );

    event DGMRValidated(
        uint256 indexed tokenId,
        string  lotId,
        string  status,          // "AUTHENTIQUE" | "SUSPECT"
        address indexed validator,
        uint256 timestamp
    );

    event CertificateUpdated(
        uint256 indexed tokenId,
        string  lotId,
        string  ipfsHash,
        uint256 timestamp
    );

    // ─── Constructor ───────────────────────────────────────────────────────
    constructor() ERC721("MineralNFT", "MINRL") {}

    // ═══════════════════════════════════════════════════════════════════════
    //  FONCTION PRINCIPALE — mint d'un NFT de certification
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Mint un NFT ERC-721 pour certifier un lot minier.
     * @dev Seul le owner (MineralChain backend) peut minter.
     *      Un lot ne peut être certifié qu'une seule fois.
     *
     * @param to              Adresse du producteur (receveur du NFT)
     * @param lotId           ID unique du lot         ("KAMOA-2603-142")
     * @param site            Site d'extraction        ("KAMOA"|"KANSOKO"|"KCC")
     * @param mineralType     Type de minerai          ("copper"|"cobalt"|"mixed")
     * @param impurityLevel   Niveau d'impuretés IA    ("low"|"medium"|"high")
     * @param confidence      Score IA × 100           (9650 = 96.50%)
     * @param iaSignature     Signature hash IA        ("0x7ccffb17ae1da04d")
     * @param isAuthentic     Résultat IA              (true = AUTHENTIQUE)
     * @param certificateHash Hash du certificat JSON  (sha256 du JSON v2.0)
     * @param ipfsHash        CID IPFS du certificat   ("ipfs://QmXy...")
     * @param cuGrade         Teneur Cu × 100          (324 = 3.24%)
     * @param coGrade         Teneur Co × 100          (12 = 0.12%)
     * @param feGrade         Teneur Fe × 100          (123 = 1.23%)
     * @param weight          Poids du lot × 100       (2530 = 25.30 t)
     *
     * @return tokenId Le tokenId ERC-721 créé (commence à 1)
     */
    function mintMineralToken(
        address to,
        string  memory lotId,
        string  memory site,
        string  memory mineralType,
        string  memory impurityLevel,
        uint256 confidence,
        string  memory iaSignature,
        bool    isAuthentic,
        string  memory certificateHash,
        string  memory ipfsHash,
        uint256 cuGrade,
        uint256 coGrade,
        uint256 feGrade,
        uint256 weight
    ) external onlyOwner returns (uint256) {

        require(to != address(0),           "MineralNFT: mint to zero address");
        require(bytes(lotId).length > 0,    "MineralNFT: empty lotId");
        require(lotToTokenId[lotId] == 0,   "MineralNFT: lot already certified");

        // Incrémenter l'ID
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        // Mint ERC-721
        _safeMint(to, tokenId);

        // Construire le tokenURI depuis IPFS
        string memory uri = bytes(ipfsHash).length > 0
            ? string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/", _stripIpfsPrefix(ipfsHash)))
            : string(abi.encodePacked("https://mineralchain.cd/api/token/", _uint2str(tokenId)));

        _setTokenURI(tokenId, uri);

        // Enregistrer toutes les données on-chain
        mineralData[tokenId] = MineralData({
            lotId:         lotId,
            site:          site,
            mineralType:   mineralType,
            impurityLevel: impurityLevel,
            confidence:    confidence,
            iaSignature:   iaSignature,
            isAuthentic:   isAuthentic,
            certificateHash: certificateHash,
            ipfsHash:      ipfsHash,
            cuGrade:       cuGrade,
            coGrade:       coGrade,
            feGrade:       feGrade,
            weight:        weight,
            mintedAt:      block.timestamp,
            mintedBy:      msg.sender,
            dgmrValidated: false,
            dgmrStatus:    "EN_ATTENTE"
        });

        // Mapping lot → token
        lotToTokenId[lotId] = tokenId;

        emit MineralMinted(tokenId, to, lotId, site, mineralType, isAuthentic, confidence);

        return tokenId;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  VALIDATION DGMR — enregistrée on-chain après double analyse
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Enregistre la validation du régulateur DGMR sur la blockchain.
     * @dev Appelé par le backend après la double analyse labo.
     *
     * @param tokenId   ID du token à valider
     * @param status    "AUTHENTIQUE" ou "SUSPECT"
     * @param validator Adresse du régulateur (wallet DGMR)
     */
    function validateByDGMR(
        uint256 tokenId,
        string  memory status,
        address validator
    ) external onlyOwner {
        require(_exists(tokenId), "MineralNFT: token does not exist");
        require(
            keccak256(bytes(status)) == keccak256(bytes("AUTHENTIQUE")) ||
            keccak256(bytes(status)) == keccak256(bytes("SUSPECT")),
            "MineralNFT: status must be AUTHENTIQUE or SUSPECT"
        );

        mineralData[tokenId].dgmrValidated = true;
        mineralData[tokenId].dgmrStatus    = status;

        // Si SUSPECT, marquer isAuthentic comme false
        if (keccak256(bytes(status)) == keccak256(bytes("SUSPECT"))) {
            mineralData[tokenId].isAuthentic = false;
        }

        emit DGMRValidated(tokenId, mineralData[tokenId].lotId, status, validator, block.timestamp);
    }

    /**
     * @notice Met à jour le hash IPFS (après upload du certificat final).
     */
    function updateIPFSHash(
        uint256 tokenId,
        string  memory newIpfsHash,
        string  memory newCertificateHash
    ) external onlyOwner {
        require(_exists(tokenId), "MineralNFT: token does not exist");
        mineralData[tokenId].ipfsHash       = newIpfsHash;
        mineralData[tokenId].certificateHash = newCertificateHash;

        string memory uri = string(abi.encodePacked(
            "https://gateway.pinata.cloud/ipfs/",
            _stripIpfsPrefix(newIpfsHash)
        ));
        _setTokenURI(tokenId, uri);

        emit CertificateUpdated(tokenId, mineralData[tokenId].lotId, newIpfsHash, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LECTURE — fonctions view
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Retourne toutes les données d'un lot certifié.
     */
    function getMineralData(uint256 tokenId)
        external view
        returns (
            string  memory lotId,
            string  memory site,
            string  memory mineralType,
            string  memory impurityLevel,
            uint256 confidence,
            string  memory iaSignature,
            bool    isAuthentic,
            string  memory ipfsHash,
            uint256 cuGrade,
            uint256 coGrade,
            uint256 feGrade,
            uint256 weight,
            uint256 mintedAt,
            bool    dgmrValidated,
            string  memory dgmrStatus
        )
    {
        MineralData memory d = mineralData[tokenId];
        return (
            d.lotId, d.site, d.mineralType, d.impurityLevel,
            d.confidence, d.iaSignature, d.isAuthentic,
            d.ipfsHash, d.cuGrade, d.coGrade, d.feGrade, d.weight,
            d.mintedAt, d.dgmrValidated, d.dgmrStatus
        );
    }

    /**
     * @notice Retourne le tokenId associé à un lotId (0 si non certifié).
     */
    function getTokenByLot(string memory lotId) external view returns (uint256) {
        return lotToTokenId[lotId];
    }

    /**
     * @notice Nombre total de NFTs mintés.
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIds.current();
    }

    /**
     * @notice Vérifie si un lot est certifié.
     */
    function isLotCertified(string memory lotId) external view returns (bool) {
        return lotToTokenId[lotId] != 0;
    }

    /**
     * @notice Vérifie si un lot est validé par le régulateur DGMR.
     */
    function isLotDGMRValidated(string memory lotId) external view returns (bool) {
        uint256 tokenId = lotToTokenId[lotId];
        if (tokenId == 0) return false;
        return mineralData[tokenId].dgmrValidated;
    }

    // ─── Helpers internes ─────────────────────────────────────────────────

    /// @dev Retire le préfixe "ipfs://" si présent
    function _stripIpfsPrefix(string memory hash) internal pure returns (string memory) {
        bytes memory b = bytes(hash);
        if (b.length > 7 &&
            b[0] == 'i' && b[1] == 'p' && b[2] == 'f' &&
            b[3] == 's' && b[4] == ':' && b[5] == '/' && b[6] == '/') {
            bytes memory result = new bytes(b.length - 7);
            for (uint i = 7; i < b.length; i++) {
                result[i - 7] = b[i];
            }
            return string(result);
        }
        return hash;
    }

    /// @dev Convertit un uint en string
    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // ─── Override requis par OpenZeppelin ─────────────────────────────────
    function _burn(uint256 tokenId) internal override(ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public view override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
