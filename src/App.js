import React, { Component } from "react";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "truffle-contract";
// ***Import the Connext Package here***

import "./App.css";

class App extends Component {
  state = { storageValue: 0, web3: null, accounts: null, contract: null };

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      // ***Instantiate the Connext Package here***

      // ***Set web3, accounts and connext instance to state***
      this.setState({ web3, accounts /*,connext,*/ });
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or connext. Check console for details.`
      );
      console.log(error);
    }
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1 className="title">Payment-Starter-Kit</h1>
        <p>A simple way to test your Connext integration!</p>
        <h2 className="title">Smart Contract Example</h2>
        <p>
          If your contracts compiled and migrated successfully, below will show
          a stored value of 5 (by default).
        </p>
        <p>
          Try changing the value stored on <strong>line 37</strong> of App.js.
        </p>
        <div>The stored value is: {this.state.storageValue}</div>
      </div>
    );
  }
}

export default App;
