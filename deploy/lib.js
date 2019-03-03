// blockchain/deploy/lib.js

const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const HDWalletProvider = require("truffle-hdwallet-provider");

const { PROVIDER_URI, WALLET_MNEMONIC } = require("../env.json");
const provider = new HDWalletProvider(WALLET_MNEMONIC, PROVIDER_URI);
const web3 = new Web3(provider);


async function deploy(web3, fromAccount, ABI, bytecode, ...params) {
    const contract = new web3.eth.Contract(JSON.parse(ABI));

    const estimatedGas = await contract.deploy({ data: "0x" + bytecode, arguments: params }).estimateGas();

    const tx = await contract
        .deploy({ data: "0x" + bytecode, arguments: params })
        .send({ from: fromAccount, gas: estimatedGas + 200 });

    return tx.options.address;
}

async function deployDapp() {
    const accounts = await web3.eth.getAccounts();
    console.log(accounts);
     // console.log(`The account used to deploy is ${accounts[0]}`);
     // console.log("Current balance: ", await web3.eth.getBalance(accounts[0]), "\n");

    // const libStringAbi = fs.readFileSync(path.resolve(__dirname, "..", "build", "__contracts_LibString_sol_LibString.abi")).toString();
    // const libStringBytecode = fs.readFileSync(path.resolve(__dirname, "..", "build", "__contracts_LibString_sol_LibString.bin")).toString();

    // const BattleshipsAbi = fs.readFileSync(path.resolve(__dirname, "..", "build", "__contracts_Battleships_sol_Battleships.abi")).toString();
    // const battleshipsByteCode = fs.readFileSync(path.resolve(__dirname, "..", "build", "__contracts_BattleshipsAbi_sol_BattleshipsAbi.bin")).toString();

    // try {
    //     console.log("Deploying LibString...");
    //     const libStringAddress = await deploy(web3, accounts[0], libStringAbi, libStringBytecode);
    //     console.log(`- LibString deployed at ${libStringAddress}\n`);

    //     const libPattern = /__.\/contracts\/LibString.sol:LibString___/g;
    //     const linkedBattleshipsByteCode = battleshipsByteCode.replace(libPattern, libStringAddress.substr(2));
    //     if (linkedBattleshipsByteCode.length != battleshipsByteCode.length) {
    //         throw new Error("The linked contract size does not match the original");
    //     }

    //     console.log("Deploying DipDappDoe...");
    //     const battleshipsAddress = await deploy(web3, accounts[0], BattleshipsAbi, linkedBattleshipsByteCode, 0);
    //     console.log(`- DipDappDoe deployed at ${battleshipsAddress}`);
    // }
    // catch (err) {
    //     console.error("\nUnable to deploy:", err.message, "\n");
    //     process.exit(1);
    // }
    process.exit();
}

module.exports = {
    deployDapp
} 
