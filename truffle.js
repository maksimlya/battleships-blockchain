var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "kidney weekend age close visual north head woman exact mosquito party planet chuckle bid rain";
const path = require("path");

module.exports = {
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
      websockets: true
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/v3/5fd40bb3833344aeaf4b983934a6f985")
      },
      network_id: 3,
      websockets: true
    }  
  }
}; 
