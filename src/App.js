import React, { Component } from "react";
import getWeb3 from "./utils/getWeb3";
import {
  Button,
  FormControl,
  TextField,
  CircularProgress,
  InputLabel,
  Select,
  MenuItem
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
    connext: null,
    targetAddresses: []
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
      this.populateAddresses();
      this.poller();
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or connext. Check console for details.`
      );
      console.log(error);
    }
  };

  populateAddresses = async () => {
    const { connext, accounts } = this.state;
    try {
      const allChannels = await connext.getAllChannels();
      const targetAddresses = allChannels
        .filter(channel => {
          return (
            channel.partyI.toLowerCase() === connext.hubAddress.toLowerCase() &&
            channel.partyA.toLowerCase() !== accounts[0].toLowerCase()
          );
        })
        .map(channel => channel.partyA);
      console.log("targetAddresses: ", targetAddresses);
      this.setState({ targetAddresses });
    } catch (e) {
      console.error(`Problem getting channels: ${e.toString()}`);
    }
  };

  getMyChannel = async () => {
    const { connext, accounts } = this.state;
    const myChannel = await connext.getChannelByPartyA(accounts[0]);
    if (myChannel) {
      this.setState({
        channel: myChannel,
        channelId: myChannel.channelId
      });
    }
    return myChannel;
  };

  closeOpenThreads = async () => {
    const { channelId, connext } = this.state;
    if (!channelId) {
      return;
    }

    const threads = await connext.getThreadsByChannelId(channelId);

    try {
      if (threads.length !== 0) {
        console.log(`Found lingering open thread, closing`);
        const threads = await connext.getThreadsByChannelId(channelId);
        const threadIds = threads.map(t => {
          return t.threadId;
        });
        await connext.closeThreads(threadIds);
      }
    } catch (e) {
      alert(`Closing thread failed. Check console for details.`);
      console.log(e);
    }
  };

  poller = async () => {
    let updatedChannel = {};
    const { isWaiting } = this.state;

    // *** Poll getChannel on a fixed interval
    await interval(async (iterationNumber, stop) => {
      const myChannel = await this.getMyChannel();
      if (!myChannel) {
        return;
      }
      console.log("myChannel: ", myChannel);
      if (myChannel.status === "OPENED" && !isWaiting) {
        console.log(`Saw open channel, attempting to join...`);
        try {
          // *** If channel state is opened, doJoin
          await this.doJoin();
        } catch (e) {
          console.error(`Error joining channel: ${e.toString()}`);
        }
        this.setState({ isWaiting: false });
        return;
      }
      if (myChannel.status === "JOINED" && isWaiting) {
        this.setState({ isWaiting: false });
        return;
      }
      if (myChannel.status === "JOINED" && !isWaiting) {
        console.log(`Channel is joined and ready for deposits.`);
        if (JSON.stringify(myChannel) !== JSON.stringify(updatedChannel)) {
          console.log(`Channel updates detected, stopping polling.`);
          updatedChannel = myChannel;
          // *** If there are threads, close them
          await this.closeOpenThreads();
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
  };

  doDeposit = async () => {
    // *** Call openChannel on connext client with deposit ***
    try {
      const { accounts, deposit, connext } = this.state;
      this.setState({ isWaiting: true });

      const weiDeposit = Web3.utils.toBN(
        Web3.utils.toWei(deposit.toString(), "ether")
      );

      const challenge = 3600;

      console.log(`Creating channel with weiDeposit: ${weiDeposit.toString()}`);

      let channelId = await connext.openChannel({
        initialDeposits: { weiDeposit },
        challenge,
        sender: accounts[0]
      });

      console.log(`Opened channel with hub: ${channelId}`);
      this.setState({ channelId, deposit });
    } catch (error) {
      alert(`Deposit failed. Check console for details.`);
      console.log(error);
    }
  };

  doJoin = async channelId => {
    // *** Call join on client to request that the hub joins with a deposit ***
    this.setState({ isWaiting: true });
    try {
      const { channelId, deposit, connext } = this.state;

      // *** Call join on client to request that the hub joins with a deposit ***
      const weiDeposit = Web3.utils.toBN(
        Web3.utils.toWei(deposit.toString(), "ether")
      );
      console.log(
        `Requesting hub join channel ${channelId} with ${weiDeposit.toString()} wei deposit`
      );
      await connext.requestJoinChannel({
        hubDeposit: {
          weiDeposit
        },
        channelId
      });
    } catch (error) {
      alert(`Join failed. Check console for details.`);
      console.log(error);
    }
    this.setState({ isWaiting: false });
  };

  doPayment = async () => {
    try {
      this.setState({ isWaiting: true });
      const { accounts, payment, connext, targetAccount, channel } = this.state;

      const weiPayment = Web3.utils.toBN(
        Web3.utils.toWei(payment.toString(), "ether")
      );

      if (targetAccount.toLowerCase() === connext.hubAddress.toLowerCase()) {
        // channel update intended
        console.log(`Creating channel payment details..`);
        const updateWeiBalanceA = Web3.utils
          .toBN(`0x${channel.weiBalanceA}`)
          .sub(weiPayment);

        const updateWeiBalanceB = Web3.utils
          .toBN(`0x${channel.weiBalanceI}`)
          .add(weiPayment);

        await connext.updateChannel({
          channelId: channel.channelId,
          balanceA: { weiDeposit: updateWeiBalanceA },
          balanceB: { weiDeposit: updateWeiBalanceB }
        });
      } else {
        // thread update intended
        let ourThread = await connext.getThreadByParties({
          partyA: accounts[0].toLowerCase(),
          partyB: targetAccount.toLowerCase()
        });

        if (!ourThread) {
          // try creating a thread
          const threadId = await connext.openThread({
            to: targetAccount.toLowerCase(),
            sender: accounts[0].toLowerCase(),
            deposit: { weiDeposit: weiPayment }
          });
          ourThread = await connext.getThreadById(threadId);
        }

        console.log("ourThread: ", ourThread);
        const updateWeiBalanceA = Web3.utils
          .toBN(`0x${ourThread.weiBalanceA}`)
          .sub(weiPayment);

        const updateWeiBalanceB = Web3.utils
          .toBN(`0x${ourThread.weiBalanceB}`)
          .add(weiPayment);

        await connext.updateThread({
          threadId: ourThread.threadId,
          balanceA: { weiDeposit: updateWeiBalanceA },
          balanceB: { weiDeposit: updateWeiBalanceB }
        });

        await connext.closeThread(ourThread.threadId);
      }
      this.setState({ isWaiting: false });
    } catch (error) {
      alert(`Payment failed. Check console for details.`);
      console.log(error);
    }
    this.setState({ isWaiting: false });
  };

  doWithdraw = async () => {
    try {
      this.setState({ isWaiting: true });
      const { connext, channelId } = this.state;

      // *** Call closeChannel on connext client ***
      console.log(`Closing channel with hub..`);
      const latestState = await connext.getLatestChannelState(channelId);
      console.log("latestState", latestState);
      await connext.closeChannel();
      console.log(`Closed.`);
    } catch (error) {
      alert(`Withdrawing failed. Check console for details.`);
      console.log(error);
    }
    this.setState({ isWaiting: false });
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
              value={this.state.deposit | 0}
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
              Current Balance:{" "}
              {Web3.utils.fromWei(
                Web3.utils.toBN(`0x${this.state.channel.weiBalanceA}`)
              )}{" "}
              ETH
            </p>
            <Select
              value={this.state.targetAccount}
              onChange={event => {
                this.setState({ targetAccount: event.target.value });
              }}
              inputProps={{
                name: "target-accounts",
                id: "target-accounts"
              }}
            >
              <MenuItem value="">
                <em>Select a Target Address</em>
              </MenuItem>
              {this.state.targetAddresses.map((address, index) => (
                <MenuItem value={address} key={index}>
                  {address}
                </MenuItem>
              ))}
            </Select>
            <TextField
              id="eth-payment"
              label="Amount in Eth"
              variant="outlined"
              margin="dense"
              value={this.state.payment | 0}
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
