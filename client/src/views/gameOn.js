import { keccak256, bufferToHex } from 'ethereumjs-util';
import React, { Component } from "react"
import { connect } from "react-redux"
import { Row, Col, Divider, Button, Spin, Icon, message, notification } from "antd"
import MerkleTree from '../MerkleTree'
import 'antd/dist/antd.css';
import Web3 from 'web3';



import Media from "react-media"
import LoadingView from "../views/loading"
import MessageView from "../views/message"
import './Game.css';

const CELL_SIZE = 70;
const WIDTH = 560;
const HEIGHT = 560;


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
  class HitCell extends React.Component {
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
  class MissedCell extends React.Component {
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



 
class GameOnView extends Component {
    constructor(props) {
        super(props)

        this.state = {
            game: null,
            cells: [],
            myCells: [],
            firedCells: [],
            hitCells: [],
            missedCells: [],
            turn: 0,
            myTurn: false,
        }
        this.rows = HEIGHT / CELL_SIZE;
        this.cols = WIDTH / CELL_SIZE;
        

        this.myBoard = this.makeEmptyEnemyBoard();
        this.enemyBoard = this.makeEmptyEnemyBoard();
    }

    componentDidMount(){

        const { drizzle, drizzleState } = this.props;
        const contract = drizzle.contracts.Battleships;

        this.attackedEvent = contract.events.PlayerAttacked({filter: { opponent: drizzleState.accounts && drizzleState.accounts[0],
            gameIdx: this.props.game && this.props.game.index
                },
                fromBlock: 'latest'
            }).on('data', event =>{
            console.log('Attacked!!!!!!!!');
            console.log(event);
        })

        this.setState({myTurn: this.props.myTurn});
        this.makeMyCells();
    }

    initialAttack(target){
        const { drizzle, drizzleState } = this.props;
        const contract = drizzle.contracts.Battleships;

       
        contract.methods.initialAttack(this.props.game.index,target).send({from: drizzleState.accounts[0]});
    }

    attackEnemy(target){
       
    }

    makeEmptyEnemyBoard() {
        let board = [];
        for (let y = 0; y < this.rows; y++) {
          board[y] = [];
          for (let x = 0; x < this.cols; x++) {
            board[y][x] = 0;
          }
        }
        return board;
      }

      makeMyCells() {
          let myBoard = []
          for(let i = 0 ; i < 8 ; i ++)
            myBoard[i] = [];
          for(let y = 0 ; y < this.rows ; y ++)
            for(let x = 0 ; x < this.cols ; x++)
                if(this.props.myBoard[y][x])
                    myBoard[y][x] = 1;
                else myBoard[y][x] = 0;
        const { drizzle, drizzleState } = this.props;
        const contract = drizzle.contracts.Battleships;
        let myCells = [];
        console.log(myBoard);
        for (let y = 0; y < this.rows; y++) {
          for (let x = 0; x < this.cols; x++) {
            if (myBoard[y][x] == 1) {
                myCells.push({ x, y });
            }
          }
        }
        console.log(myCells);
        this.setState({myCells});
      }

      makeEnemyCells() {
        const { drizzle, drizzleState } = this.props;
        const contract = drizzle.contracts.Battleships;
        let firedCells = [];
        let hitCells = [];
        let missedCells = [];
        for (let y = 0; y < this.rows; y++) {
          for (let x = 0; x < this.cols; x++) {
            if (this.enemyBoard[y][x] == 1) {
              firedCells.push({ x, y });
            }
            else if(this.enemyBoard[y][x] == 2){
                hitCells.push({x,y});
            }
            else if(this.enemyBoard[y][x] == 3){
                missedCells.push(x,y);
            }
          }
        }
        this.setState({firedCells,hitCells,missedCells});
      }

      getElementOffset() {
        const rect = this.boardRef.getBoundingClientRect();
        const doc = document.documentElement;
        return {
          x: (rect.left + window.pageXOffset) - doc.clientLeft,
          y: (rect.top + window.pageYOffset) - doc.clientTop,
        };
      }

      handleEnemyBoard = (event) => {
         if(!this.state.myTurn)
           return;
      const elemOffset = this.getElementOffset();
      const offsetX = event.clientX - elemOffset.x;
      const offsetY = event.clientY - elemOffset.y;
      
      const x = Math.floor(offsetX / CELL_SIZE);
      const y = Math.floor(offsetY / CELL_SIZE);
      if (x >= 0 && x <= this.cols && y >= 0 && y <= this.rows) {
          if(this.enemyBoard[y][x] === 0){
              this.enemyBoard[y][x] = 1;
                      
              let targetIdx = y*8 + x;
              this.makeEnemyCells();
              this.setState({myTurn: false});
              if(this.state.turn == 0)
                this.initialAttack(targetIdx);
              else
                this.attackEnemy(targetIdx);
          }
    }
  }

  onClaimVictory(){

  }
  render(){
    const { drizzle, drizzleState } = this.props;
    let web3 = drizzle.web3;
    const { cells } = this.state;
    const { myCells } = this.state;
    const { firedCells } = this.state;
    const { hitCells } = this.state;
    const { missedCells } = this.state;

    return <Row gutter={48}>
    <Col md={12}>
        <div className="card">
            <h1 className="light">My Board:</h1>
            

    <div>
        <div className="Board"
        style={{ width: WIDTH, height: HEIGHT,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`}}
       // onClick={this.handleClick}
       // ref={(n) => { this.boardRef = n; }}
       >
        {myCells.map(cell => (
            <Cell x={cell.x} y={cell.y}
                key={`${cell.x},${cell.y}`}/>
        ))}
        </div>
        <Button type="primary" size = "large" onClick = { this.onClaimVictory }>Claim Victory</Button>
    </div>
    </div>
        
    </Col>
    <Col md={12}>
        <div className="card">
            <h1 className="light">Enemy Board:</h1>
            

    <div>
        <div className="Board"
        style={{ width: WIDTH, height: HEIGHT,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`}}
        onClick={this.handleEnemyBoard}
        ref={(n) => { this.boardRef = n; }}>
        {firedCells.map(cell => (
            <Cell x={cell.x} y={cell.y}
                key={`${cell.x},${cell.y}`}/>
        ))}
        {/* {hitCells.map(cell => (
            <Cell x={cell.x} y={cell.y}
                key={`${cell.x},${cell.y}`}/>
        ))
        }
        {missedCells.map(cell => (
            <Cell x={cell.x} y={cell.y}
                key={`${cell.x},${cell.y}`}/>
        ))
        } */}
        </div>
      
    </div>
    </div>
        
    </Col>
    
</Row>
  }
}

export default GameOnView;