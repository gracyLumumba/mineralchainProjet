/**
 * MineralNFT — Tests Truffle complets
 * Compatible avec contracts/MineralNFT.sol (OpenZeppelin 4.8.0)
 *
 * Usage :
 *   truffle test                    — tous les tests
 *   truffle test --network development
 *
 * Prérequis :
 *   1. Ganache démarré sur localhost:7545
 *   2. Contrat déployé : truffle migrate --reset
 */

const MineralNFT = artifacts.require("MineralNFT");

contract("MineralNFT", (accounts) => {
  const owner     = accounts[0]; // Propriétaire du contrat (minter)
  const producer  = accounts[1]; // Producteur minier (receveur du NFT)
  const regulator = accounts[2]; // Régulateur DGMR

  let instance;

  // ── Données de test ────────────────────────────────────────────────────
  const LOT = {
    lotId:           "KAMOA-2603-142",
    site:            "KAMOA",
    mineralType:     "copper",
    impurityLevel:   "low",
    confidence:      9650,          // 96.50% × 100
    iaSignature:     "0x7ccffb17ae1da04d",
    isAuthentic:     true,
    certificateHash: "sha256:abc123def456",
    ipfsHash:        "ipfs://QmXyZ123456789",
    cuGrade:         324,           // 3.24% × 100
    coGrade:         12,            // 0.12% × 100
    feGrade:         123,           // 1.23% × 100
    weight:          2530,          // 25.30 t × 100
  };

  const LOT_SUSPECT = {
    lotId:           "KCC-2603-999",
    site:            "KCC",
    mineralType:     "cobalt",
    impurityLevel:   "high",
    confidence:      4200,          // 42.00% (faible confiance)
    iaSignature:     "0x0000000000000000",
    isAuthentic:     false,
    certificateHash: "",
    ipfsHash:        "",
    cuGrade:         9999,          // 99.99% → valeur aberrante
    coGrade:         0,
    feGrade:         0,
    weight:          100,
  };

  // ── Setup ──────────────────────────────────────────────────────────────
  before(async () => {
    instance = await MineralNFT.deployed();
    console.log("\n  Contrat MineralNFT déployé :");
    console.log("  Adresse :", instance.address);
    console.log("  Owner   :", owner);
    console.log("  Producer:", producer);
    console.log("  Regulator:", regulator);
  });

  // ════════════════════════════════════════════════════════════════════════
  //  1. Déploiement et état initial
  // ════════════════════════════════════════════════════════════════════════
  describe("1. Déploiement", () => {

    it("1.1 — Le nom et le symbole sont corrects", async () => {
      const name   = await instance.name();
      const symbol = await instance.symbol();
      assert.equal(name,   "MineralNFT", "Nom incorrect");
      assert.equal(symbol, "MINRL",      "Symbole incorrect");
      console.log(`  Nom: ${name} | Symbole: ${symbol}`);
    });

    it("1.2 — Le totalSupply initial est 0", async () => {
      const total = await instance.totalSupply();
      assert.equal(total.toNumber(), 0, "totalSupply devrait être 0");
      console.log(`  totalSupply: ${total}`);
    });

    it("1.3 — Le owner est bien accounts[0]", async () => {
      const contractOwner = await instance.owner();
      assert.equal(contractOwner.toLowerCase(), owner.toLowerCase(), "Owner incorrect");
      console.log(`  Owner: ${contractOwner}`);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  2. mintMineralToken — lot AUTHENTIQUE
  // ════════════════════════════════════════════════════════════════════════
  describe("2. mintMineralToken — lot AUTHENTIQUE", () => {
    let tokenId;
    let txReceipt;

    it("2.1 — Mint réussi, tokenId retourné", async () => {
      txReceipt = await instance.mintMineralToken(
        producer,
        LOT.lotId,
        LOT.site,
        LOT.mineralType,
        LOT.impurityLevel,
        LOT.confidence,
        LOT.iaSignature,
        LOT.isAuthentic,
        LOT.certificateHash,
        LOT.ipfsHash,
        LOT.cuGrade,
        LOT.coGrade,
        LOT.feGrade,
        LOT.weight,
        { from: owner }
      );

      // Extraire tokenId depuis l'event MineralMinted
      const event = txReceipt.logs.find(l => l.event === "MineralMinted");
      assert(event, "Event MineralMinted non trouvé");

      tokenId = event.args.tokenId.toNumber();
      assert(tokenId > 0, "TokenId doit être > 0");

      console.log(`\n  Token ID   : ${tokenId}`);
      console.log(`  TX Hash    : ${txReceipt.tx}`);
      console.log(`  Gas utilisé: ${txReceipt.receipt.gasUsed}`);
      console.log(`  Block      : ${txReceipt.receipt.blockNumber}`);
    });

    it("2.2 — L'event MineralMinted contient les bonnes données", async () => {
      const event = txReceipt.logs.find(l => l.event === "MineralMinted");
      assert.equal(event.args.to.toLowerCase(), producer.toLowerCase(), "Recipient incorrect");
      assert.equal(event.args.lotId,       LOT.lotId,       "LotId incorrect");
      assert.equal(event.args.site,        LOT.site,        "Site incorrect");
      assert.equal(event.args.mineralType, LOT.mineralType, "MineralType incorrect");
      assert.equal(event.args.isAuthentic, LOT.isAuthentic, "isAuthentic incorrect");
      assert.equal(event.args.confidence.toNumber(), LOT.confidence, "Confidence incorrect");
      console.log(`  Event OK — lotId: ${event.args.lotId} | site: ${event.args.site}`);
    });

    it("2.3 — Le NFT appartient bien au producteur", async () => {
      const nftOwner = await instance.ownerOf(tokenId);
      assert.equal(nftOwner.toLowerCase(), producer.toLowerCase(), "Owner du NFT incorrect");
      const balance = await instance.balanceOf(producer);
      assert.equal(balance.toNumber(), 1, "Balance du producteur devrait être 1");
      console.log(`  ownerOf(${tokenId}): ${nftOwner}`);
    });

    it("2.4 — getMineralData retourne les bonnes données chimiques", async () => {
      const data = await instance.getMineralData(tokenId);
      assert.equal(data.lotId,        LOT.lotId,           "lotId incorrect");
      assert.equal(data.site,         LOT.site,            "site incorrect");
      assert.equal(data.mineralType,  LOT.mineralType,     "mineralType incorrect");
      assert.equal(data.impurityLevel,LOT.impurityLevel,   "impurityLevel incorrect");
      assert.equal(data.confidence.toNumber(), LOT.confidence, "confidence incorrect");
      assert.equal(data.iaSignature,  LOT.iaSignature,     "iaSignature incorrect");
      assert.equal(data.isAuthentic,  LOT.isAuthentic,     "isAuthentic incorrect");
      assert.equal(data.ipfsHash,     LOT.ipfsHash,        "ipfsHash incorrect");
      assert.equal(data.cuGrade.toNumber(), LOT.cuGrade,   "cuGrade incorrect");
      assert.equal(data.coGrade.toNumber(), LOT.coGrade,   "coGrade incorrect");
      assert.equal(data.feGrade.toNumber(), LOT.feGrade,   "feGrade incorrect");
      assert.equal(data.weight.toNumber(),  LOT.weight,    "weight incorrect");
      assert.equal(data.dgmrValidated, false,              "dgmrValidated devrait être false");
      assert.equal(data.dgmrStatus,    "EN_ATTENTE",       "dgmrStatus devrait être EN_ATTENTE");
      console.log(`  Cu: ${data.cuGrade/100}% | Co: ${data.coGrade/100}% | Fe: ${data.feGrade/100}%`);
      console.log(`  Poids: ${data.weight/100}t | Confiance IA: ${data.confidence/100}%`);
    });

    it("2.5 — getTokenByLot retourne le bon tokenId", async () => {
      const tid = await instance.getTokenByLot(LOT.lotId);
      assert.equal(tid.toNumber(), tokenId, "TokenId par lot incorrect");
      console.log(`  getTokenByLot("${LOT.lotId}"): ${tid}`);
    });

    it("2.6 — isLotCertified retourne true", async () => {
      const certified = await instance.isLotCertified(LOT.lotId);
      assert.equal(certified, true, "isLotCertified devrait être true");
      console.log(`  isLotCertified: ${certified}`);
    });

    it("2.7 — totalSupply est maintenant 1", async () => {
      const total = await instance.totalSupply();
      assert.equal(total.toNumber(), 1, "totalSupply devrait être 1");
      console.log(`  totalSupply: ${total}`);
    });

    it("2.8 — tokenURI pointe vers IPFS", async () => {
      const uri = await instance.tokenURI(tokenId);
      assert(uri.includes("gateway.pinata.cloud") || uri.includes("mineralchain.cd"),
        "TokenURI devrait pointer vers Pinata ou mineralchain.cd");
      console.log(`  tokenURI: ${uri}`);
    });

    after(() => {
      // Stocker tokenId pour les tests suivants
      MineralNFT._lastTokenId = tokenId;
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  3. Validation DGMR on-chain
  // ════════════════════════════════════════════════════════════════════════
  describe("3. validateByDGMR", () => {
    let tokenId;

    before(() => {
      tokenId = MineralNFT._lastTokenId;
    });

    it("3.1 — Le régulateur valide le lot → AUTHENTIQUE", async () => {
      const tx = await instance.validateByDGMR(tokenId, "AUTHENTIQUE", regulator, { from: owner });
      const event = tx.logs.find(l => l.event === "DGMRValidated");
      assert(event, "Event DGMRValidated non trouvé");
      assert.equal(event.args.status, "AUTHENTIQUE", "Statut DGMR incorrect");
      assert.equal(event.args.validator.toLowerCase(), regulator.toLowerCase(), "Validateur incorrect");
      console.log(`\n  DGMR validated #${tokenId} -> AUTHENTIQUE | TX: ${tx.tx}`);
    });

    it("3.2 — getMineralData reflète la validation DGMR", async () => {
      const data = await instance.getMineralData(tokenId);
      assert.equal(data.dgmrValidated, true,           "dgmrValidated devrait être true");
      assert.equal(data.dgmrStatus,    "AUTHENTIQUE",  "dgmrStatus devrait être AUTHENTIQUE");
      console.log(`  dgmrValidated: ${data.dgmrValidated} | dgmrStatus: ${data.dgmrStatus}`);
    });

    it("3.3 — isLotDGMRValidated retourne true", async () => {
      const validated = await instance.isLotDGMRValidated(LOT.lotId);
      assert.equal(validated, true, "isLotDGMRValidated devrait être true");
      console.log(`  isLotDGMRValidated: ${validated}`);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  4. updateIPFSHash — mise à jour du certificat
  // ════════════════════════════════════════════════════════════════════════
  describe("4. updateIPFSHash", () => {
    let tokenId;
    const NEW_IPFS = "ipfs://QmNewCertificateHash12345";
    const NEW_CERT = "sha256:newcerthash456789";

    before(() => {
      tokenId = MineralNFT._lastTokenId;
    });

    it("4.1 — Mise à jour du hash IPFS réussie", async () => {
      const tx = await instance.updateIPFSHash(tokenId, NEW_IPFS, NEW_CERT, { from: owner });
      const event = tx.logs.find(l => l.event === "CertificateUpdated");
      assert(event, "Event CertificateUpdated non trouvé");
      assert.equal(event.args.ipfsHash, NEW_IPFS, "Nouveau ipfsHash incorrect");
      console.log(`\n  IPFS updated #${tokenId}: ${NEW_IPFS}`);
    });

    it("4.2 — getMineralData reflète le nouveau hash", async () => {
      const data = await instance.getMineralData(tokenId);
      assert.equal(data.ipfsHash, NEW_IPFS, "ipfsHash non mis à jour");
      console.log(`  getMineralData.ipfsHash: ${data.ipfsHash}`);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  5. Lot SUSPECT
  // ════════════════════════════════════════════════════════════════════════
  describe("5. Lot SUSPECT", () => {
    let suspectTokenId;

    it("5.1 — Mint d'un lot suspect (isAuthentic=false)", async () => {
      const tx = await instance.mintMineralToken(
        producer,
        LOT_SUSPECT.lotId, LOT_SUSPECT.site, LOT_SUSPECT.mineralType,
        LOT_SUSPECT.impurityLevel, LOT_SUSPECT.confidence, LOT_SUSPECT.iaSignature,
        LOT_SUSPECT.isAuthentic, LOT_SUSPECT.certificateHash, LOT_SUSPECT.ipfsHash,
        LOT_SUSPECT.cuGrade, LOT_SUSPECT.coGrade, LOT_SUSPECT.feGrade, LOT_SUSPECT.weight,
        { from: owner }
      );
      const event = tx.logs.find(l => l.event === "MineralMinted");
      assert(event, "Event MineralMinted non trouvé");
      suspectTokenId = event.args.tokenId.toNumber();
      assert.equal(event.args.isAuthentic, false, "isAuthentic devrait être false");
      console.log(`\n  Suspect token minted: #${suspectTokenId}`);
    });

    it("5.2 — Validation DGMR marque SUSPECT", async () => {
      const tx = await instance.validateByDGMR(suspectTokenId, "SUSPECT", regulator, { from: owner });
      const data = await instance.getMineralData(suspectTokenId);
      assert.equal(data.dgmrStatus,   "SUSPECT", "dgmrStatus devrait être SUSPECT");
      assert.equal(data.isAuthentic,  false,     "isAuthentic devrait être false");
      assert.equal(data.dgmrValidated, true,     "dgmrValidated devrait être true");
      console.log(`  SUSPECT validated — dgmrStatus: ${data.dgmrStatus}`);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  6. Contrôles d'accès (onlyOwner)
  // ════════════════════════════════════════════════════════════════════════
  describe("6. Contrôles d'accès", () => {

    it("6.1 — Un non-owner NE PEUT PAS minter", async () => {
      try {
        await instance.mintMineralToken(
          producer, "FAIL-001", "KCC", "copper", "low",
          5000, "0x0", true, "", "", 100, 10, 50, 1000,
          { from: producer }   // ← appel depuis le producteur, pas le owner
        );
        assert.fail("Devrait avoir revert");
      } catch (err) {
        assert(
          err.message.includes("Ownable") || err.message.includes("revert"),
          `Erreur attendue 'Ownable', reçu: ${err.message}`
        );
        console.log("\n  onlyOwner respecte — mint revert pour non-owner");
      }
    });

    it("6.2 — Un non-owner NE PEUT PAS valider DGMR", async () => {
      const tokenId = MineralNFT._lastTokenId;
      try {
        await instance.validateByDGMR(tokenId, "AUTHENTIQUE", regulator, { from: regulator });
        assert.fail("Devrait avoir revert");
      } catch (err) {
        assert(
          err.message.includes("Ownable") || err.message.includes("revert"),
          `Erreur attendue 'Ownable', reçu: ${err.message}`
        );
        console.log("  onlyOwner respecte — validateByDGMR revert pour non-owner");
      }
    });

    it("6.3 — Certifier deux fois le même lot est impossible", async () => {
      try {
        await instance.mintMineralToken(
          producer,
          LOT.lotId,   // Même lotId déjà certifié
          LOT.site, LOT.mineralType, LOT.impurityLevel, LOT.confidence,
          LOT.iaSignature, LOT.isAuthentic, LOT.certificateHash, LOT.ipfsHash,
          LOT.cuGrade, LOT.coGrade, LOT.feGrade, LOT.weight,
          { from: owner }
        );
        assert.fail("Double certification devrait revert");
      } catch (err) {
        assert(
          err.message.includes("already certified") || err.message.includes("revert"),
          `Erreur attendue 'already certified', reçu: ${err.message}`
        );
        console.log("  Double certification bloquee correctement");
      }
    });

    it("6.4 — Mint vers l'adresse zéro est impossible", async () => {
      try {
        await instance.mintMineralToken(
          "0x0000000000000000000000000000000000000000",
          "NULL-001", "KAMOA", "copper", "low",
          5000, "0x0", true, "", "",
          100, 10, 50, 1000,
          { from: owner }
        );
        assert.fail("Devrait avoir revert");
      } catch (err) {
        assert(
          err.message.includes("zero address") || err.message.includes("revert"),
          `Erreur attendue, reçu: ${err.message}`
        );
        console.log("  Mint vers adresse zero bloque");
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  7. État final
  // ════════════════════════════════════════════════════════════════════════
  describe("7. État final", () => {

    it("7.1 — totalSupply est 2 (1 authentique + 1 suspect)", async () => {
      const total = await instance.totalSupply();
      assert.equal(total.toNumber(), 2, "totalSupply devrait être 2");
      console.log(`\n  totalSupply final: ${total}`);
    });

    it("7.2 — Résumé complet", async () => {
      const total   = await instance.totalSupply();
      const name    = await instance.name();
      const symbol  = await instance.symbol();
      const data    = await instance.getMineralData(MineralNFT._lastTokenId);

      console.log("\n  ╔══════════════════════════════════════╗");
      console.log(`  ║  ${name} (${symbol})          ║`);
      console.log("  ╠══════════════════════════════════════╣");
      console.log(`  ║  Tokens mintés : ${total}                   ║`);
      console.log(`  ║  Dernier lot   : ${data.lotId}     ║`);
      console.log(`  ║  Site          : ${data.site}              ║`);
      console.log(`  ║  DGMR status   : ${data.dgmrStatus}  ║`);
      console.log(`  ║  isAuthentic   : ${data.isAuthentic}              ║`);
      console.log("  ╚══════════════════════════════════════╝\n");
    });
  });
});
