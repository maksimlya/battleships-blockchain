// web/src/views/main.js

import React, { Component } from "react"
import { connect } from "react-redux"
import Media from "react-media"
import { Row, Col, Divider, Button, Input, InputNumber, Spin, Icon, message, notification } from "antd"
import ConfirmAcceptModal from "../widgets/confirm-accept-modal"
import 'antd/dist/antd.css';
import Web3 from 'web3';



class MainView extends Component {
    constructor(props) {
        super(props)
        this.acceptForm = null

        this.state = {
            showCreateGame: false,
            creationLoading: false,
            acceptLoading: false,
            showAcceptModal: false,
            gameIdxToAccept: -1,
            stackId: null,
            openGames: [],


            approvedGameIdx: 0,
            pendingGameIdx: 0
        }
    }


    handleValue(ev) {
        if (!ev.target || !ev.target.name) return
        this.setState({ [ev.target.name]: ev.target.value })
    }

    componentDidMount(){

        this.fetchOpenGames();

        const web3 = new Web3('ws://milky.ddns.net:8545');
        const { drizzle, drizzleState } = this.props;
        const battleships = drizzle.contracts.Battleships;

        const battleshipsWeb3 = new web3.eth.Contract(battleships.abi, battleships.address);
       

        this.worker = setInterval(this.fetchNewGame, 1500);
    

         this.createdGameEvent = battleshipsWeb3.events.GameCreated().on('data', event =>{
             this.setState({pendingGameIdx: event.returnValues.gameIdx});
     });
   
    }

    componentWillUnmount() {
      
      
        clearInterval(this.worker);
     
     
    }
 

     fetchNewGame = () => {
        if(this.state.pendingGameIdx > this.state.approvedGameIdx){
            console.log('trying to fetch game n ' + this.state.pendingGameIdx +', current approved game n ' + this.state.approvedGameIdx);
            const { drizzle, drizzleState } = this.props;
            const battleships = drizzle.contracts.Battleships;
            let games = this.state.openGames;
    
            battleships.methods.getGameInfo(this.state.pendingGameIdx).call({from: drizzleState.accounts[0]}).then(result => {
                if(result.nick1.length > 1){
                    games.push(result);
                    this.setState({approvedGameIdx: result.gameIndex});
                    console.log('successfully fetched game n ' + this.state.approvedGameIdx);
                    }
                
            })
        }
       
        
        //const battleshipsWeb3 = new web3.eth.Contract(battleships.abi, battleships.address);

            
            // let newGame  = await battleshipsWeb3.methods.getGameInfo(id).call({from: drizzleState.accounts[0]});
          //  setTimeout(this.myFunc, 2500, id);
            //console.log(newGame);
           

            }

        
           
           
              
              
             
            
    


     fetchOpenGames = async() => {
        const { drizzle, drizzleState } = this.props;
        const contract = drizzle.contracts.Battleships;
        let openGames = []
        let tmpIdx = 0;
        
            let openGamesIdx = await contract.methods.getOpenGames().call();
            if(openGamesIdx)
            for(let i of openGamesIdx){
                tmpIdx=i;
                openGames.push(await contract.methods.getGameInfo(i).call());
            }
                           this.setState({openGames,
                                    approvedGameIdx: tmpIdx
                        });        
    }

    showAcceptGameModal(idx) {
        if (!this.acceptForm) return

        this.setState({ showAcceptModal: true, gameIdxToAccept: idx })
    }

    hideAcceptGameModal() {
        this.setState({ showAcceptModal: false })
    }

    saveAcceptFormRef(ref) {
        this.acceptForm = ref
    }

    async createGame()  {

        const { drizzle, drizzleState } = this.props;
        const contract = drizzle.contracts.Battleships;
       
        if (!this.state.nick) return message.error("Please, choose a nick")
        else if (this.state.nick.length < 2) return message.error("Please, choose a longer nick")
        else if (typeof this.state.number == "undefined") return message.error("Please, choose a random number")
        else if (!this.state.salt) return message.error("Please, type a random string")
        else{
        
            let number = this.state.number % 256
            let saltedHash =  await contract.methods.saltedHash(number,this.state.salt).call();
            
            let web3 = this.props.drizzle.web3;
            let value = 0
            if (this.state.value) {
                value = web3.utils.toWei(String(this.state.value), "ether")
             
                    }
                   
                    this.setState({ creationLoading: true });
                    
                    let tx = await contract.methods.createGame(saltedHash,this.state.nick).send({value,from: drizzleState.accounts[0]})

                    let test = await contract.methods.getGameInfo(tx.events.GameCreated.returnValues.gameIdx).call();

                    console.log(test);
                  
                     this.setState({ creationLoading: false })
                        if (!tx.events.GameCreated || !tx.events.GameCreated.returnValues) {
                            throw new Error("The transaction failed")
                        }
                        
                        this.props.dispatch({
                            type: "ADD_CREATED_GAME",
                            id: tx.events.GameCreated.returnValues.gameIdx,
                            number,
                            salt: this.state.salt
                        })
        
                        this.props.history.push(`/games/${tx.events.GameCreated.returnValues.gameIdx}`)
        
                        notification.success({
                            message: 'Game created',
                            description: 'Your game has been created. Waiting for another user to accept it.',
                        })
                   
       
    }
      
        
     
            
       
           
          
      
        
        


  


       
       
    }

    async acceptGame() {
        const { drizzle, drizzleState } = this.props;
        const game = this.state.openGames[this.state.gameIdxToAccept]
   

         await this.acceptForm.validateFields((err, values) => {
             (async() => {
             if (err) return

             if (!values.nick) return message.error("Please, choose a nick")
             else if (values.nick.length < 2) return message.error("Please, choose a longer nick")
             else if (typeof values.number == "undefined") return message.error("Please, choose a random number")

             values.number = values.number % 256

             const contract = drizzle.contracts.Battleships;

             this.setState({ acceptLoading: true, showAcceptModal: false })

            // TRANSACTION
            
             let tx = await contract.methods.acceptGame(game.gameIndex, values.number, values.nick).send({ value: game.amount || 0, from: drizzleState.accounts[0] })
                
                    this.setState({ acceptLoading: false })
                    console.log(tx);
                    if (!tx.events.GameAccepted || !tx.events.GameAccepted.returnValues) {
                        throw new Error("The transaction failed")
                    }
                    this.props.history.push(`/games/${game.gameIndex}`)

                    notification.success({
                        message: 'Game accepted',
                        description: 'You have accepted the game. Waiting for creator to confirm.',
                    })
               

         })();
        });
    }

    


    renderNewGame() {
        return <div className="card">
            <h1 className="light">New Game</h1>
            <p className="light">Enter your nick name, type a random number and some text.</p>

            <Divider />

            <Row gutter={16}>
                <Col>
                    <Input className="margin-bottom" placeholder="Nick name" name="nick" onChange={ev => this.handleValue(ev)} />
                </Col>
                <Col span={12}>
                    <InputNumber className="width-100" min={0} placeholder="Random number" name="number" onChange={value => this.setState({ number: value })} />
                </Col>
                <Col span={12}>
                    <Input placeholder="Type some text" name="salt" onChange={ev => this.handleValue(ev)} />
                </Col>
                <Col>
                    <p className="light"><small>This will be used to randomly decide who starts the game</small></p>
                </Col>
                <Col>
                    <br />
                    <p className="light">Do you want to bet some ether?</p>
                </Col>
                <Col>
                    <InputNumber className="margin-bottom width-100" placeholder="0.00 (optional)" name="value" onChange={value => this.setState({ value })} />
                </Col>
                <Col>
                    <Media query="(max-width: 767px)" render={() => (
                        <Button type="primary" className="margin-bottom width-100"
                            onClick={() => this.setState({ showCreateGame: !this.state.showCreateGame })}>Cancel</Button>
                    )} />

                    {
                        this.state.creationLoading ?
                            <div className="text-center">Please, wait  <Spin indicator={<Icon type="loading" style={{ fontSize: 14 }} spin />} /> </div> :
                            <Button type="primary" id="start" className="width-100" onClick={() => this.createGame()}>Start new game</Button>
                    }
                </Col>
            </Row>
        </div>
    }

    renderOpenGameRow(game, idx) {
        const { drizzle, drizzleState } = this.props;
       
         let web3 = drizzle.web3;
        
        return <Row key={idx} type="flex" justify="space-around" align="middle" className="open-game-row">
            <Col xs={2} sm={3}>
                <img src={idx % 2 ? require("../media/cross.png") : require("../media/circle.png")} />
            </Col>
            <Col xs={12} sm={15} style={{ marginTop: 0, fontSize: 16 }} className="open-game-row-text">
                {game.nick1} {game.amount && game.amount != "0" ? <small>({web3.utils.fromWei(game.amount)} Ξ)</small> : null}
            </Col>
            <Col xs={9} sm={6} className="open-game-row-accept">
                <Button type="primary" className="width-100" onClick={() => this.showAcceptGameModal(idx)}>Accept</Button>
            </Col>
        </Row>
    }

    renderListContent(openGames) {
        const { drizzle, drizzleState } = this.props;
        if (!openGames || !openGames.length) return <p className="light">There are no open games at the moment. You can create one!</p>
        else return openGames.map((game, idx) => this.renderOpenGameRow(game, idx))
       
    }


    renderGameList() {
        const { drizzle, drizzleState } = this.props;
        return <div className="card">
            <h1 className="light">Battleships</h1>
            <p className="light">Battleships is an Ethereum distributed app. Select a game to join or create a new one.</p>

            <Divider />

            {
                this.state.acceptLoading ?
                    <div className="text-center" style={{ margin: 50 }}>Please, wait  <Spin indicator={<Icon type="loading" style={{ fontSize: 14 }} spin />} /> </div> :
                    <div id="list">
                        {this.renderListContent(this.state.openGames)}
                    </div>
            }


            <Media query="(max-width: 767px)" render={() => [
                <Divider key="0" />,
                <Button type="primary" className="width-100" key="1"
                    onClick={() => this.setState({ showCreateGame: !this.state.showCreateGame })}>Start a new  game</Button>
            ]} />
        </div>
    }


    renderMobile() {
        return <Row>
            <Col md={24} style={{ color: "white" }}>
                <pre>{JSON.stringify(this.props.openGames[0], null, 2)}</pre>
            </Col>
        </Row>
    }

    renderDesktop() {
        return <Row gutter={48}>
            <Col md={12}>
                {this.renderGameList()}
            </Col>
            <Col md={12}>
                {this.renderNewGame()}
            </Col>
        </Row>
    }

    render() {
        return <div id="main">
           
            <Media query="(max-width: 767px)">
                {
                    matches => matches ? this.renderMobile() : this.renderDesktop()
                }
            </Media>
            <ConfirmAcceptModal
                visible={this.state.showAcceptModal}
                ref={ref => this.saveAcceptFormRef(ref)}
                onCancel={() => this.hideAcceptGameModal()}
                onAccept={() => this.acceptGame()}
            />
        </div>
    }
}

export default connect(({ openGames }) => ({ openGames }))(MainView) 
