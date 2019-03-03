// test/TestDipDappDoe.sol
pragma solidity ^0.5.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Battleships.sol";

contract TestBattleships {
    Battleships gamesInstance;

    constructor() public {
        gamesInstance = Battleships(DeployedAddresses.Battleships());
    }

    function testInitiallyEmpty() public {
        Assert.equal(gamesInstance.getOpenGames().length, 0, "The games array should be empty at the begining");
    }

    function testHashingFunction() public {
        bytes32 hash1 = gamesInstance.saltedHash(123, "my salt goes here");
        bytes32 hashA = LibString.saltedHash(123, "my salt goes here");
        
        bytes32 hash2 = gamesInstance.saltedHash(123, "my salt goes 2 here");
        bytes32 hashB = LibString.saltedHash(123, "my salt goes 2 here");
        
        bytes32 hash3 = gamesInstance.saltedHash(234, "my salt goes here");
        bytes32 hashC = LibString.saltedHash(234, "my salt goes here");
        
        Assert.isNotZero(hash1, "Salted hash should be valid");

        Assert.equal(hash1, hashA, "Hashes should match");
        Assert.equal(hash2, hashB, "Hashes should match");
        Assert.equal(hash3, hashC, "Hashes should match");

        Assert.notEqual(hash1, hash2, "Different salt should produce different hashes");
        Assert.notEqual(hash1, hash3, "Different numbers should produce different hashes");
        Assert.notEqual(hash2, hash3, "Different numbers and salt should produce different hashes");
    }
} 
