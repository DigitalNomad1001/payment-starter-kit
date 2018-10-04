import React, { Component } from "react";
import getWeb3 from "./utils/getWeb3";
import { Button, FormControl, TextField, CircularProgress } from '@material-ui/core';
// *** Import the Connext Package ***

import "./App.css";

class App extends Component {
  state = { 
    web3: null, 
    accounts: null, 
    contract: null,
    error: null,
    channel: {
      status: '',
      balance: 0
    },
    deposit: 0,
    targetAccount: '0x0',
    payment: 0,
    isWaiting: false
  };

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      // *** Instantiate the connext client ***

      // *** Set web3, accounts and connext instance to state ***
      this.setState({ web3, accounts });
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or connext. Check console for details.`
      );
      console.log(error);
    }
  };

  poller = async () => {
    const { accounts } = this.state;

    // *** Poll getChannel on a fixed interval

    // *** Save channel to state

    // *** If channel state is opened, doJoin

  }

  doDeposit = async () => {
    try {
      const { accounts, deposit } = this.state;
      this.setState({isWaiting: true});

      // *** Call openChannel on connext client with deposit ***

    } catch (error) {
      alert (
        `Deposit failed. Check console for details.`
      );
      console.log(error)
    }
  }

  doJoin = async () => {
    try {
      const { accounts, deposit } = this.state;

      // *** Call join on client to request that the hub joins with a deposit ***

      this.setState({isWaiting: false});
    } catch (error) {
      alert (
        `Join failed. Check console for details.`
      );
      console.log(error)
    }
  }

  doPayment = async () => {
    try {
      const { accounts, payment } = this.state;

      // *** Call openThread on client with account address ***

      // *** updateBalance on client with payment amount ***

      // *** closeThread on client

    } catch (error) {
      alert (
        `Payment failed. Check console for details.`
      );
      console.log(error)
    }
  }

  doWithdraw = async () => {
    try {
      const { accounts } = this.state;
      this.setState({isWaiting: true})

      // *** Call closeChannel on connext client ***

      this.setState({isWaiting: false})
    } catch (error) {
      alert (
        `Withdrawing failed. Check console for details.`
      );
      console.log(error)
    }
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    if (this.state.channel.status != 'JOINED') {
      return (
        <div className="App">
          <h1 className="title">Connext Demo Wallet</h1>
          <FormControl>
            <p className="title">Deposit some testnet Eth to get started!</p>
            <TextField
              id="eth-deposit"
              label="Amount in Eth"
              variant="outlined"
              margin="dense"
              value={this.state.deposit}
              onChange={(e) => {this.setState({deposit: e.target.value})}}
            />
            <Button variant="contained" color="primary" style={{marginTop:'5%'}} onClick={this.doDeposit} disabled={this.state.isWaiting}> Deposit </Button>
            {this.state.isWaiting && <CircularProgress style={{marginTop:'5%'}}/>} 
          </FormControl>
        </div>
      );
    } else {
      return (
        <div className="App">
          <h1 className="title">Connext Demo Wallet</h1>
          <FormControl>
            <p className="title">Current Balance: {this.state.channel.balance} ETH</p>
            <TextField
              id="address"
              label="Address"
              variant="outlined"
              margin="dense"
              value={this.state.targetAccount}
              onChange={(e) => {this.setState({targetAccount: e.target.value})}}
            />
            <TextField
              id="eth-payment"
              label="Amount in Eth"
              variant="outlined"
              margin="dense"
              value={this.state.payment}
              onChange={(e) => {this.setState({payment: e.target.value})}}
            />
            <Button variant="contained" color="primary" style={{marginTop:'5%'}} onClick={this.doPayment}> Pay </Button>
            <Button className="title" variant="contained" color="secondary" style={{margin:'10%', marginTop:'10%'}} onClick={this.doWithdraw} disabled={this.state.isWaiting}> Withdraw </Button>
            {this.state.isWaiting && <CircularProgress style={{marginTop:'5%'}}/>}  
          </FormControl>
        </div>
      );
    }
  }
}

export default App;
