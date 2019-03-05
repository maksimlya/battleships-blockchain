pragma solidity ^0.5.0;

import "./LibString.sol";

contract Battleships {

	// Events

    event GameCreated(uint32 indexed gameIdx);
    event GameAccepted(uint32 gameIdx, address indexed opponent);
    event GameConfirmed(uint32 indexed gameIdx, address indexed opponent);
    event GameStarted(uint32 indexed gameIdx, address indexed opponent);
    event PlayerAttacked(uint32 indexed gameIdx, address indexed opponent, uint32 indexed target, uint32 prevTarget, bool isHit);
    event GameEnded(uint32 indexed gameIdx, address indexed opponent);
    


   
    
    

    function getOpenGames() public view returns (uint32[] memory){
        return openGames;
    }

    function getGameInfo(uint32 gameIdx) public view returns (uint32 gameIndex, uint8 status, uint amount, string memory nick1, string memory nick2) {
        return (
        	gamesData[gameIdx].gameIndex,
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

    function initialAttack(uint32 gameIdx, uint32 target) public{
        require(gameIdx < nextGameIdx);
        require(gamesData[gameIdx].players[0] != address(0x0));
        require(gamesData[gameIdx].players[1] != address(0x0));

        address opponent;
        if(gamesData[gameIdx].players[0] == msg.sender)
            opponent = gamesData[gameIdx].players[1];
        else opponent = gamesData[gameIdx].players[0];

        gamesData[gameIdx].lastTarget = target;
        emit PlayerAttacked(gameIdx, opponent, target,64,false);

        
    }

    function attack(uint32 gameIdx, uint32 attackTarget, bytes32[] memory proof, bytes32 leaf, string memory lastTargetProof, bool isHit) public{
        require(gameIdx < nextGameIdx);
        require(gamesData[gameIdx].players[0] != address(0x0));
        require(gamesData[gameIdx].players[1] != address(0x0));

        address opponent;
        if(gamesData[gameIdx].players[0] == msg.sender)
            opponent = gamesData[gameIdx].players[1];
        else opponent = gamesData[gameIdx].players[0];


        bool isProofValid;

        if(msg.sender == gamesData[gameIdx].players[0]){
            gamesData[gameIdx].player1Cells[gamesData[gameIdx].lastTarget]  = lastTargetProof;
            isProofValid = checkProof(proof, gamesData[gameIdx].merkleRoots[0], leaf);
        }
        else{
            gamesData[gameIdx].player2Cells[gamesData[gameIdx].lastTarget]  = lastTargetProof;
            isProofValid = checkProof(proof, gamesData[gameIdx].merkleRoots[1], leaf);
        }

        if(!isProofValid){
            if(msg.sender == gamesData[gameIdx].players[0])
                gamesData[gameIdx].status = 12;
            else if(msg.sender == gamesData[gameIdx].players[1])
                gamesData[gameIdx].status = 11;
        }
        else
        

        emit PlayerAttacked(gameIdx, opponent, attackTarget,gamesData[gameIdx].lastTarget, isHit);

        gamesData[gameIdx].lastTarget = attackTarget;
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

        

        // Remove from the available list (unordered)
        uint32 idxToDelete = uint32(gamesData[gameIdx].openListIndex);
        openGames[idxToDelete] = openGames[openGames.length - 1];
        gamesData[gameIdx].openListIndex = idxToDelete;
        openGames.length--;

        emit GameAccepted(gameIdx, gamesData[gameIdx].players[0]);
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
        string[64] player1Cells;
        string[64] player2Cells;
        uint8 status;
        uint amount;
        uint32 gameIndex;

        uint32 lastTarget;
        address[2] players;
        bytes32[2] merkleRoots;
        uint startingPlayer;
        string[2] nicks;
        uint lastTransaction;
        bool[2] withdrawn;
        bytes32 creatorHash;
        uint8 guestRandomNumber;
        uint8 creatorRandomNumber;
    }

    uint32[] openGames;
    mapping(uint32 => Game) gamesData;
    uint32 nextGameIdx;


    string public myString = "Hello World";

    function set(string memory x) public {
        myString = x;
    }

    // Check Merkle Tree proof ( merkle proof = merkle path)
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

    function submitMerkleRoot(uint32 gameIdx, bytes32 root) public returns(bytes32){
        require(msg.sender == gamesData[gameIdx].players[0] || msg.sender == gamesData[gameIdx].players[1]);
        require(gamesData[gameIdx].status == 5);

        bytes32 root1 = root;
        
        
        if(msg.sender == gamesData[gameIdx].players[0])
            gamesData[gameIdx].merkleRoots[0] = root;
            else
            gamesData[gameIdx].merkleRoots[1] = root;

        if(gamesData[gameIdx].merkleRoots[0] != 0x0 && gamesData[gameIdx].merkleRoots[1] != 0x0){
             //Define the starting player
            if((gamesData[gameIdx].creatorRandomNumber ^ gamesData[gameIdx].guestRandomNumber) & 0x01 == 0){
                gamesData[gameIdx].status = 1;
                gamesData[gameIdx].startingPlayer = 1;
                emit GameStarted(gameIdx, gamesData[gameIdx].players[1]);
        } 
        else {
                gamesData[gameIdx].status = 2;
                gamesData[gameIdx].startingPlayer = 2;
                emit GameStarted(gameIdx, gamesData[gameIdx].players[1]);
        }
        }
        return root1;
    }

    function getTestGameInfo(uint32 gameIdx) public view returns (uint32 gameIndex,bytes32[2] memory merkleRoots, uint8 status, uint amount, address[2] memory players) {
        return (
        	gamesData[gameIdx].gameIndex,
            gamesData[gameIdx].merkleRoots,
            gamesData[gameIdx].status,
            gamesData[gameIdx].amount,
            gamesData[gameIdx].players
           
            
        );
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


        gamesData[gameIdx].creatorRandomNumber = revealedRandomNumber;
       
        emit GameConfirmed(gameIdx, gamesData[gameIdx].players[1]);
       
    }

    function validateDesk(uint8[] memory rows, uint8[] memory cols) public returns(bool){
        
    }

    function playerReady(uint gameIdx, uint8[] memory rows, uint8[] memory cols) public {
    	
    }
}

	

