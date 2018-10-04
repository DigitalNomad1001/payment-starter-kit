import React, { Component } from "react";
import getWeb3 from "./utils/getWeb3";
import { Button, FormControl, TextField } from '@material-ui/core';
// ***Import the Connext Package here***

import "./App.css";

class App extends Component {
  state = { 
    web3: null, 
    accounts: null, 
    contract: null,
    balance: 1 
  };

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
    if (this.state.balance == 0) {
      return (
        <div className="App">
          <h1 className="title">Connext Demo Wallet</h1>
          <FormControl>
            <p className="title">Deposit some testnet Eth to get started!</p>
            <TextField
              id="eth-deposit"
              label="Deposit in Eth"
              variant="outlined"
              margin="dense"
            />
            <Button variant="contained" color="primary" style={{marginTop:'5%'}}> Submit </Button> 
          </FormControl>
        </div>
      );
    } else {
      return (
        <div className="App">
          <h1 className="title">Connext Demo Wallet</h1>
          <FormControl>
            <p className="title">Current Balance: {this.state.balance} Eth</p>
            <TextField
              id="address"
              label="Address"
              variant="outlined"
              margin="dense"
            />
            <TextField
              id="eth-payment"
              label="Amount in Eth"
              variant="outlined"
              margin="dense"
            />
            <Button variant="contained" color="primary" style={{marginTop:'5%'}}> Pay </Button>
            <Button className="title" variant="contained" color="secondary" style={{margin:'10%', marginTop:'10%'}}> Withdraw </Button> 
          </FormControl>
        </div>
      );
    }
  }
}

export default App;
