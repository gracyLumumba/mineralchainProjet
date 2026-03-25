const MineralNFT = artifacts.require("MineralNFT");

module.exports = function (deployer) {
  deployer.deploy(MineralNFT);
};
