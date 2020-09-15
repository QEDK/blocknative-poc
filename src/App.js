import React, { useEffect, useState } from "react";
import Web3 from "web3";
import Navbar from "./Navbar";
import WalletConnectProvider from "@maticnetwork/walletconnect-provider";
const config = require('./config')
const MaticPoSClient = require("@maticnetwork/maticjs").MaticPOSClient;
const Network = require("@maticnetwork/meta/network");
const Matic = require("@maticnetwork/maticjs");

const App = () => {
  useEffect(() => {
    loadWeb3();
    loadBlockchainData();
  }, []);
  let content;
  const [Networkid, setNetworkid] = useState(0);
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
	const [burnHash, setBurnHash] = useState("");
  const [maticProvider, setMaticProvider] = useState();
  const [goerliprovider, setGoerliProvider] = useState();
  const [bridgeOptions] =  useState([
    {
      label:"Proof of Stake",
      value:"Proof of Stake"
    },
    {
      label:"Plasma",
      value:"Plasma"
    }
  ]);
  const [tokenTypes] = useState([
    {
      label:"Ether",
      value:"Ether"
    },
    {
      label:"ERC20",
      value:"ERC20"
    }
  ]);
  const [selectedBridgeOption,setSelectedBridgeOption] = useState({
    label:"Proof of Stake"
  });
  const [selectedToken, setSelectedToken] = useState({
    label:"Ether"
  });

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  };


  const loadBlockchainData = async () => {
    setLoading(true);
    const maticProvider = new WalletConnectProvider({
      host: `https://rpc-mumbai.matic.today`,
      callbacks: {
        onConnect: console.log("matic connected"),
        onDisconnect: console.log("matic disconnected!"),
      },
    });

    const goerliProvider = new WalletConnectProvider({
      host: `https://goerli.infura.io/v3/541999c8adbc4c3594d03a6b7b71eda6`,
      callbacks: {
        onConnect: console.log("goeril connected"),
        onDisconnect: console.log("goeril disconnected"),
      },
    });

    setMaticProvider(maticProvider);
    setGoerliProvider(goerliProvider);
    const web3 = window.web3;

    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);
    const networkId = await web3.eth.net.getId();

    setNetworkid(networkId);

    if (networkId === 5) {
      setLoading(false);
    } else if (networkId === 80001) {

      setLoading(false);
    } else {
      window.alert(" switch to  Matic or Ethereum network");
    }
  };
  // posClientGeneral facilitates the operations like approve, deposit, exit  
  const posClientParent = () => {
    const maticPoSClient = new MaticPoSClient({
      network: "testnet",
      version: "mumbai",
      maticProvider: maticProvider,
      parentProvider: window.web3,
      parentDefaultOptions: { from: account },
      maticDefaultOptions: { from: account },
    });
    return maticPoSClient;
  };
  // posclientBurn facilitates the burning of tokens on the matic chain
  const posClientChild = () => {
    const maticPoSClient = new MaticPoSClient({
      network: "testnet",
      version: "mumbai",
      maticProvider: window.web3,
      parentProvider: goerliprovider,
      parentDefaultOptions: { from: account },
      maticDefaultOptions: { from: account },
    });
    return maticPoSClient;
  };
// getMaticPlasmaClient facilitates the burning of tokens on the matic chain
  const getMaticPlasmaParent = async (_network = "testnet", _version = "mumbai") => {
    const network = new Network(_network, _version);
    const matic = new Matic({
    network: _network,
    version: _version,
    parentProvider: window.web3,
    maticProvider: maticProvider,
    parentDefaultOptions: { from:account },
    maticDefaultOptions: { from:account },


    });
    await matic.initialize();
    return { matic, network };
  };

    // getMaticPlasmaClientBurn facilitates the operations like approve, deposit,confirmWithdraw ,exit 
  const getMaticPlasmaChild = async (_network = "testnet", _version = "mumbai") => {
    const matic = new Matic({
    network: _network,
    version: _version,
    parentProvider: goerliprovider,
    maticProvider: window.web3,
    parentDefaultOptions: { from:account },
    maticDefaultOptions: { from:account },


    });
    await matic.initialize();
    return { matic };
  };

  const maticPlasma = new Matic({
    maticProvider: maticProvider,
    parentProvider: window.web3,
    rootChain: "0x2890bA17EfE978480615e330ecB65333b880928e",
    withdrawManager: "0x2923C8dD6Cdf6b2507ef91de74F1d5E0F11Eac53",
    depositManager: "0x7850ec290A2e2F40B82Ed962eaf30591bb5f5C96",
    registry: "0xeE11713Fe713b2BfF2942452517483654078154D",
  });
  const maticPlasmaBurn = new Matic({
    maticProvider: window.web3,
    parentProvider: window.web3,
    rootChain: "0x2890bA17EfE978480615e330ecB65333b880928e",
    withdrawManager: "0x2923C8dD6Cdf6b2507ef91de74F1d5E0F11Eac53",
    depositManager: "0x7850ec290A2e2F40B82Ed962eaf30591bb5f5C96",
    registry: "0xeE11713Fe713b2BfF2942452517483654078154D",
  })
  // POS ether functionality

  const depositEther = async () => {
    const maticPoSClient = posClientParent();
    const x = inputValue * 1000000000000000000; // 18 decimals
    const x1 = x.toString();

    await maticPoSClient.depositEtherForUser(account, x1, {
      from: account,
    });
  };

  const burnEther = async () => {
    const maticPoSClient = posClientChild();
    const x = inputValue * 1000000000000000000;
		const x1 = x.toString();
    await maticPoSClient.burnERC20(config.maticWETH, x1, {
      from: account,
    }).then((res) => {
			console.log(res.transactionHash);
			setBurnHash(res.transactionHash);
		})
  };

  const exitEther = async () => {
    const maticPoSClient = posClientParent();
    await maticPoSClient.exitERC20(inputValue, {
      from: account,
    }).then((res) => {
      console.log("exit o/p",res);
    })
  };

  // POS ERC20 functionality

  const depositERC20 = async () => {
    const maticPoSClient = posClientParent();
    const x = inputValue * 1000000000000000000; // 18 decimals
    const x1 = x.toString();
    await maticPoSClient.approveERC20ForDeposit(config.goerliDERC20address, x1, {
      from: account,
    });
    await maticPoSClient.depositERC20ForUser(config.goerliDERC20address,account, x1, {
      from: account,
    });
  };

  const burnERC20 = async () => {
    const maticPoSClient = posClientChild();
    const x = inputValue * 1000000000000000000;
		const x1 = x.toString();
    await maticPoSClient.burnERC20(config.maticDERC20address, x1, {
      from: account,
    }).then((res) => {
			setBurnHash(res.transactionHash);
		})
  };

  const exitERC20 = async () => {
    const maticPoSClient = posClientParent();
    await maticPoSClient.exitERC20(inputValue, {
      from: account,
      gas: "7000000"
    }).then((res) => {
      console.log("exit o/p",res);
    })
  };
  const onchange = (e) => {
    setInputValue(e.target.value);
  };


  // Plasma ether functionality
  const depositEtherPlasma = async () => {
    const { matic } = await getMaticPlasmaParent();
    const x = inputValue * 1000000000000000000; // 18 decimals
    const x1 = x.toString();
    await matic.depositEther(x1,{
      from: account
    }).catch(err => {
      console.log(err);

    })
  }


  const burnEtherPlasma = async () => {
    const { matic } = await getMaticPlasmaChild();
    const x = inputValue * 1000000000000000000; // 18 decimals
    const x1 = x.toString();
    await matic.startWithdraw(config.childMTXaddress, x1, {
      from:account
    }).then((res) => {
      console.log("burn ether plasma txn hash",res.transactionHash);
    })
  }

  const confirmWithdrawEtherPlasma = async () => {
    const { matic } = await getMaticPlasmaParent();
    await matic.withdraw(inputValue, { from:account, gas: "7000000" }).then((res) => {
      console.log("Confirm withdraw hash: ", res.transactionHash);
    });
  }

  const exitEtherPlasma = async () => {
    const { matic } = await getMaticPlasmaParent();
    await matic.processExits(config.mainMaticWETH, {from:account, gasPrice:"7000000"}).then((res)=> {
      console.log("process exit",res.transactionHash);
    })
  }

  // Plasma ERC20 functionality 
  const depositERC20Plasma = async () => {
    const { matic } = await getMaticPlasmaParent();
    const x = inputValue * 1000000000000000000; // 18 decimals
    const x1 = x.toString();
    await matic.approveERC20TokensForDeposit(config.mainTestToken, x1, {
      from:account,
      gasPrice: "10000000000",
    });
    return matic.depositERC20ForUser(config.mainTestToken, account, x1, {
      from:account,
      gasPrice: "10000000000",
    });
  }
  const burnERC20Plasma = async () => {
    const x = inputValue * 1000000000000000000; // 18 decimals
    const x1 = x.toString();
    maticPlasmaBurn.startWithdraw(config.MaticTestToken, x1, {
            from:account,
        }).then((res) => {
            console.log(res.transactionHash)
        })
  }

  const confirmWithdrawERC20Plasma = async () => {
    maticPlasma.withdraw(inputValue, {
      from:account,
    })
    .then((res) => {
      console.log(res.transactionHash);
    })
  }

  const exitERC20Plasma = async () => {
    const { matic } = await getMaticPlasmaParent();
    await matic.processExits(config.mainTestToken, { from:account, gas: "7000000" }).then((res) => {
      console.log("Exit hash: ", res.transactionHash);
    });
  }
  if (loading === true) {
  } else {
    content = (
      <div>
        <div id="POS" hidden={selectedBridgeOption.label === "Proof of Stake" ? false : true}>

          <div id="Ether" hidden={selectedToken.label === "Ether" && selectedBridgeOption.label === "Proof of Stake" ? false : true}>


            <button
              onClick={depositEther}
              disabled={Networkid !== 0 && Networkid === 80001 ? true : false}
            >
              Deposit
            </button>

            <button
              onClick={burnEther}
              disabled={Networkid !== 0 && Networkid === 5 ? true : false}
            >
              burn
            </button>

            <button
              onClick={exitEther}
              disabled={Networkid !== 0 && Networkid === 5 ? false : true}
            >
              exit
            </button>

            <br />
            <input
              id="inputValue"
              type="text"
              placeholder="value"
              name="inputValue"
              value={inputValue}
              onChange={onchange}
              required
            />
          </div>
          <div id="ERC20" hidden={selectedToken.label === "ERC20" && selectedBridgeOption.label === "Proof of Stake" ? false : true}>

            <button
              onClick={depositERC20}
              disabled={Networkid !== 0 && Networkid === 80001 ? true : false}
            >
              Deposit
            </button>

            <button
              onClick={burnERC20}
              disabled={Networkid !== 0 && Networkid === 5 ? true : false}
            >
              burn
            </button>

            <button
              onClick={exitERC20}
              disabled={Networkid !== 0 && Networkid === 5 ? false : true}
            >
              exit
            </button>

            <br />
            <input
              id="inputValue"
              type="text"
              placeholder="value"
              name="inputValue"
              value={inputValue}
              onChange={onchange}
              required
            />
          </div>
          
        </div>
        
        <div id = "plasma" hidden={selectedBridgeOption.label === "Plasma" ? false : true}>

          <div id="PlasmaEther" hidden={selectedToken.label === "Ether" ? false : true} >


            <button
              onClick={depositEtherPlasma}
              disabled={Networkid !== 0 && Networkid === 80001 ? true : false}
            >
              Deposit
            </button>

            <button
              onClick={burnEtherPlasma}
              disabled={Networkid !== 0 && Networkid === 5 ? true : false}
            >
              burn
            </button>
            <button
              onClick={confirmWithdrawEtherPlasma}
              disabled={Networkid !== 0 && Networkid === 5 ? false : true}
            >
              Confirm Withdraw
            </button>

            <button
              onClick={exitEtherPlasma}
              disabled={Networkid !== 0 && Networkid === 5 ? false : true}
            >
              exit
            </button>

            <br />
            <input
              id="inputValue"
              type="text"
              placeholder="value"
              name="inputValue"
              value={inputValue}
              onChange={onchange}
              required
            />
          </div>
          <div id="PlasmaERC20" hidden={selectedToken.label === "ERC20" ? false : true}>

          <button
            onClick={depositERC20Plasma}
            disabled={Networkid !== 0 && Networkid === 80001 ? true : false}
          >
            Deposit
          </button>

          <button
            onClick={burnERC20Plasma}
            disabled={Networkid !== 0 && Networkid === 5 ? true : false}
          >
            burn
          </button>
          <button
            onClick={confirmWithdrawERC20Plasma}
            disabled={Networkid !== 0 && Networkid === 5 ? false : true}
          >
            Confirm Withdraw
          </button>

          <button
            onClick={exitERC20Plasma}
            disabled={Networkid !== 0 && Networkid === 5 ? false : true}
          >
            exit
          </button>

          <br />
          <input
            id="inputValue"
            type="text"
            placeholder="value"
            name="inputValue"
            value={inputValue}
            onChange={onchange}
            required
          />
          <p id="burnHash">{burnHash}</p>
          </div>
          
        </div>
        
      </div>
    );
  }

  return (
    <div>
      <Navbar account={account} />
      <div>
      <select onChange={(e) => setSelectedBridgeOption({label:e.target.value})}>
        {bridgeOptions.map(item => (
          <option
            key={item.value}
            value={item.value}
          >
            {item.label}
          </option>
        ))}
      </select>
      </div>
      <div>
      <select onChange={(e) => setSelectedToken({label:e.target.value})}>
        {tokenTypes.map(item => (
          <option
            key={item.value}
            value={item.value}
            
          >
            {item.label}
          </option>
        ))}
      </select>
      </div>
      
      {content}
    </div>
  );
};

export default App;

