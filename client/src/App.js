import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import ReadString from "./ReadString";
import SetString from "./SetString";
import MainView from "./views/main";
import GameView from "./views/game";
import { Route, Switch, Redirect } from 'react-router-dom'
import { connect } from "react-redux"
import Web3 from "web3"


const NewGameView = () => <div>New Game View</div>


const LoadingView = () => <div>Loading View</div>
const MessageView = props => <div>{props.message || ""}</div>

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
        loading: true,
        loadingWeb3: true,
        drizzleState: null,
        unsupported: false,
        connected: false,
        network: null,
        accounts: []
    }
}

  
  componentDidMount() {
    
     if (window.web3 && window.web3.currentProvider) {
        let web3 = new Web3(window.web3.currentProvider)
  
       web3.eth.net.getNetworkType().then(id => {
        this.props.dispatch({ type: "SET_NETWORK_ID", networkId: id })
  
           return web3.eth.getAccounts()
       })
       .then(accounts => {
            
           this.props.dispatch({ type: "SET", accounts });
          this.props.dispatch({ type: "SET_CONNECTED" });
           
       })
  
   }
    else {
      this.props.dispatch({ type: "SET_UNSUPPORTED" })
   }


  const { drizzle } = this.props;

  // subscribe to changes in the store
  this.unsubscribe = drizzle.store.subscribe(() => {

    // every time the store updates, grab the state from drizzle
    const drizzleState = drizzle.store.getState();

    // check to see if it's ready, if so, update local component state
    if (drizzleState.drizzleStatus.initialized) {
      this.setState({ loading: false, drizzleState });
    }

  });
  
}
componentWillUnmount() {
  this.unsubscribe();
}
   render() {
    if (this.state.loading) return "Loading Drizzle...";
    else if (this.props.status.loading) return <LoadingView />
    else if (this.props.status.unsupported) return <MessageView message="Please, install Metamask for Chrome or Firefox" />
    else if (this.props.status.networkId != "private") return <MessageView message="Please, switch to the Ropsten network" />
    else if (!this.props.status.connected) return <MessageView message="Your connection seems to be down" />
    else if (!this.props.accounts || !this.props.accounts.length) return <MessageView message="Please, unlock your wallet or create an account" />
   
    return <div>
    <Switch>
        <Route  path="/" exact render={props => <MainView drizzle = {this.props.drizzle} drizzleState = {this.state.drizzleState} {...props}/>}/>
        <Route path="/games/:id" exact render={props => <GameView drizzle = {this.props.drizzle} drizzleState = {this.state.drizzleState} {...props}/>} />
        <Redirect to="/" />
    </Switch>
    {/* <ReadString
          drizzle={this.props.drizzle}
          drizzleState={this.state.drizzleState}

        />
       

        
        <SetString
          drizzle={this.props.drizzle}
          drizzleState={this.state.drizzleState}
        /> */}
          </div>
    //return (
      // <div className="App">
        // <ReadString
        //   drizzle={this.props.drizzle}
        //   drizzleState={this.state.drizzleState}

        // />
       

        
        // <SetString
        //   drizzle={this.props.drizzle}
        //   drizzleState={this.state.drizzleState}
        // />
      // </div>
      
    //);
  }
}

export default connect(({ accounts, status }) => ({ accounts, status }))(App)
