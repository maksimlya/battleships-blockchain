 
const Battleships = artifacts.require("Battleships");
const LibString = artifacts.require("./LibString.sol");


module.exports = function(deployer) {
  deployer.deploy(LibString);
  deployer.link(LibString, Battleships);
  deployer.deploy(Battleships);
};