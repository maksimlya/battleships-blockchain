import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
// import drizzle functions and contract artifact
import { Provider } from 'react-redux'  // Add this line
import { Drizzle, generateStore } from "drizzle";
import Battleships from "./contracts/Battleships.json";
import { HashRouter } from "react-router-dom"
import store from "./store"  // Add this line

// let drizzle know what contracts we want
const options = { contracts: [Battleships],
	web3: {
    fallback: {
      type: "ws",
      url: "ws://192.168.2.104:8545",
    },
  },

 };

// setup the drizzle store and drizzle
const drizzleStore = generateStore(options);
const drizzle = new Drizzle(options, drizzleStore);

const Root = () => <Provider store={store}> 
<HashRouter>
    <App drizzle = {drizzle}/>
</HashRouter>
</Provider>

ReactDOM.render(<Root/>, document.getElementById("root"))


//ReactDOM.render(<App drizzle = {drizzle}/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
