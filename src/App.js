import React, { Component } from "react";
import getWeb3 from "./utils/getWeb3";
import {
  Button,
  FormControl,
  TextField,
  CircularProgress
} from "@material-ui/core";
import "./App.css";
const Web3 = require("web3");
const interval = require("interval-promise");
// *** Import the Connext Package ***
const Connext = require("connext");

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    contract: null,
    error: null,
    channel: {},
    channelId: null,
    deposit: 0,
    targetAccount: "0x0",
    payment: 0,
    isWaiting: false,
    connext: null
  };

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      console.log(
        `instantiating connext with hub as 0x627306090abab3a6e1400e9345bc60c78a8bef57..`
      );

      // *** Instantiate the connext client ***
      const connext = new Connext({
        web3,
        hubAddress: "0x627306090abab3a6e1400e9345bc60c78a8bef57",
        hubUrl: "http://localhost:3000",
        contractAddress: "0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF"
      });

      // *** Set web3, accounts and connext instance to state ***
      this.setState({ web3, accounts, connext });
      this.poller();
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or connext. Check console for details.`
      );
      console.log(error);
    }
  };

  poller = async () => {
    let updatedChannel;
    const { connext, channel, accounts, channelId } = this.state;

    // *** Poll getChannel on a fixed interval
    await interval(async (iterationNumber, stop) => {
      if (channelId) {
        console.log(
          `Searching for channel updates for address ${accounts[0]}..`
        );
        updatedChannel = await connext.getChannelByPartyA(accounts[0]);
        if (
          channel &&
          updatedChannel &&
          JSON.stringify(updatedChannel) !== JSON.stringify(channel)
        ) {
          console.log(`Channel updates found.`);
          stop();
        }
      }
    }, 1000);

    console.log(`Found updatedChannel: ${JSON.stringify(updatedChannel)}`);

    // *** Save channel to state
    this.setState({
      channel: updatedChannel,
      channelId: updatedChannel.channelId
    });

    // *** If channel state is opened, doJoin
  };

  doDeposit = async () => {
    try {
      const { accounts, deposit, channel, connext } = this.state;
      this.setState({ isWaiting: true });

      const weiDeposit = Web3.utils.toBN(
        Web3.utils.toWei(deposit.toString(), "ether")
      );

      // *** Call openChannel on connext client with deposit ***
      const challenge = 3600;

      console.log(`Creating channel with weiDeposit: ${weiDeposit.toString()}`);

      let channelId = await connext.openChannel({
        initialDeposits: { weiDeposit },
        challenge,
        sender: accounts[0]
      });

      console.log(`Opened channel with hub: ${channelId}`);
      this.setState({ channelId });
      // let updatedChannel = {
      //   status: channel.status,
      //   balance: channel.balance,
      //   channelId
      // };

      // this.setState({ channel: updatedChannel });
    } catch (error) {
      alert(`Deposit failed. Check console for details.`);
      console.log(error);
    }
  };

  doJoin = async () => {
    try {
      const { accounts, deposit } = this.state;

      // *** Call join on client to request that the hub joins with a deposit ***

      this.setState({ isWaiting: false });
    } catch (error) {
      alert(`Join failed. Check console for details.`);
      console.log(error);
    }
  };

  doPayment = async () => {
    try {
      const { accounts, payment } = this.state;

      // *** Call openThread on client with account address ***

      // *** updateBalance on client with payment amount ***

      // *** closeThread on client
    } catch (error) {
      alert(`Payment failed. Check console for details.`);
      console.log(error);
    }
  };

  doWithdraw = async () => {
    try {
      const { accounts, channel } = this.state;
      this.setState({ isWaiting: true });

      // *** Call closeChannel on connext client ***

      this.setState({ isWaiting: false });
    } catch (error) {
      alert(`Withdrawing failed. Check console for details.`);
      console.log(error);
    }
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    if (this.state.channel.status != "JOINED") {
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
              onChange={e => {
                this.setState({ deposit: e.target.value });
              }}
            />
            <Button
              variant="contained"
              color="primary"
              style={{ marginTop: "5%" }}
              onClick={this.doDeposit}
              disabled={this.state.isWaiting}
            >
              {" "}
              Deposit{" "}
            </Button>
            {this.state.isWaiting && (
              <CircularProgress
                style={{ marginTop: "5%", marginLeft: "42%" }}
              />
            )}
          </FormControl>
        </div>
      );
    } else {
      return (
        <div className="App">
          <h1 className="title">Connext Demo Wallet</h1>
          <FormControl>
            <p className="title">
              Current Balance: {this.state.channel.balance} ETH
            </p>
            <TextField
              id="address"
              label="Address"
              variant="outlined"
              margin="dense"
              value={this.state.targetAccount}
              onChange={e => {
                this.setState({ targetAccount: e.target.value });
              }}
            />
            <TextField
              id="eth-payment"
              label="Amount in Eth"
              variant="outlined"
              margin="dense"
              value={this.state.payment}
              onChange={e => {
                this.setState({ payment: e.target.value });
              }}
            />
            <Button
              variant="contained"
              color="primary"
              style={{ marginTop: "5%" }}
              onClick={this.doPayment}
            >
              {" "}
              Pay{" "}
            </Button>
            <Button
              className="title"
              variant="contained"
              color="secondary"
              style={{ margin: "10%", marginTop: "10%" }}
              onClick={this.doWithdraw}
              disabled={this.state.isWaiting}
            >
              {" "}
              Withdraw{" "}
            </Button>
            {this.state.isWaiting && (
              <CircularProgress style={{ marginTop: "5%" }} />
            )}
          </FormControl>
        </div>
      );
    }
  }
}

export default App;
