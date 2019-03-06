// test/dipDappDoe.js
const Battleships = artifacts.require("./Battleships.sol");
const LibString = artifacts.require("./LibString.sol");
let gamesInstance, libStringInstance;

contract('Battleships', function (accounts) {
	const player1 = accounts[0];
    const player2 = accounts[1];
    const randomUser = accounts[5];

    it("should be deployed", async function() {
        gamesInstance = await Battleships.deployed();
        assert.isOk(gamesInstance, "instance should not be null");
        assert.equal(typeof gamesInstance, "object", "Instance should be an object");

        libStringInstance = await LibString.deployed();
        assert.isOk(libStringInstance, "instance should not be null");
        assert.equal(typeof libStringInstance, "object", "Instance should be an object");
    });

    it("should start with no games at the begining", async function () {
        let gamesAddr = await gamesInstance.getOpenGames.call();
        assert.deepEqual(gamesAddr, [], "Should have zero games at the begining")
    });


       


    it("hash should equal", async function () {
        let hash1 = await libStringInstance.saltedHash.call('12', "qq");
        

        assert.equal(hash1, "0x68fd019d68081259199419e96fd64fdadb2c9df64b44f642079b9f29862bd151", "hash of 12 and qq should equal 0x68fd019d68081259199419e96fd64fdadb2c9df64b44f642079b9f29862bd151")
       
       
    });


    it("should use the saltedHash function from the library", async function () {
        let hash1 = await libStringInstance.saltedHash.call(123, "my salt 1");
        let hashA = await gamesInstance.saltedHash.call(123, "my salt 1");

        let hash2 = await libStringInstance.saltedHash.call(123, "my salt 2");
        let hashB = await gamesInstance.saltedHash.call(123, "my salt 2");

        let hash3 = await libStringInstance.saltedHash.call(234, "my salt 1");
        let hashC = await gamesInstance.saltedHash.call(234, "my salt 1");

        assert.equal(hash1, hashA, "Contract hashes should match the library output")
        assert.equal(hash2, hashB, "Contract hashes should match the library output")
        assert.equal(hash3, hashC, "Contract hashes should match the library output")

        assert.notEqual(hash1, hash2, "Different salt should produce different hashes");
        assert.notEqual(hash1, hash3, "Different numbers should produce different hashes");
        assert.notEqual(hash2, hash3, "Different numbers and salt should produce different hashes");
    });



     it("should create a game with no money", async function () {

        let hash = await libStringInstance.saltedHash.call(123, "my salt 1");

        await gamesInstance.createGame(hash, "John");
        let balance = await web3.eth.getBalance(gamesInstance.address);
        
        assert.equal(balance, 0, "The contract should have registered a zero amount of ether owed to the players");

        let gamesIdx = await gamesInstance.getOpenGames.call();
        gamesIdx = gamesIdx.map(n => n.toNumber());
        assert.deepEqual(gamesIdx, [0], "Should have one game");
        

        const emittedEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        assert.isOk(emittedEvents, "Events should be an array");
        assert.equal(emittedEvents.length, 1, "There should be one event");
        assert.isOk(emittedEvents[0], "There should be one event");
        assert.equal(emittedEvents[0].args.gameIdx.toNumber(), 0, "The game should have index zero");

        const gameIdx = gamesIdx[0];

        let gameInfo = await gamesInstance.getGameInfo(gameIdx);
        

       
        assert.equal(gameInfo.status.toNumber(), 0, "The game should not be started");
        assert.equal(gameInfo.amount.toNumber(), 0, "The game should have no money");
        assert.equal(gameInfo.nick1, "John", "The player 1 should be John");
        assert.equal(gameInfo.nick2, "", "The player 2 should be empty");
       

        let lastTransaction = await gamesInstance.getGameTimestamp(gameIdx);
        assert.isAbove(lastTransaction.toNumber(), 0, "The last timestamp should be set");

        let players = await gamesInstance.getGamePlayers(gameIdx);
        assert.equal(players.player1, accounts[0], "The address of player 1 should be set");
        assert.equal(players.player2, "0x0000000000000000000000000000000000000000", "The address of player 2 should be empty");
       
    });

    it("should create a game with money", async function () {
        let hash = await libStringInstance.saltedHash.call(123, "my salt 1");

        await gamesInstance.createGame(hash, "Jane", { value: web3.utils.toWei('0.01', 'ether') });

        let balance = await web3.eth.getBalance(gamesInstance.address);
        assert.equal(balance - web3.utils.toWei('0.01', 'ether'), 0, "The contract should have registered 0.01 ether owed to the players");

        let gamesIdx = await gamesInstance.getOpenGames.call();
        gamesIdx = gamesIdx.map(n => n.toNumber());
        assert.deepEqual(gamesIdx, [0, 1], "Should have two games");

        const emittedEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        assert.isOk(emittedEvents, "Events should be an array");
        assert.equal(emittedEvents.length, 2, "There should be two? event");
        assert.isOk(emittedEvents[1], "There should be one event");
        assert.equal(emittedEvents[1].args.gameIdx.toNumber(), 1, "The game should have index zero");

        const gameIdx = gamesIdx[1];

        let gameInfo = await gamesInstance.getGameInfo(gameIdx);


        assert.equal(gameInfo.status.toNumber(), 0, "The game should not be started");

        assert.equal(gameInfo.amount - web3.utils.toWei('0.01', 'ether'), 0, "The game should have 0.01 ether");
        assert.equal(gameInfo.nick1, "Jane", "The player 1 should be Jane");
        assert.equal(gameInfo.nick2, "", "The player 2 should be empty");
       

        let lastTransaction = await gamesInstance.getGameTimestamp(gameIdx);
        assert.isAbove(lastTransaction.toNumber(), 0, "The last timestamp should be set");

        let players = await gamesInstance.getGamePlayers(gameIdx);
        assert.equal(players.player1, accounts[0], "The address of player 1 should be set");
        assert.equal(players.player2, "0x0000000000000000000000000000000000000000", "The address of player 2 should be empty");
    });

    // DipDappDoe.acceptGame

    it("should reject accepting a non-existing game", async function () {
        try {
            await gamesInstance.acceptGame(1234, 0, "Mary");
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }
    });

     it("should reject accepting games with a different amount of money than expected", async function () {
        

        let hash = await libStringInstance.saltedHash.call(123, "my salt 1");
        await gamesInstance.createGame(hash, "Johny", { value: web3.utils.toWei('0.02', 'ether') });

        let balance = await web3.eth.getBalance(gamesInstance.address);
        assert.equal(balance - web3.utils.toWei('0.03', 'ether'), 0, "The contract should have registered 0.02 ether owed to the players");

		const emittedEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        assert.isOk(emittedEvents, "Events should be an array");
        assert.equal(emittedEvents.length, 3, "There should be one event");
        assert.isOk(emittedEvents[emittedEvents.length-1], "There should be one event");
        assert.equal(emittedEvents[emittedEvents.length-1].args.gameIdx.toNumber(), 2, "The game should have index two");

        const gameIdx = emittedEvents[2].args.gameIdx.toNumber();
        
        let gamesIdx = await gamesInstance.getOpenGames.call();
        gamesIdx = gamesIdx.map(n => n.toNumber());
        assert.include(gamesIdx, gameIdx, "Should include the new game");

        let gameInfo = await gamesInstance.getGameInfo(gameIdx);

        
        assert.equal(gameInfo.status.toNumber(), 0, "The game should not be started");

        assert.equal(gameInfo.amount - web3.utils.toWei('0.02', 'ether'), 0, "The game should have 0.02 ether");
        assert.equal(gameInfo.nick1, "Johny", "The player 1 should be Johny");
        assert.equal(gameInfo.nick2, "", "The player 2 should be empty");
       

        try {
            await gamesInstance.acceptGame(gameIdx, 0, "Kathy");
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }
    });

     it("should accept an available game", async function () {
        
        

        let hash = await libStringInstance.saltedHash.call(123, "my salt 1");

        // create game
        await gamesInstance.createGame(hash, "James", { value: web3.utils.toWei('0.005', 'ether') });

        let balance = await web3.eth.getBalance(gamesInstance.address);

        assert.equal(balance - web3.utils.toWei('0.035', 'ether'), 0, "The contract should have registered 0.005 ether owed to the players");

        const createdGamesEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        assert.isOk(createdGamesEvents, "Events should be an array");
        assert.equal(createdGamesEvents.length, 4, "There should be one event");
        assert.isOk(createdGamesEvents[createdGamesEvents.length-1], "There should be one event");
        assert.equal(createdGamesEvents[createdGamesEvents.length-1].args.gameIdx.toNumber(), 3, "The game should have index three");

        const gameIdx = createdGamesEvents[3].args.gameIdx.toNumber();

        let gamesIdx = await gamesInstance.getOpenGames.call();
        gamesIdx = gamesIdx.map(n => n.toNumber());
        assert.include(gamesIdx, gameIdx, "Should include the new game");


        let gameInfo = await gamesInstance.getGameInfo(gameIdx);
     
        assert.equal(gameInfo.status.toNumber(), 0, "The game should not be started");

        assert.equal(gameInfo.amount - web3.utils.toWei('0.005', 'ether'), 0, "The game should have 0.005 ether");
        assert.equal(gameInfo.nick1, "James", "The player 1 should be James");
        assert.equal(gameInfo.nick2, "", "The player 2 should be still empty");
        

        // accept game
        await gamesInstance.acceptGame(gameIdx, 0, "Kathy", { value: web3.utils.toWei('0.005', 'ether'), from: player2 });

        balance = await web3.eth.getBalance(gamesInstance.address);
        assert.equal(balance - web3.utils.toWei('0.04', 'ether'), 0, "The contract should have registered 0.005 more ether owed to the players");

        const acceptedGamesEvents = await gamesInstance.getPastEvents( 'GameAccepted', { fromBlock: 0, toBlock: 'latest' } )
        assert.isOk(acceptedGamesEvents, "Events should be an array");
        assert.equal(acceptedGamesEvents.length, 1, "There should be one accepted game event");
        assert.isOk(acceptedGamesEvents[0], "There should be one accepted game event");
        assert.equal(acceptedGamesEvents[0].args.gameIdx.toNumber(), gameIdx, "The game should have the last gameIdx");
        assert.equal(acceptedGamesEvents[0].args.opponent, player1, "The opponent should be player 1");

        gameInfo = await gamesInstance.getGameInfo(gameIdx);
    
        assert.equal(gameInfo.status.toNumber(), 0, "The game should not be started yet");

        assert.equal(gameInfo.amount - web3.utils.toWei('0.005', 'ether'), 0, "The game should have 0.005 ether");
        assert.equal(gameInfo.nick1, "James", "The player 1 should be James");
        assert.equal(gameInfo.nick2, "Kathy", "The player 2 should be Kathy");
        

        lastTransaction = await gamesInstance.getGameTimestamp(gameIdx);
        assert.isAbove(lastTransaction.toNumber(), 0, "The last timestamp should be set");

        let players = await gamesInstance.getGamePlayers(gameIdx);
        assert.equal(players.player1, player1, "The address of player 1 should be set");
        assert.equal(players.player2, player2, "The address of player 2 should be set");
      
    });

     it("should reject accepting an already accepted game", async function () {
        
        

        let hash = await libStringInstance.saltedHash.call(123, "my salt 1");
        await gamesInstance.createGame(hash, "Jim");

        const createdGamesEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        assert.isOk(createdGamesEvents, "Events should be an array");
        assert.equal(createdGamesEvents.length, 5, "There should be one event");
        assert.isOk(createdGamesEvents[createdGamesEvents.length-1], "There should be one event");
        assert.equal(createdGamesEvents[createdGamesEvents.length-1].args.gameIdx.toNumber(), 4, "The game should have index four");

        const gameIdx = createdGamesEvents[4].args.gameIdx.toNumber();

        let gamesIdx = await gamesInstance.getOpenGames.call();
        gamesIdx = gamesIdx.map(n => n.toNumber());
        assert.include(gamesIdx, gameIdx, "Should include the new game");

        await gamesInstance.acceptGame(gameIdx, 0, "Dana", { from: player2 });

        const acceptedGamesEvents = await gamesInstance.getPastEvents( 'GameAccepted', { fromBlock: 0, toBlock: 'latest' } )
        assert.isOk(acceptedGamesEvents, "Events should be an array");
        assert.equal(acceptedGamesEvents.length, 2, "There should be one accepted game event");
        assert.isOk(acceptedGamesEvents[1], "There should be one accepted game event");
        assert.equal(acceptedGamesEvents[1].args.gameIdx.toNumber(), gameIdx, "The game should have the last gameIdx");

        try {
            await gamesInstance.acceptGame(gameIdx, 0, "Dana", { from: randomUser });
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }

        try {
            await gamesInstance.acceptGame(gameIdx, 1, "Donna", { from: player2 });
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }

        try {
            await gamesInstance.acceptGame(gameIdx, 1, "Dolly");
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }
    });

      it("should reject accepting a game if it is already started", async function () {

      	

        let hash = await libStringInstance.saltedHash.call(123, "initial salt");
        await gamesInstance.createGame(hash, "Jim", {from: player1});

		const emittedEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
       
        const gameIdx = emittedEvents[emittedEvents.length-1].args.gameIdx.toNumber();
       

        await gamesInstance.acceptGame(gameIdx, 200, "Dana", {from: player2});
        await gamesInstance.confirmGame(gameIdx, 123, "initial salt", {from: player1});
        

        try {
            await gamesInstance.acceptGame(gameIdx, 150, "Jack", {from: randomUser});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should have been reverted. Instead, the error was: " + err.message);
        }
    });

      it("should reject accepting a game if it has already ended", async function () {
        
        
        
        let hash = await libStringInstance.saltedHash.call(123, "initial salt");
        await gamesInstance.createGame(hash, "Jim", {from: player1});
        
        const gameCreatedEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        const gameIdx = gameCreatedEvents[gameCreatedEvents.length-1].args.gameIdx.toNumber();
        
        await gamesInstance.acceptGame(gameIdx, 234, "Dana", {from: player2});
        
        // now the player 2 will win, and the game will end
        await gamesInstance.confirmGame(gameIdx, 124, "initial salt", {from: player1});
        
        const gameEndedEvents = await gamesInstance.getPastEvents( 'GameEnded', { fromBlock: 0, toBlock: 'latest' } )
        assert.equal(gameEndedEvents.length, 2, "GameEnded should have 2 events");
        assert.isOk(gameEndedEvents[0].args.opponent, "Opponent should be an address");
        assert(gameEndedEvents[0].args.opponent == player1 || gameEndedEvents[0].args.opponent == player2, "The opponent should be among the players");
        assert(gameEndedEvents[1].args.opponent == player1 || gameEndedEvents[1].args.opponent == player2, "The opponent should be among the players");

        try {
            await gamesInstance.acceptGame(gameIdx, 150, "Jack", {from: randomUser});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }
    });
     it("should remove the game from the list of available games when accepted", async function(){
        

        let gamesIdx1 = await gamesInstance.getOpenGames.call();
        gamesIdx1 = gamesIdx1.map(n => n.toNumber());

        let hash = await libStringInstance.saltedHash.call(123, "my salt 1");
        await gamesInstance.createGame(hash, "Jim");

        const emittedEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        const gameIdx = emittedEvents[emittedEvents.length-1].args.gameIdx.toNumber();

        let gamesIdx2 = await gamesInstance.getOpenGames.call();
        gamesIdx2 = gamesIdx2.map(n => n.toNumber());
        
        await gamesInstance.acceptGame(gameIdx, 0, "Dana", { from: player2 });
        
        let gamesIdx3 = await gamesInstance.getOpenGames.call();
        gamesIdx3 = gamesIdx3.map(n => n.toNumber());
        
        assert.notInclude(gamesIdx1, gameIdx, "Should not include the new game yet");
        assert.include(gamesIdx2, gameIdx, "Should include the new game");
        assert.notInclude(gamesIdx3, gameIdx, "Should not include the new game anymore");
    });

    // DipDappDoe.confirmGame

    it("should reject confirming a non existing game", async function () {
        try {
            await gamesInstance.confirmGame(12345687, 100, "some salt");
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }

        try {
            await gamesInstance.confirmGame(23456789, 200, "some more salt");
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }
    });

    it("should reject confirming a game that has not been accepted yet", async function () {
       

        let hash = await libStringInstance.saltedHash.call(123, "initial salt");
        await gamesInstance.createGame(hash, "Jim", {from: player1});

        const emittedEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        const gameIdx = emittedEvents[emittedEvents.length-1].args.gameIdx.toNumber();

        try {
            await gamesInstance.confirmGame(gameIdx, 123, "some salt");
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }

        try {
            await gamesInstance.confirmGame(gameIdx, 200, "some more salt");
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }
    });

     it("should give the game for the second user if the hash does not match with the revealed values", async function () {
     

        let hash = await libStringInstance.saltedHash.call(123, "initial salt");
        await gamesInstance.createGame(hash, "Jim", {from: player1});

        const emittedEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        const gameIdx = emittedEvents[emittedEvents.length-1].args.gameIdx.toNumber();

        await gamesInstance.acceptGame(gameIdx, 234, "Dana", {from: player2});
        
        await gamesInstance.confirmGame(gameIdx, 124, "initial salt", {from: player1});
        
        // 123 != 124 => player 2 should be the winner
        let gameInfo = await gamesInstance.getGameInfo(gameIdx);
        
        assert.equal(gameInfo.status.toNumber(), 12, "Player 2 should be the winner");
    });

     it("should confirm a valid game for player 1", async function () {
        
        

        let hash = await libStringInstance.saltedHash.call(100, "initial salt");
        await gamesInstance.createGame(hash, "Jim", {from: player1});

        const creationEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        let gameIdx = creationEvents[creationEvents.length-1].args.gameIdx.toNumber();

        await gamesInstance.acceptGame(gameIdx, 200, "Dana", {from: player2});

        let lastTransactionpre = await gamesInstance.getGameTimestamp(gameIdx);
        assert.isAbove(lastTransactionpre.toNumber(), 0, "The last timestamp should be set");

        await new Promise(resolve => setTimeout(resolve, 1000));
        await gamesInstance.confirmGame(gameIdx, 100, "initial salt", {from: player1});
        

        const startingEvents = await gamesInstance.getPastEvents( 'GameStarted', { fromBlock: 0, toBlock: 'latest' } )
        gameIdx = startingEvents[startingEvents.length-1].args.gameIdx.toNumber();

        assert.isOk(startingEvents, "Events should be an array");
        assert.equal(startingEvents.length, 2, "There should be one started game event");
        assert.isOk(startingEvents[startingEvents.length-1], "There should be one started game event");
        assert.equal(startingEvents[startingEvents.length-1].args.gameIdx.toNumber(), gameIdx, "The game should have the last gameIdx");
        assert.equal(startingEvents[startingEvents.length-1].args.opponent, player2, "The opponent should be player 2");

        // 100 ^ 200 is even => player 1 should start
        let gameInfo = await gamesInstance.getGameInfo(gameIdx);
        
        assert.equal(gameInfo.status.toNumber(), 1, "Player 1 should be able to start");

        assert.equal(gameInfo.amount - 0, 0, "The game should have 0 ether");
        assert.equal(gameInfo.nick1, "Jim", "The player 1 should be Jim");
        assert.equal(gameInfo.nick2, "Dana", "The player 2 should be Dana");
        

        let lastTransactionpost;
        lastTransactionpost = await gamesInstance.getGameTimestamp(gameIdx);
        assert.isAbove(lastTransactionpost.toNumber(), lastTransactionpre.toNumber(), "The last timestamp should be newer");

        let players = await gamesInstance.getGamePlayers(gameIdx);
        assert.equal(players.player1, player1, "The address of player 1 should still be set");
        assert.equal(players.player2, player2, "The address of player 2 should still be set");
    });

      it("should confirm a valid game for player 2", async function () {
        
       

        let hash = await libStringInstance.saltedHash.call(123, "initial salt");
        await gamesInstance.createGame(hash, "Jim", {from: player1});

        const creationEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        let gameIdx = creationEvents[creationEvents.length-1].args.gameIdx.toNumber();

        await gamesInstance.acceptGame(gameIdx, 200, "Dana", {from: player2});

        let lastTransactionpre = await gamesInstance.getGameTimestamp(gameIdx);
        assert.isAbove(lastTransactionpre.toNumber(), 0, "The last timestamp should be set");

        await new Promise(resolve => setTimeout(resolve, 1000));
        await gamesInstance.confirmGame(gameIdx, 123, "initial salt", {from: player1});
        
        const startingEvents = await gamesInstance.getPastEvents( 'GameStarted', { fromBlock: 0, toBlock: 'latest' } )
        gameIdx = startingEvents[startingEvents.length-1].args.gameIdx.toNumber();

        assert.isOk(startingEvents, "Events should be an array");
        assert.equal(startingEvents.length, 3, "There should be one started game event");
        assert.isOk(startingEvents[startingEvents.length-1], "There should be one started game event");
        assert.equal(startingEvents[startingEvents.length-1].args.gameIdx.toNumber(), gameIdx, "The game should have the last gameIdx");
        assert.equal(startingEvents[startingEvents.length-1].args.opponent, player2, "The opponent should be player 2");

        // 123 ^ 200 is odd => player 2 should start
        let gameInfo = await gamesInstance.getGameInfo(gameIdx);
        
        assert.equal(gameInfo.status.toNumber(), 2, "Player 2 should be able to start");

        assert.equal(gameInfo.amount - 0, 0, "The game should have 0 ether");
        assert.equal(gameInfo.nick1, "Jim", "The player 1 should be Jim");
        assert.equal(gameInfo.nick2, "Dana", "The player 2 should be Dana");

        let lastTransactionpost = await gamesInstance.getGameTimestamp(gameIdx);
        assert.isAbove(lastTransactionpost.toNumber(), lastTransactionpre.toNumber(), "The last timestamp should be newer");

 		let players = await gamesInstance.getGamePlayers(gameIdx);
        assert.equal(players.player1, player1, "The address of player 1 should still be set");
        assert.equal(players.player2, player2, "The address of player 2 should still be set");
    });

      it("should reject confirming a game if it is already started", async function () {

        let hash = await libStringInstance.saltedHash.call(123, "initial salt");
        await gamesInstance.createGame(hash, "Jim", {from: player1});

		const emittedEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        
        const gameIdx = emittedEvents[emittedEvents.length-1].args.gameIdx.toNumber();

        await gamesInstance.acceptGame(gameIdx, 200, "Dana", {from: player2});
        await gamesInstance.confirmGame(gameIdx, 123, "initial salt", {from: player1});
        
        try {
            await gamesInstance.confirmGame(gameIdx, 123, "initial salt", {from: player1});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should have been reverted. Instead, the error was: " + err.message);
        }
    });

    it("should reject confirming a game if it has already ended", async function () {
              
        let hash = await libStringInstance.saltedHash.call(123, "initial salt");
        await gamesInstance.createGame(hash, "Jim", {from: player1});
        
        const emittedEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        const gameIdx = emittedEvents[emittedEvents.length-1].args.gameIdx.toNumber();
        
        await gamesInstance.acceptGame(gameIdx, 234, "Dana", {from: player2});
        
        // now the player 2 will win, and the game will end
        await gamesInstance.confirmGame(gameIdx, 124, "initial salt", {from: player1});
        
        try {
            await gamesInstance.confirmGame(gameIdx, 123, "initial salt", {from: player1});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }
    });

    it("should reject game confirmations from users other than the creator", async function () {
       

        let hash = await libStringInstance.saltedHash.call(123, "initial salt");
        await gamesInstance.createGame(hash, "Jim", {from: player1});

        const emittedEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        const gameIdx = emittedEvents[emittedEvents.length-1].args.gameIdx.toNumber();

        await gamesInstance.acceptGame(gameIdx, 200, "Dana", {from: player2});
        
        try {
            await gamesInstance.confirmGame(gameIdx, 123, "initial salt", {from: randomUser});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }
    });
    it("should store merkle root", async function () {
       

        let hash = await libStringInstance.saltedHash.call(13, "qq");
        await gamesInstance.createGame(hash, "maks", {from: player1});

        const emittedEvents = await gamesInstance.getPastEvents( 'GameCreated', { fromBlock: 0, toBlock: 'latest' } )
        const gameIdx = emittedEvents[emittedEvents.length-1].args.gameIdx.toNumber();

        await gamesInstance.acceptGame(gameIdx, 123, "momo", {from: player2});
        
        try {
            await gamesInstance.confirmGame(gameIdx, 13, "qq", {from: player1});
            assert.isOk("Game confirmed by maker");
            let root1 = await gamesInstance.submitMerkleRoot(gameIdx,"0xb87140629e390154e59c304c9238179e5b1412c1035c398ce48d6b4381d07be7", {from: player1});
   			let root2 = await gamesInstance.submitMerkleRoot(gameIdx,"0xb87140629e390154e59c304c9238179e5b1412c1035c398ce48d6b4381d07be7", {from: player2});
  
   			let info = await gamesInstance.getTestGameInfo.call(gameIdx);
        }
        catch (err) {
            assert.include(err.message, "revert", "The transaction should be reverted");
        }

        
    });

}); 
