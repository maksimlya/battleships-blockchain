pragma solidity ^0.5.0;

import "./LibString.sol";

contract Battleships {

	// Events

    event GameCreated(uint32 indexed gameIdx);
    event GameAccepted(uint32 indexed gameIdx, address indexed opponent);
    event GameStarted(uint32 indexed gameIdx, address indexed opponent);
    event PositionMarked(uint32 indexed gameIdx, address indexed opponent);
    event GameEnded(uint32 indexed gameIdx, address indexed opponent);

   
    
    

    function getOpenGames() public view returns (uint32[] memory){
        return openGames;
    }

    function getGameInfo(uint32 gameIdx) public view returns (uint32 gameIndex,uint8[] memory cells, uint8 status, uint amount, string memory nick1, string memory nick2) {
        return (
        	gamesData[gameIdx].gameIndex,
            gamesData[gameIdx].cells,
            gamesData[gameIdx].status,
            gamesData[gameIdx].amount,
            gamesData[gameIdx].nicks[0],
            gamesData[gameIdx].nicks[1]
        );
    }

    function getGameTimestamp(uint32 gameIdx) public view 
    returns (uint lastTransaction) {
        return (gamesData[gameIdx].lastTransaction);
    }

    function getGamePlayers(uint32 gameIdx) public view 
    returns (address player1, address player2) {
        return (
            gamesData[gameIdx].players[0],
            gamesData[gameIdx].players[1]
        );
    }

    function createGame(bytes32 randomNumberHash, string memory nick) public payable returns (uint32 gameIdx) {
        require(nextGameIdx + 1 > nextGameIdx);
        gamesData[nextGameIdx].openListIndex = uint32(openGames.length);
        gamesData[nextGameIdx].creatorHash = randomNumberHash;
        gamesData[nextGameIdx].amount = msg.value;
        gamesData[nextGameIdx].nicks[0] = nick;
        gamesData[nextGameIdx].players[0] = msg.sender;
        gamesData[nextGameIdx].lastTransaction = now;
        gamesData[nextGameIdx].gameIndex = nextGameIdx;
        openGames.push(nextGameIdx);

        gameIdx = nextGameIdx;
        emit GameCreated(nextGameIdx);
        nextGameIdx++;
    }

    
    function acceptGame(uint32 gameIdx, uint8 randomNumber, string memory nick) public payable {
        require(gameIdx < nextGameIdx);
        require(gamesData[gameIdx].players[0] != address(0x0));
        require(msg.value == gamesData[gameIdx].amount);
        require(gamesData[gameIdx].players[1] == address(0x0));
        require(gamesData[gameIdx].status == 0);

        gamesData[gameIdx].guestRandomNumber = randomNumber;
        gamesData[gameIdx].nicks[1] = nick;
        gamesData[gameIdx].players[1] = msg.sender;
        gamesData[gameIdx].lastTransaction = now;

        emit GameAccepted(gameIdx, gamesData[gameIdx].players[0]);

        // Remove from the available list (unordered)
        uint32 idxToDelete = uint32(gamesData[gameIdx].openListIndex);
        openGames[idxToDelete] = openGames[openGames.length - 1];
        gamesData[gameIdx].openListIndex = idxToDelete;
        openGames.length--;
    }

   


    function markPosition(uint32 gameIdx, uint8 cell) public {
        revert();
    }

    function withdraw(uint32 gameIdx) public {
        revert();
    }

    // PUBLIC HELPER FUNCTIONS
    
    function saltedHash(uint8 randomNumber, string memory salt) public pure returns (bytes32) {
        return LibString.saltedHash(randomNumber, salt);
    }

    // DEFAULT
    
    function () external payable {
        revert();
    }

    struct Game{
        uint32 openListIndex;
        uint8[] cells;
        uint8 status;
        uint amount;
        uint32 gameIndex;

        address[2] players;
        uint startingPlayer;
        string[2] nicks;
        uint lastTransaction;
        bool[2] withdrawn;
        bytes32 creatorHash;
        uint8 guestRandomNumber;
    }

    uint32[] openGames;
    mapping(uint32 => Game) gamesData;
    uint32 nextGameIdx;


    string public myString = "Hello World";

    function set(string memory x) public {
        myString = x;
    }

    // Check Merkle Tree proof
    function checkProof(bytes32[] memory proof, bytes32 root, bytes32 leaf) pure public returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash < proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        // Check if the computed hash (root) is equal to the provided root
        return computedHash == root;
    }



    function confirmGame(uint32 gameIdx, uint8 revealedRandomNumber, string memory revealedSalt) public {
        require(gameIdx < nextGameIdx);
        require(gamesData[gameIdx].players[0] == msg.sender);
        require(gamesData[gameIdx].players[1] != address(0x0));
        require(gamesData[gameIdx].status == 0);

        bytes32 computedHash = saltedHash(revealedRandomNumber, revealedSalt);
        if(computedHash != gamesData[gameIdx].creatorHash){
            gamesData[gameIdx].status = 12;
            emit GameEnded(gameIdx, msg.sender);
            emit GameEnded(gameIdx, gamesData[gameIdx].players[1]);
            return;
        }

        gamesData[gameIdx].lastTransaction = now;

        gamesData[gameIdx].status = 5;
        //Define the starting player
        if((revealedRandomNumber ^ gamesData[gameIdx].guestRandomNumber) & 0x01 == 0){
            gamesData[gameIdx].startingPlayer = 1;
            emit GameStarted(gameIdx, gamesData[gameIdx].players[1]);
        } 
        else {
            gamesData[gameIdx].startingPlayer = 2;
            emit GameStarted(gameIdx, gamesData[gameIdx].players[1]);
        }
        
    }

    function validateDesk(uint8[] memory rows, uint8[] memory cols) public returns(bool){
        
    }

    function playerReady(uint gameIdx, uint8[] memory rows, uint8[] memory cols) public {
    	
    }
}

	

