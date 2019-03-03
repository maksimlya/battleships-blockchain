import { keccak256, bufferToHex } from 'ethereumjs-util';
import React, { Component } from "react"
import { connect } from "react-redux"
import { Row, Col, Divider, Button, Spin, Icon, message, notification } from "antd"
import MerkleTree from '../MerkleTree'
import 'antd/dist/antd.css';


import Media from "react-media"
import LoadingView from "../views/loading"
import MessageView from "../views/message"
import './Game.css';

const CELL_SIZE = 70;
const WIDTH = 560;
const HEIGHT = 560;

const CONTRACT_TIMEOUT = 1000 * 60 * 10 // 10 minutes by default


class Cell extends React.Component {
    render() {
      const { x, y } = this.props;
      return (
        <div className="Cell" style={{
          left: `${CELL_SIZE * x + 1}px`,
          top: `${CELL_SIZE * y + 1}px`,
          width: `${CELL_SIZE - 1}px`,
          height: `${CELL_SIZE - 1}px`,
        }} />
      );
    }
  }

 

  
class GameView extends Component {
    constructor(props) {
        super(props)

        this.state = {
            loadingGameInfo: true,
            confirmLoading: false,
            markLoading: false,
            game: null,
            cells: [],
        }
        this.rows = HEIGHT / CELL_SIZE;
        this.cols = WIDTH / CELL_SIZE;
        this.board = this.makeEmptyBoard();
    }

    

    makeEmptyBoard() {
        let board = [];
        for (let y = 0; y < this.rows; y++) {
          board[y] = [];
          for (let x = 0; x < this.cols; x++) {
            board[y][x] = false;
          }
        }
        return board;
      }

      makeCells() {
        const { drizzle, drizzleState } = this.props;
        const contract = drizzle.contracts.Battleships;
        let cells = [];
        for (let y = 0; y < this.rows; y++) {
          for (let x = 0; x < this.cols; x++) {
            if (this.board[y][x]) {
              cells.push({ x, y });
            }
          }
        }
        return cells;
      }
      getElementOffset() {
        const rect = this.boardRef.getBoundingClientRect();
        const doc = document.documentElement;
        return {
          x: (rect.left + window.pageXOffset) - doc.clientLeft,
          y: (rect.top + window.pageYOffset) - doc.clientTop,
        };
      }

      handleClick = (event) => {
        const elemOffset = this.getElementOffset();
        const offsetX = event.clientX - elemOffset.x;
        const offsetY = event.clientY - elemOffset.y;
        
        const x = Math.floor(offsetX / CELL_SIZE);
        const y = Math.floor(offsetY / CELL_SIZE);
        if (x >= 0 && x <= this.cols && y >= 0 && y <= this.rows) {
            if(x >= 1 && x <= 6 && y >= 1 && y <= 6){
                    if(!this.board[y+1][x+1] && !this.board[y-1][x-1] && !this.board[y-1][x+1] && !this.board[y+1][x-1])
                       this.board[y][x] = !this.board[y][x];  
            } else if(x === 0){
                if(y === 0){
                    if(!this.board[1][1])
                        this.board[y][x] = !this.board[y][x];
                } else if(y === 7){
                    if(!this.board[6][1])
                        this.board[y][x] = !this.board[y][x];
                }
                else { 
                    if(!this.board[y+1][x+1] && !this.board[y-1][x+1]){
                        this.board[y][x] = !this.board[y][x];
                    }
                }
                
            }
            else if(x === 7){
                if(y === 0){
                    if(!this.board[1][6])
                        this.board[y][x] = !this.board[y][x];
                } else if(y === 7){
                    if(!this.board[6][6])
                        this.board[y][x] = !this.board[y][x];
                }
                else { 
                    if(!this.board[y+1][x-1] && !this.board[y-1][x-1]){
                        this.board[y][x] = !this.board[y][x];
                    }
                }
            }
            else if(y === 0){
                    if(!this.board[y+1][x+1] && !this.board[y+1][x-1]){
                        this.board[y][x] = !this.board[y][x];
                    }
            }
            else if(y === 7){
                if(!this.board[y-1][x+1] && !this.board[y-1][x-1]){
                    this.board[y][x] = !this.board[y][x];
                }
        }
        }
        this.setState({ cells: this.makeCells() });
      }
  

    
    

    componentDidMount() {
        const { drizzle, drizzleState } = this.props;
        this.setState({ loadingGameInfo: true })

       
        this.fetchGameStatus().then(game => {
            this.setState({ game, loadingGameInfo: false })

            // Check if we need to confirm the game
            return this.checkConfirmGame(game)
        })
        // .then(() => {
        //     return this.checkLastPositionLeft(this.state.game)
        // }).catch(err => {
        //     this.setState({ loadingGameInfo: false })
        // })
       
        const contract = drizzle.contracts.Battleships;

        this.acceptedEvent = contract.events.GameAccepted({
            filter: { opponent: this.props.accounts && this.props.accounts[0] },
            fromBlock: this.props.status.startingBlock || 0
        })
            .on('data', event => this.onGameAccepted(event));
            //.on('error', err => message.error(err && err.message || err))

        this.startedEvent = contract.events.GameStarted({
            filter: { opponent: this.props.accounts && this.props.accounts[0] },
            fromBlock: this.props.status.startingBlock || 0
        })
            .on('data', event => this.onGameStarted(event));
            //.on('error', err => message.error(err && err.message || err))

        // this.positionMarkedEvent = contract.events.PositionMarked({
        //     filter: { opponent: this.props.accounts && this.props.accounts[0] },
        //     fromBlock: this.props.status.startingBlock || 0
        // })
        //     .on('data', event => this.onPositionMarked(event))
        //     .on('error', err => message.error(err && err.message || err))

        this.endedEvent = contract.events.GameEnded({
            filter: { opponent: this.props.accounts && this.props.accounts[0] },
            fromBlock: this.props.status.startingBlock || 0
        })
            .on('data', event => this.onGameEnded(event));
            //.on('error', err => message.error(err && err.message || err))
     }

     onGameAccepted(event) {
         console.log(event);
        return this.fetchGameStatus().then(game => {
            this.setState({ game, loadingGameInfo: false })

            notification.success({
                message: 'Game accepted',
                description: `${game.nick2} has accepted the game!`
            })
            return this.checkConfirmGame(game)
        })
    }

    onGameStarted() {
        // return this.fetchGameStatus().then(game => {
        //     this.setState({ game, loadingGameInfo: false })

        //     notification.success({
        //         message: 'Game confirmed',
        //         description: `${game.nick1} has confirmed the game!`
        //     })
        // })
    }
    onGameEnded() {
        // return this.fetchGameStatus().then(game => {
        //     this.setState({ game, loadingGameInfo: false })

        //     let type = 'info', message = "Game ended", description = ""

        //     if (game.player1 == this.props.accounts[0]) {
        //         if (game.status == "10") {
        //             description = "The game has ended in draw"
        //             if (game.amount != "0") description += ". You can withdraw your initial bet."
        //         }
        //         else if (game.status == "11") {
        //             type = "success"
        //             description = "You have won the game!"
        //             if (game.amount != "0") description += " You can withdraw the full amount."
        //         }
        //         else if (game.status == "12") {
        //             type = "warning"
        //             description = `${game.nick2} has won the game`
        //         }
        //         else return
        //     }
        //     else if (game.player2 == this.props.accounts[0]) {
        //         if (game.status == "10") {
        //             description = "The game has ended in draw"
        //             if (game.amount != "0") description += ". You can withdraw your initial bet."
        //         }
        //         else if (game.status == "11") {
        //             type = "warning"
        //             description = `${game.nick1} has won the game`
        //         }
        //         else if (game.status == "12") {
        //             type = "success"
        //             description = "You have won the game!"
        //             if (game.amount != "0") description += " You can withdraw the full amount."
        //         }
        //         else if (game.status == "11") {
        //             type = "warning"
        //             description = `${game.nick1} has won the game`
        //         }
        //         else return
        //     }
        //     else {
        //         if (game.status == "10") {
        //             description = "The game has ended in draw"
        //         }
        //         else if (game.status == "11") {
        //             description = `${game.nick1} has won the game`
        //         }
        //         else if (game.status == "12") {
        //             description = `${game.nick2} has won the game`
        //         }
        //         else return
        //     }

        //     notification[type]({
        //         message,
        //         description
        //     })
        // })
    }

     checkConfirmGame(game) {
        if (this.state.confirmLoading || game.status !== "0" || game.player2.match(/^0x0+$/) || game.player1 !== this.props.accounts[0]) {
            return
        }
        const { drizzle, drizzleState } = this.props;
        let contract = drizzle.contracts.Battleships;

        let data = this.props.status.createdGames[this.props.match.params.id]
        if (!data) {
            return notification.error({
                message: 'Failed to confirm the game',
                description: 'The random number and the salt can\'t be found'
            })
        }

        this.setState({ confirmLoading: true })

        return contract.methods.confirmGame(this.props.match.params.id, data.number, data.salt)
            .send({ from: this.props.accounts[0] })
            .then(tx => {
                
                this.setState({ confirmLoading: false })
                console.log(tx);
                if (!tx.events.GameStarted || !tx.events.GameStarted.returnValues) {
                    throw new Error("The transaction failed")
                }

                notification.success({
                    message: 'Game confirmed',
                    description: 'The game is on. Good luck!',
                })
                this.props.dispatch({ type: "REMOVE_CREATED_GAME", id: game.id })

                return this.fetchGameStatus().then(game => {
                    this.setState({ game })
                })
            })
            .catch(err => {
                this.setState({ confirmLoading: false })

                let msg = err.message.replace(/\.$/, "").replace(/Returned error: Error: MetaMask Tx Signature: /, "")
                notification.error({
                    message: 'Unable to confirm the game',
                    description: msg
                })
            })
    }

     fetchGameStatus() {
        const { drizzle, drizzleState } = this.props;
        const contract = drizzle.contracts.Battleships;

        const result = {}

        return contract.methods.getGameInfo(this.props.match.params.id).call().then(gameInfo => {
            result.amount = gameInfo.amount
            result.cells = gameInfo.cells
            result.nick1 = gameInfo.nick1
            result.nick2 = gameInfo.nick2
            result.status = gameInfo.status

            return contract.methods.getGamePlayers(this.props.match.params.id).call()
        }).then(players => {
            result.player1 = players.player1
            result.player2 = players.player2

            return contract.methods.getGameTimestamp(this.props.match.params.id).call()
        }).then(timestamp => {
            result.lastTransaction = timestamp * 1000

        //     return contract.methods.getGameWithdrawals(this.props.match.params.id).call()
        // }).then(withdrawals => {
        //     result.withdrawn1 = withdrawals.player1
        //     result.withdrawn2 = withdrawals.player2
            console.log(result);
            return result
        })
    }

    checkAlignment(cell,cells){
        // Check Borders..
       
        if(cell.x == 0 && cell.y == 0){
            if(cells[0][1] == 1)
                return("horizontal");
            if(cells[1][0] == 1)
                return("vertical");
            return("single ship");
        }
        if(cell.x == 7 && cell.y == 7){
            if(cells[7][6] == 1)
                return("horizontal");
            if(cells[6][7] == 1)
                return("vertical");
            return("single ship");
        }
        if(cell.x == 0 && cell.y == 7){
            if(cells[7][1] == 1)
                return("horizontal");
            if(cells[6][0] == 1)
                return("vertical");
            return("single ship");
        }
        if(cell.x == 7 && cell.y == 0){
            if(cells[0][6] == 1)
                return("horizontal");
            if(cells[1][7] == 1)
                return("vertical");
            return("single ship");
        }
       
       
        if(cell.x == 0){
            if(cells[cell.y][1] == 1)
            return("horizontal");
            if(cells[cell.y+1][0] == 1)
                return("vertical")
            if(cells[cell.y-1][0] == 1)
                return("vertical")
            return("single ship");
        }
        if(cell.x == 7){
            if(cells[cell.y][6] == 1)
                return("horizontal");
            if(cells[cell.y+1][7] == 1)
                return("vertical")
            if(cells[cell.y-1][7] == 1)
                return("vertical")
            return("single ship");
        }
        if(cell.y === 0){
            if(cells[1][cell.x] == 1)
                return("vertical");
            if(cells[0][cell.x+1]==1)
                return("horizontal");
            if(cells[0][cell.x-1]==1)
                return("horizontal");
            return("single ship");
        }
                
        if(cell.y == 7){
            if(cells[6][cell.x] == 1)
                return("vertical");
                if(cells[7][cell.x+1]==1)
                return("horizontal");
            if(cells[7][cell.x-1]==1)
                return("horizontal");
            return("single ship");
        }

         if(this.board[cell.y +1][cell.x] == 0 && this.board[cell.y-1][cell.x] == 0){   // Horizontal or single ship
             if(this.board[cell.y][cell.x+1] == 0 && this.board[cell.y][cell.x-1] == 0){ // Single ship 
                 return("single ship");
             } else return("horizontal");
         } else return("vertical");
             
       
    }

  

    checkShipLength(cell,alignment,cells,tempCells){
        let length = 1;
        let cond = true;
        let idx = 0;
        if(alignment === 'horizontal'){
            if(cell.x == 0){
                idx = 1;
                while(cond){
                if(cells[cell.y][idx] == 1){
                    length++;
                    tempCells = this.removeCell(tempCells,cell.y,idx++);
                }  else cond = false;
            }
            }
            else if(cell.x == 7){
                idx = 6;
                while(cond){
                if(cells[cell.y][idx] == 1){
                    length++;
                    tempCells = this.removeCell(tempCells,cell.y,idx--);
                }  else cond = false;
            }
        }
        else{
            let tmpIdx = cell.x;
            while(cond){
                if(cells[cell.y][tmpIdx] === 1 && tmpIdx >= 0){
                    tmpIdx--;
                } else cond = false;
            }
            idx = tmpIdx+1;
            length--;
            cond = true;
            while(cond){
            if(cells[cell.y][idx] == 1){
                length++;
                tempCells = this.removeCell(tempCells,cell.y,idx++);
            }  else cond = false;
        }
    }
    }
    if(alignment === 'vertical'){
        if(cell.y == 0){
            idx = 1;
            while(cond){
            if(cells[idx][cell.x] == 1){
                length++;
                tempCells = this.removeCell(tempCells,idx++,cell.x);
            }  else cond = false;
        }
        }
        else if(cell.y == 7){
            idx = 6;
            while(cond){
            if(cells[idx][cell.x] == 1){
                length++;
                tempCells = this.removeCell(tempCells,idx--,cell.x);
            }  else cond = false;
        }
    }
    else{
        let tmpIdx = cell.y;
        
        while(cond){
            if(cells[tmpIdx][cell.x] === 1 && tmpIdx <= 7){
                tmpIdx++;
            } else cond = false;
        }
        
        idx = tmpIdx-1;
        length--;
        cond = true;
        while(cond){
        if(idx >= 0){
            if(cells[idx][cell.x] == 1){
                length++;
                tempCells = this.removeCell(tempCells,idx--,cell.x);
            } else cond = false;
        } else cond = false;
    }
}
}
        return length;
    }

    removeCell(cells,y,x){
        
        for (let i in cells){
            if(cells[i].x === x)
                if(cells[i].y === y){
                  cells.splice(i,1);
                }
        }
        return cells;
    }

    validateShipsPlacement(cells) {
        
        const ships = [true,true,true,true,true];   // To remember placed ships
        let tempCells = this.state.cells;
        while (tempCells.length > 0){
            let cell = tempCells.pop();
            
            let alignment = this.checkAlignment(cell,cells);
            if(alignment === 'single ship'){
                if(ships[0])
                    ships[0] = false;
                else return false;
            continue;
            }
           
            let length = this.checkShipLength(cell,alignment,cells,tempCells);

            
            switch(length){
                case 2:
                    if(ships[1])
                        ships[1] = false;
                    else return false;
                    break;
                case 3:
                    if(ships[2])
                        ships[2] = false;
                    else return false;
                    break;
                case 4:
                    if(ships[3])
                        ships[3] = false;
                    else return false;
                    break;
                case 5:
                    if(ships[4])
                        ships[4] = false;
                    else return false;
                    break;
                default:
                    return false;
                
            }
    
        
           
        }
        if(!ships[0] && !ships[1] && !ships[2] && !ships[3] && !ships[4])
            return true;
        return false;
    }

    onReadyClick = (event) => {
        let cells = []
        for(let i = 0 ; i < 8 ; i ++)
            cells[i] = new Array(8);
        for(let i = 0 ; i < this.board.length ; i ++)
            for(let j = 0 ; j < this.board.length; j ++)
                if(this.board[i][j])
                    cells[i][j] = 1;
                else
                    cells[i][j] = 0;
       // this.setState({cells: this.makeCells()});
        let arePlacementsValid = this.validateShipsPlacement(cells);

        if(arePlacementsValid){
            
             
            
             
            // const proof = merkleTree.getHexProof(elements[0]);
            // const leaf = bufferToHex(keccak256(elements[0]));
            // (async() => {
               
            //     let check = await contract.methods.checkProof(proof,root,leaf).call();
            //   })();

            let elements = [].concat(...cells);
            let randomizedValues = [];
            let min = 10000;
            let max = 19999;
            for( let i = 0 ; i < 64 ; i ++){
                randomizedValues.push(JSON.stringify(elements[i]) + JSON.stringify(Math.floor(Math.random() * (+max - +min)) + +min));
            }
            
            const merkleTree = new MerkleTree(randomizedValues)
            const root = merkleTree.getHexRoot();

            console.log(root);
            notification.success({
                message: 'Ships placements are valid',
                description: 'Awaiting Opponent!',
            })
        } else
        notification.error({
            message: 'Wrong ships placements',
            description: 'Try Again!',
        })
    }


     renderDesktop() {
        // this.state.gameId
        const { drizzle, drizzleState } = this.props;
        let web3 = drizzle.web3;
        const { cells } = this.state;
        return <Row gutter={48}>
            <Col md={12}>
                <div className="card">
                    <h1 className="light">Place Ships:</h1>
                    

            <div>
                <div className="Board"
                style={{ width: WIDTH, height: HEIGHT,
                    backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`}}
                onClick={this.handleClick}
                ref={(n) => { this.boardRef = n; }}>
                {cells.map(cell => (
                    <Cell x={cell.x} y={cell.y}
                        key={`${cell.x},${cell.y}`}/>
                ))}
                </div>
                <Button type="primary" size = "large" onClick = { this.onReadyClick }>Ready</Button>
            </div>
            
                    {/* <Divider />

                    <table id="board">
                        <tbody>
                            <tr>
                                <td><div id="cell-0" onClick={() => this.markPosition(0)} className={this.getCellClass(0)} /></td>
                                <td className="line" />
                                <td><div id="cell-1" onClick={() => this.markPosition(1)} className={this.getCellClass(1)} /></td>
                                <td className="line" />
                                <td><div id="cell-2" onClick={() => this.markPosition(2)} className={this.getCellClass(2)} /></td>
                            </tr>
                            <tr className="line">
                                <td colSpan={5} className="line" />
                            </tr>
                            <tr>
                                <td><div id="cell-3" onClick={() => this.markPosition(3)} className={this.getCellClass(3)} /></td>
                                <td className="line" />
                                <td><div id="cell-4" onClick={() => this.markPosition(4)} className={this.getCellClass(4)} /></td>
                                <td className="line" />
                                <td><div id="cell-5" onClick={() => this.markPosition(5)} className={this.getCellClass(5)} /></td>
                            </tr>
                            <tr className="line">
                                <td colSpan={5} className="line" />
                            </tr>
                            <tr>
                                <td><div id="cell-6" onClick={() => this.markPosition(6)} className={this.getCellClass(6)} /></td>
                                <td className="line" />
                                <td><div id="cell-7" onClick={() => this.markPosition(7)} className={this.getCellClass(7)} /></td>
                                <td className="line" />
                                <td><div id="cell-8" onClick={() => this.markPosition(8)} className={this.getCellClass(8)} /></td>
                            </tr>
                        </tbody>
                    </table>

                </div>
            </Col>
            <Col md={12}>
                <div className="card">
                    <h1 className="light">Game status</h1>

                    <Divider /> */}

                    {/* {
                        (this.state.loadingGameInfo || this.state.confirmLoading || this.state.markLoading || this.state.withdrawLoading) ?
                            <div className="loading-spinner">Waiting  <Spin indicator={<Icon type="loading" style={{ fontSize: 14 }} spin />} /> </div> :
                            <div>
                                <p id="status" className="light">{this.getStatus()}</p>
                                <p id="timer" className="light">{this.getTimeStatus()}</p>
                                {
                                    this.state.game ? <p id="bet" className="light">Game bet: {web3.utils.fromWei(this.state.game.amount)} Ξ</p> : null
                                }

                                {
                                    (this.canWithdraw() && this.state.game && this.state.game.amount != 0) ? [
                                        <Divider key="0" />,
                                        <Button id="withdraw" key="1" type="primary" className="width-100"
                                            onClick={() => this.requestWithdrawal()}>Withdraw {web3.utils.fromWei(this.state.game.amount)} Ξ</Button>,
                                        <br key="3" />,
                                        <br key="4" />
                                    ] : null
                                }
                                <Button id="back" type="primary" className="width-100" onClick={() => this.goBack()}>Go back</Button>
                            </div>
                    } */}

                </div>
                
            </Col>
            
        </Row>
        
    }

render() {
    if (this.state.loadingGameInfo) {
        return <LoadingView />
    }
    else if (!this.state.game || !this.state.game.player1 || this.state.game.player1.match(/^0x0+$/)) {
        return <MessageView message="It looks like the game does not exist" />
    }

    return <div id="game">
        <Media query="(max-width: 767px)">
            {
                matches => matches ? this.renderMobile() : this.renderDesktop()
            }
        </Media>
    </div>
}

}



export default connect(({ accounts, status }) => ({ accounts, status }))(GameView)