  // @nearfile
  import { context, storage, logging, PersistentMap, ContractPromiseBatch, u128 } from "near-sdk-as";
  import { Context } from "near-sdk-core";
  export function currentTime(): f64{
    const time = Context.blockTimestamp;
    return (time as f64);
  }// --- contract code goes below

  const balances = new PersistentMap<string, u64>("b:");
  const approves = new PersistentMap<string, u64>("a:");
  let winner: string;
  const rate: u64 = 138
  winner =  "staccart.example.near";
  let jare =  "staccart.testnet";
  let ts: f64 = 1000 * 1000 * 60 * 60 * 24 * 7;
  let howLong: f64 = 0 as f64;//currentTime() + ts;
  let winBet: u64 = 0;
  let TOTAL_SUPPLY: u64 = 0;
  export function init(account_id: string): void {
    const initialOwner = account_id;
    logging.log("initialOwner: " + initialOwner);
    assert(storage.get<string>("init138111") == null, "Already initialized token supply");
    balances.set(initialOwner, TOTAL_SUPPLY);
    //ts = parseInt(hw);
    howLong = currentTime() + ts;
    logging.log("howLong: " + howLong.toString());

    storage.set("init", "done");
  }

  export function totalSupply(): string {
    return TOTAL_SUPPLY.toString();
  }

  export function balanceOf(tokenOwner: string): u64 {
    logging.log("balanceOf: " + tokenOwner);
    if (!balances.contains(tokenOwner)) {
      return 0;
    }
    const result = balances.getSome(tokenOwner);
    return result;
  }

  export function allowance(tokenOwner: string, spender: string): u64 {
    const key = tokenOwner + ":" + spender;
    if (!approves.contains(key)) {
      return 0;
    }
    return approves.getSome(key);
  }

  export function transfer(tokens: u64, to: string): boolean {
    logging.log("transfer from: " + context.sender + " to: " + to + " tokens: " + tokens.toString());
    logging.log("burning 2%: " + ((tokens * 2) / 100).toString());
    logging.log("remaining: " + ((tokens * 98) / 100).toString());
    const fromAmount = getBalance(context.sender);
    const toBal = getBalance(to);
    assert(fromAmount >= tokens, "not enough tokens on account");
    assert(getBalance(to) <= getBalance(to) + tokens,"overflow at the receiver side");
    balances.set(context.sender, fromAmount - tokens);
    balances.set("system", ((toBal + tokens) * 2) / 100); // magik
    balances.set(to, ((toBal + tokens) * 98) / 100);
    
    return true;
  }
  
  export function mint(): boolean {
    logging.log("mint from: " + context.sender);

    const tokens: u64 = ((context.attachedDeposit.toU64()) / (rate) * 1000) as u64;
    logging.log("mint from: " + context.sender + " tokens: " + tokens.toString());
    logging.log("burning 2%: " + ((tokens * 2) / 100).toString());
    logging.log("remaining: " + ((tokens * 98) / 100).toString());
    assert((context.attachedDeposit.toU64()) > (tokens) * (rate), "u not pay enuff"); 
    const toBal = getBalance(context.sender);
    assert(getBalance(context.contractName) <= getBalance(context.sender) + tokens,"overflow at the receiver side");
    ContractPromiseBatch.create(jare).transfer(context.attachedDeposit);
    balances.set("system", ((toBal + tokens) * 2) / 100); // magik
    balances.set(context.sender, ((toBal + tokens) * 98) / 100);
    TOTAL_SUPPLY = TOTAL_SUPPLY + tokens;
    return true;
  }
  export function getWinBet(): string | null {
    return winBet.toString();
  }

  export function getwinner(): string | null {
    return winner;
  }

  export function getCountDown(): string  | null{
    return (howLong ).toString();
  }
  export function withdraw(): boolean {
    logging.log("withdrawsers");
    const amt = getBalance(context.contractName);
    assert(currentTime() < (howLong), "not time");
    assert(winner == context.sender as string, "bro u didn't win lol");
    assert(getBalance(context.sender) <= getBalance(context.sender) + getBalance(context.contractName),"overflow at the receiver side");
    balances.set(context.contractName, amt / 4);
    balances.set(context.sender, (amt / 4 * 3));
    howLong = currentTime() + ts;
    winner =  "staccart.example.near";
    winBet = 0;

    return true;
  }
  export function becomeWinner(tokens: u64): boolean {
    logging.log("trying to become winner: " + context.sender + " tokens: " + tokens.toString());

    assert(tokens >= winBet, "bro u gotta bet moar");
    
    assert(currentTime() > howLong, "time has run out jonsno");
    const fromAmount = getBalance(context.sender);
    const contractAmount = getBalance(context.contractName);
    assert(fromAmount >= tokens, "not enough tokens   on account");
    assert(getBalance(context.contractName) <= getBalance(context.contractName) + tokens,"overflow at the receiver side");
    

    balances.set(context.sender, fromAmount - tokens);
    balances.set("system", ((contractAmount + tokens) * 2) / 100); // magik
    balances.set(context.contractName, ((contractAmount + tokens) * 98) / 100);
    winner =  context.sender;
    howLong = currentTime() + ts;
    winBet = fromAmount;

    return true;
  }



  export function approve(spender: string, tokens: u64): boolean {
    logging.log("approve: " + spender + " tokens: " + tokens.toString());
    approves.set(context.sender + ":" + spender, tokens);
    return true;
  }

  export function transferFrom(from: string, to: string, tokens: u64): boolean {
    const fromAmount = getBalance(from);
    assert(fromAmount >= tokens, "not enough tokens on account");
    const approvedAmount = allowance(from, to);
    const sysBal = getBalance("system");

    assert(tokens <= approvedAmount, "not enough tokens approved to transfer");
    assert(getBalance(to) <= getBalance(to) + tokens,"overflow at the receiver side");
    balances.set("system", ((sysBal + tokens) * 2) / 100); // magik
    balances.set(to, ((getBalance(to) + tokens) * 98) / 100);
    return true;
  }

  function getBalance(owner: string): u64 {
    return balances.contains(owner) ? balances.getSome(owner) : 0;
  }
