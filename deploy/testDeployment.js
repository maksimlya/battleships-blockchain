const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const HDWalletProvider = require("truffle-hdwallet-provider");

const { PROVIDER_URI, WALLET_MNEMONIC } = require("../env.json");
const provider = new HDWalletProvider(WALLET_MNEMONIC, PROVIDER_URI);
//const web3 = new Web3("https://ropsten.infura.io/v3/5fd40bb3833344aeaf4b983934a6f985");
let web3 = new Web3(
  // Replace YOUR-PROJECT-ID with a Project ID from your Infura Dashboard
  new Web3.providers.WebsocketProvider("wss://ropsten.infura.io/ws/v3/5fd40bb3833344aeaf4b983934a6f985")
);

const CONTRACT_ADDRESS = "0x462b2180822792Ec5aDCa42F761f73F5a1c0c27B";

async function startGame() {
	//console.log(web3);
    const accounts = await web3.eth.getAccounts();
    console.log(accounts);
    // const dipDappDoeAbi = fs.readFileSync(path.resolve(__dirname, "..", "build", "__contracts_DipDappDoe_sol_DipDappDoe.abi")).toString();

    // try {
    //     const dipDappDoeInstance = new web3.eth.Contract(JSON.parse(dipDappDoeAbi), CONTRACT_ADDRESS);

    //     const hash = await dipDappDoeInstance.methods.saltedHash(100, "initial salt").call();
    //     const tx = await dipDappDoeInstance.methods.createGame(hash, "James").send({ from: accounts[0], value: web3.utils.toWei("0.001", "ether") });
    //     const gameIdx = tx.events.GameCreated.returnValues.gameIdx;
    //     console.log("GAME CREATED", gameIdx);
    //     console.log(await dipDappDoeInstance.methods.getGameInfo(gameIdx).call());
    // }
    // catch (err) {
    //     console.error("\nUnable to deploy:", err.message, "\n");
    //     process.exit(1);
    // }
    // process.exit();
}

startGame(); 
