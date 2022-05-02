  // @nearfile
  import { context, storage, logging, PersistentMap, ContractPromiseBatch, u128 } from "near-sdk-as";
  import { Context } from "near-sdk-core";
  const me = 'f3d.near' 
  
  export function currentTime(): f64{
    const time = Context.blockTimestamp;
    return (time / 1000 as f64);
  }// --- contract code goes below

  const balances = new PersistentMap<string, u64>("b:");
  const approves = new PersistentMap<string, u64>("a:");
  const winner = new PersistentMap<string, string>("c:");
  const howlong = new PersistentMap<string, f64>("d:");
  const winbet = new PersistentMap<string, u64>("e:");
  const TOTAL_SUPPLY = new PersistentMap<string, u64>("f:");
  
  const rate: u64 = 10 as u64
  const jare = 'h3x.near'
  let ts: f64 = 1000 * 1000 *  60 * 60 * 24 * 7;
  
  //storage.set<string>('TOTAL_SUPPLY', 0);
  export function init(account_id: string): void {
    const initialOwner = account_id;
    logging.log("initialOwner: " + initialOwner);
    assert(storage.get<string>("init10") == null, "Already initialized token supply");
    winner.set(me, "staccart.example.near")
    howlong.set(me, (currentTime() + ts))
    logging.log('whattime?: ' +  (howlong.getSome(me)  || 0).toString())
    winbet.set(me, 0)
    TOTAL_SUPPLY.set(me, 0)
    storage.set("init10", "done");
  }

  export function totalSupply(): u64 {
    return TOTAL_SUPPLY.getSome(me)
  }

  export function getWinBet(): u64 {
    return winbet.getSome(me) 
  }

  export function getwinner(): string | null{
    return winner.getSome(me) 
  }

  export function getCountDown(): f64 {
    return howlong.getSome(me) 
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

    const lg: u64 = (tokens * 98) / 100
    const sm: u64 = tokens - lg
    logging.log("burning 2%: " +sm.toString());
    logging.log("remaining: " + lg.toString());
    const fromAmount = getBalance(context.sender);
    const toBal = getBalance(to);
    const sysBal = getBalance("system");
    assert(fromAmount >= tokens, "not enough tokens on account");
    assert(getBalance(to) <= getBalance(to) + tokens,"overflow at the receiver side");
    balances.set(context.sender, fromAmount - tokens);
    balances.set("system", sysBal + sm); // magik
    balances.set(to, toBal + lg)
    
    return true;
  }
  
  export function mint(): boolean {
    logging.log("mint from: " + context.sender);

    assert(context.attachedDeposit.toU64() > 0,"overflow at the receiver side");
    const tokens: u64 = ((context.attachedDeposit.toU64())  * rate)  as u64; // want 1 @ 0.138 rate 138 * 1000 / 138 = 
    logging.log("mint from: " + context.sender + " tokens: " + tokens.toString());
    const lg: u64 = (tokens * 98) / 100
    const sm: u64 = tokens - lg
    logging.log("burning 2%: " + sm.toString());
    logging.log("remaining: " + lg.toString());
    assert((context.attachedDeposit.toU64()) >= (tokens) / (rate), "u not pay enuff"); 
    const toBal = getBalance(context.sender);
    ContractPromiseBatch.create(jare).transfer(u128.div(context.attachedDeposit, u128.from(2)));
    balances.set("system", (toBal +sm)); // magik
    balances.set(context.sender, (toBal + lg))
   
    const sup = (TOTAL_SUPPLY.getSome(me) ) || (0);   
    TOTAL_SUPPLY.set(me, (sup + (toBal + lg)))
    return true;
  }
  export function withdraw(): boolean {
    logging.log("withdrawsers");
    const amt = getBalance(context.contractName);
    const winn = winner.getSome(me) as string || "jaremaybe2" 
    const howLong = howlong.getSome(me)  || (currentTime() + ts)
    assert(currentTime() > (howLong), "not time");
    assert(winn == context.sender as string, "bro u didn't win lol");
    assert(getBalance(context.sender) <= getBalance(context.sender) + getBalance(context.contractName),"overflow at the receiver side");
    balances.set(me, amt / 4);
    balances.set(context.sender, (amt / 4 * 3));
    howlong.set(me, (currentTime() + ts))
    winner.set(me, "staccart.example.near")
    winbet.set(me, 0);

    return true;
  }
  export function becomeWinner(tokens: u64): boolean {
    logging.log("trying to become winner: " + context.sender + " tokens: " + tokens.toString());
    const winBet = u128.from(winbet.getSome(me) || 0).toU64()
    const howLong = howlong.getSome(me)  || (currentTime() + ts)
    assert(tokens >= winBet, "bro u gotta bet moar");
    
    assert(currentTime() < howLong, "time has run out jonsno");
    const fromAmount = getBalance(context.sender);
    const contractAmount = getBalance(me);
    assert(fromAmount >= tokens, "not enough tokens   on account");
    assert(contractAmount <= contractAmount + tokens,"overflow at the receiver side");
    

    balances.set(context.sender, fromAmount - tokens);
    
   
    balances.set(me, (contractAmount + tokens))
    winner.set(me, context.sender)
    howlong.set(me, (currentTime() + ts))
    winbet.set(me, tokens)

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

    const lg: u64 = (tokens * 98) / 100
    const sm: u64 = tokens - lg
    assert(tokens <= approvedAmount, "not enough tokens approved to transfer");
    assert(getBalance(to) <= getBalance(to) + tokens,"overflow at the receiver side");
    balances.set("system", ((sysBal + tokens) * 2) / 100); // magik


    const sup = TOTAL_SUPPLY.getSome(me) || 0

    TOTAL_SUPPLY.set(me, sup -sm)
    balances.set(to, getBalance(to) + lg)
    return true;
  }

  function getBalance(owner: string): u64 {
    return balances.contains(owner) ? balances.getSome(owner) : 0;
  }
