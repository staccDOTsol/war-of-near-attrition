import {useEffect, useState} from "react";
import styled from "styled-components";
import BN from 'bn.js';
import confetti from "canvas-confetti";
import {LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {GatewayProvider} from '@civic/solana-gateway-react';
import Countdown from "react-countdown";
import {Snackbar, Paper, LinearProgress, Chip} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import {toDate, AlertState, getAtaForMint} from './utils';
import {CTAButton, MintButton} from './MintButton';

import 'regenerator-runtime/runtime';
import PropTypes from 'prop-types';
import Big from 'big.js';
import { createTheme, ThemeProvider, TextField } from "@material-ui/core";

import "./App.css";

import ReactDOM from 'react-dom';
import getConfig from './config.js';
import * as nearAPI from 'near-api-js';
require('@solana/wallet-adapter-react-ui/styles.css');

const txTimeout = 30000; // milliseconds (confirm this works for your project)

const theme = createTheme({
    palette: {
        type: 'dark',
    },
    overrides: {
        MuiButtonBase: {
            root: {
                justifyContent: 'flex-start',
            },
        },
        MuiButton: {
            root: {
                textTransform: undefined,
                padding: '12px 16px',
            },
            startIcon: {
                marginRight: 8,
            },
            endIcon: {
                marginLeft: 8,
            },
        },
    },
});
const WalletContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: right;
`;

const WalletAmount = styled.div`
  color: black;
  padding: 5px 5px 5px 16px;
  border-radius: 42px;
  background-color: var(--main-text-color);
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%), 0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  box-sizing: border-box;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  font-weight: 500;
  line-height: 1.75;
  text-transform: uppercase;
  border: 0;
  margin: 0;
  display: inline-flex;
  outline: 0;
  position: relative;
  align-items: center;
  user-select: none;
  vertical-align: middle;
  justify-content: flex-start;
  gap: 10px;
`;

const Wallet = styled.ul`
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
`;

const ConnectButton = styled(WalletMultiButton)`
  border-radius: 18px !important;
  padding: 6px 16px;
  background-color: #4E44CE;
  margin: 0 auto;
`;

const NFT = styled(Paper)`
  min-width: 500px;
  margin: 0 auto;
  padding: 5px 20px 20px 20px;
  flex: 1 1 auto;
  background-color: var(--card-background-color) !important;
  box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22) !important;
`;

const Card = styled(Paper)`
  display: inline-block;
  background-color: var(--countdown-background-color) !important;
  margin: 5px;
  min-width: 40px;
  padding: 24px;
  h1{
    margin:0px;
  }
`;

const MintButtonContainer = styled.div`
  button.MuiButton-contained:not(.MuiButton-containedPrimary).Mui-disabled {
    color: #464646;
  }

  button.MuiButton-contained:not(.MuiButton-containedPrimary):hover,
  button.MuiButton-contained:not(.MuiButton-containedPrimary):focus {
    -webkit-animation: pulse 1s;
    animation: pulse 1s;
    box-shadow: 0 0 0 2em rgba(255, 255, 255, 0);
  }

  @-webkit-keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 #ef8f6e;
    }
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 #ef8f6e;
    }
  }
`;

const SolExplorerLink = styled.a`
  color: var(--title-text-color);
  border-bottom: 1px solid var(--title-text-color);
  font-weight: bold;
  list-style-image: none;
  list-style-position: outside;
  list-style-type: none;
  outline: none;
  text-decoration: none;
  text-size-adjust: 100%;

  :hover {
    border-bottom: 2px solid var(--title-text-color);
  }
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 4%;
  margin-left: 4%;
  text-align: center;
  justify-content: center;
`;

const MintContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 20px;
`;

const DesContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  gap: 20px;
`;

const Price = styled(Chip)`
  position: absolute;
  margin: 5px;
  font-weight: bold;
  font-size: 1.2em !important;
  font-family: 'Patrick Hand', cursive !important;
`;

const Image = styled.img`
  height: 400px;
  width: auto;
  border-radius: 7px;
  box-shadow: 5px 5px 40px 5px rgba(0,0,0,0.5);
`;

const BorderLinearProgress = styled(LinearProgress)`
  margin: 20px;
  height: 10px !important;
  border-radius: 30px;
  border: 2px solid white;
  box-shadow: 5px 5px 40px 5px rgba(0,0,0,0.5);
  background-color:var(--main-text-color) !important;
  
  > div.MuiLinearProgress-barColorPrimary{
    background-color:var(--title-text-color) !important;
  }

  > div.MuiLinearProgress-bar1Determinate {
    border-radius: 30px !important;
    background-image: linear-gradient(270deg, rgba(255, 255, 255, 0.01), rgba(255, 255, 255, 0.5));
  }
`;
const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed();

export interface HomeProps {
}
let contract: any
const App = (props: HomeProps) => {
    const [ending, setEnding] = useState<BN>(new BN(1));
    const [balance, setBalance] = useState<number>();
    const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
    const [isActive, setIsActive] = useState(false); // true when countdown completes or whitelisted
    const [solanaExplorerLink, setSolanaExplorerLink] = useState<string>("");
    const [totalSupply, setTotalSupply] = useState(0);
    const [itemsRedeemed, setItemsRedeemed] = useState(0);
    const [itemsRemaining, setItemsRemaining] = useState(0);
    const [isSoldOut, setIsSoldOut] = useState(false);
    const [payWithSplToken, setPayWithSplToken] = useState(false);
    const [price, setPrice] = useState(0);
    const [priceLabel, setPriceLabel] = useState<string>("SOL");
    const [whitelistPrice, setWhitelistPrice] = useState(0);
    const [whitelistEnabled, setWhitelistEnabled] = useState(false);
    const [isBurnToken, setIsBurnToken] = useState(false);
    const [whitelistTokenBalance, setWhitelistTokenBalance] = useState(0);
    const [isEnded, setIsEnded] = useState(false);
    const [endDate, setEndDate] = useState<Date>();
    const [isPresale, setIsPresale] = useState(false);
    const [isWLOnly, setIsWLOnly] = useState(false);
    const [quantityString, setQuantityString ] = useState(138);
    const [winBet, setWinbet]  = useState(0.138);
    const [winner, setWinner] = useState("h3xmaybe");
    const [balancef3d, setbalancef3d] = useState(0);
    const [near, setNear ] = useState<any>()
    const [money, setWantDeposit] = useState(1)
const [walletConnection, setWalletConnection] = useState<any>()
const [currentUser, setCurrentUser] = useState<any>()
  // get network configuration values from config.js
  // based on the network ID we pass to getConfig()
  const nearConfig = {
    networkId: 'mainnet',
    nodeUrl: 'https://rpc.mainnet.near.org',
    contractName: 'f3d.near',
    walletUrl: 'https://wallet.mainnet.near.org',
    helperUrl: 'https://helper.mainnet.near.org'
  }
  // create a keyStore for signing transactions using the user's key
  // which is located in the browser local storage after user logs in
  const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();


  async function signIn() {

  // Initializing connection to the NEAR testnet
  // @ts-ignore
  let nea = await nearAPI.connect({ keyStore, ...nearConfig })

  // Initialize wallet connection
  // @ts-ignore
  let walletConnectio = new nearAPI.WalletConnection(nea)


  // Load in user's account data
  
  console.log(walletConnectio)
  if (walletConnectio.getAccountId()) {
    let currentUse = ({
      // Gets the accountId as a string
      accountId: walletConnectio.getAccountId(),
      // Gets the user's token balance
      balance: (await walletConnectio.account().state()).amount,
    }
    )
    setCurrentUser(currentUse)
  console.log(currentUse)

  // Initializing our contract APIs by contract name and configuration
 contract = (await new nearAPI.Contract(
    // User's accountId as a string
    walletConnectio.account(),
    // accountId of the contract we will be loading
    // NOTE: All contracts on NEAR are deployed to an account and
    // accounts can only have one contract deployed to them.
    nearConfig.contractName,
    {
      // View methods are read-only – they don't modify the state, but usually return some value
      viewMethods: ['totalSupply', 'balanceOf', 'howLong', 'allowance', 'getCountDown','getwinner', 'getWinBet'],
      changeMethods: ['init', 'transfer', 'approve', 'transferFrom', 'becomeWinner', 'withdraw', 'mint'],
      // Sender is the account ID to initialize transactions.
      // getAccountId() will return empty string if user is still unauthorized
  // @ts-ignore
      sender: walletConnectio.getAccountId(),
    }
  ))
  console.log(contract)
    
    }
    else {

  walletConnectio.requestSignIn(
    "f3d.near", // contract requesting access
    "f3d", // optional
    //"http://YOUR-URL.com/success", // optional
    //"http://YOUR-URL.com/failure" // optional
  );
    }
  }
    function change(e: any){
      e.preventDefault() 
      setQuantityString(parseFloat(e.target.value))
    }

    function wantDeposit(e: any){
      e.preventDefault() 
      setWantDeposit(parseFloat(e.target.value))
    }
    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: "",
        severity: undefined,
    });
    const solFeesEstimation = 0.012; // approx of account creation fees

    const refreshCandyMachineState = () => {
        (async () => {
/*
            settotalSupply(cndy.state.totalSupply);
            setItemsRemaining(cndy.state.itemsRemaining);
            setItemsRedeemed(cndy.state.itemsRedeemed);
*/
            var divider = 1;

            // detect if using spl-token to mint
                setPayWithSplToken(true);
                // Customize your SPL-TOKEN Label HERE
                // TODO: get spl-token metadata name
                setPriceLabel("f3d");
                setPrice(0.1);


            // end the mint when date is reached
            if (true) {
                setEndDate(toDate(ending));
                if (
                    ending.toNumber() <
                    new Date().getTime() / 1000
                ) {
                    setIsEnded(true);
                    setIsActive(false);
                }
            }
        })();
    };

    const renderGoLiveDateCounter = ({days, hours, minutes, seconds}: any) => {
        return (
            <div><Card elevation={1}><h1>{days}</h1>Days</Card><Card elevation={1}><h1>{hours}</h1>
                Hours</Card><Card elevation={1}><h1>{minutes}</h1>Mins</Card><Card elevation={1}>
                <h1>{seconds}</h1>Secs</Card></div>
        );
    };

    const renderEndDateCounter = ({days, hours, minutes}: any) => {
        let label = "";
        if (days > 0) {
            label += days + " days "
        }
        if (hours > 0) {
            label += hours + " hours "
        }
        label += (minutes+1) + " minutes left to becomeWinner."
        return (
            <div><h3>{label}</h3></div>
        );
    };

    function displaySuccess(mintPublicKey: any, qty: number = 1): void {
        let remaining = itemsRemaining - qty;
        setItemsRemaining(remaining);
        setIsSoldOut(remaining === 0);
        if (isBurnToken && whitelistTokenBalance && whitelistTokenBalance > 0) {
            let balance = whitelistTokenBalance - qty;
            setWhitelistTokenBalance(balance);
            setIsActive(isPresale && !isEnded && balance > 0);
        }
        setItemsRedeemed(itemsRedeemed + qty);
        if (!payWithSplToken && balance && balance > 0) {
            setBalance(balance - ((whitelistEnabled ? whitelistPrice : price) * qty) - solFeesEstimation);
        }
        throwConfetti();
    };

    function throwConfetti(): void {
        confetti({
            particleCount: 400,
            spread: 70,
            origin: {y: 0.6},
        });
    }

    function sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    async function mintOne(toks: number) {
        if (true) {
            const near = toks * 0.1;
            contract.mint(
                {account_id:currentUser.accountId},
                BOATLOAD_OF_GAS,
                Big(near).times(10 ** 24).toFixed()
            
               )
        }
    }

    async function deposit() {
      if (true) {
         await contract.becomeWinner(
              {tokens:Big(money).times(10 ** 17).toFixed(),account_id:currentUser.accountId},
              BOATLOAD_OF_GAS,
              money / 2
          
             )
      }
  }

    const startMint = async () => {
        try {
            setIsMinting(true);
            await mintOne(quantityString);
            
        } catch (error: any) {
          console.log(error)
            let message = error.msg || 'Minting failed! Please try again!';
            if (!error.msg) {
                if (!error.message) {
                    message = 'Transaction Timeout! Please try again.';
                } else if (error.message.indexOf('0x138')) {
                } else if (error.message.indexOf('0x137')) {
                    message = `SOLD OUT!`;
                } else if (error.message.indexOf('0x135')) {
                    message = `Insufficient funds to mint. Please fund your wallet.`;
                }
            } else {
                if (error.code === 311) {
                    message = `SOLD OUT!`;
                } else if (error.code === 312) {
                    message = `Minting period hasn't started yet.`;
                }
            }

            setAlertState({
                open: true,
                message,
                severity: "error",
            });
        } finally {
            setIsMinting(false);
        }
    };
    useEffect(() => {
        (async () => {
          console.log(currentUser)
          if (currentUser) { 
        
            const supply = await contract.totalSupply()
            console.log(supply)
            

  //  contract.init( {account_id: currentUser.accountId}      )  
            setTotalSupply(Math.floor(supply / 10 ** 17 * 1000) / 1000) 
            const end = await contract.getCountDown()
            setEnding(end)
            console.log(end)
            const winb = await contract.getWinBet()
            setWinbet(Math.floor(winb / 10 ** 17 * 1000) / 1000)
            const winn = await contract.getwinner()
            setWinner(winn)
            var b3d = await contract.balanceOf({tokenOwner:"f3d.near"})
            console.log(b3d)
            console.log(b3d)
            console.log(b3d)
            console.log(b3d)
            console.log(b3d)
            console.log(b3d)
            console.log(b3d)
            setbalancef3d(Math.floor((b3d * 0.75) / 10 ** 17 * 1000) / 1000)

            var b3d = await contract.balanceOf({tokenOwner:currentUser.accountId})
            console.log(b3d)
            console.log(b3d)
            console.log(b3d)
            console.log(b3d)
            console.log(b3d)
            console.log(b3d)
            console.log(b3d)
            setBalance(Math.floor(b3d / 10 ** 17 * 1000) / 1000)
    
            setEndDate(toDate(new BN(end / 1000 )));
          }
        })();
    }, [currentUser]);



    return (
      <ThemeProvider theme={theme}>
        <main>
              

            <MainContainer>
                
                <MintContainer>
                    <DesContainer>
                        <NFT elevation={3}>
                            <h2>A Totally Fair Game</h2>
                            <h3>wen timer runs out, the last person to becomeWinner gets 3/4 of pot &lt;3</h3>
                            <h3>pot: f3d tokens and NEAR on the contract. Nice!</h3>
                            <h4>yet, whenever someone becomesWinner the timer resets to now+seven days :)</h4>
                            <h4>btw? hodling? supply burned 2% on mint n transfer :)</h4>
                            
                            <br/>
                            <div><Price
                                label={"0.1 NEAR per f3d - btw the cats pointless"}/>
                                <Image
                                src="cool-cats.gif"
                                alt="NFT To Mint"/></div>
                            <br/>
                        {endDate  &&
                        // @ts-ignore
                              <Countdown
                                date={endDate}
                                onMount={({completed}) => completed && setIsEnded(true)}
                                onComplete={() => {
                                    setIsEnded(true);
                                }}
                                renderer={renderEndDateCounter}
                              />}
                              <h3>TOTAL SUPPLY : {totalSupply}</h3>

                            <br/>
                            
                            <MintButtonContainer>
                                { currentUser ? (
<div>
                            How many buy? <br />
{
  // @ts-ignore
                            <TextField onChange={change} placeholder={"138"}></TextField>
}
                            <br />
                                                { 
                                                // @ts-ignore
                                                < MintButton
                                                    isMinting={isMinting}

                                                    onMint={startMint}
                                                />
}
                                                </div>
                                 ): (
<CTAButton onClick={signIn}>
  Login yo
</CTAButton>
) }
                            </MintButtonContainer>
          
          <br />
          <MintButtonContainer> { currentUser && 
          <div>
                      <br />

            {winner} winning :) <br /><br />
            Your bags: {balance} <br />
            Pot: {balancef3d} <br /><br />
                            How many deposit?
                            <br />
                            <TextField onChange={wantDeposit} placeholder={"138"}></TextField>
                                  <CTAButton onClick={deposit}>
  Become winner @ &gt; {winBet} ?
  
</CTAButton> </div>
}

</MintButtonContainer>
          
                                  
                                  <br/>

                        </NFT>
                    </DesContainer>
                </MintContainer>
            </MainContainer>
            <Snackbar
                open={alertState.open}
                autoHideDuration={6000}
                onClose={() => setAlertState({...alertState, open: false})}
            >
                <Alert
                    onClose={() => setAlertState({...alertState, open: false})}
                    severity={alertState.severity}
                >
                    {alertState.message}
                </Alert>
            </Snackbar>
            <MainContainer>

            <MintContainer>

                    <DesContainer>     
                <NFT >{"Psst... rightclick save I'm tired of fucking with CSS"}</NFT>

                    </DesContainer>
                </MintContainer>
              </MainContainer>
<MainContainer>
            <MintContainer>
                    <DesContainer >
                <NFT style={{width:"80%"}}>
            <img src="/1.png" width={"77%"} ></img>
            </NFT>

                    </DesContainer>
                </MintContainer>
            </MainContainer>

            <MainContainer>

            <MintContainer>

                    <DesContainer>     
                <NFT style={{width:"80%"}}>
            <img src="/2.png" width={"77%"} height={"90%"}></img>
            </NFT>

                    </DesContainer>
                </MintContainer>
            </MainContainer>
        </main>
        </ThemeProvider>
    );
};

export default App;
