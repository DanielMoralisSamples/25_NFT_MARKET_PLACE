const web3 = Moralis.web3ByChain("0x13881"); // Mumbai Testnet

const nft_market_place_address = "" ;
const coordinatorKey = "";
const nft_market_place_abi = [{"inputs": [{"internalType": "address", "name": "_operator", "type": "address"}], "stateMutability": "nonpayable", "type": "constructor", "name": "constructor"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "beneficiary", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "BalanceWithdrawn", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "bytes32", "name": "offeringId", "type": "bytes32"}, {"indexed": true, "internalType": "address", "name": "buyer", "type": "address"}], "name": "OfferingClosed", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "bytes32", "name": "offeringId", "type": "bytes32"}, {"indexed": true, "internalType": "address", "name": "hostContract", "type": "address"}, {"indexed": true, "internalType": "address", "name": "offerer", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"}, {"indexed": false, "internalType": "string", "name": "uri", "type": "string"}], "name": "OfferingPlaced", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "internalType": "address", "name": "previousOperator", "type": "address"}, {"indexed": false, "internalType": "address", "name": "newOperator", "type": "address"}], "name": "OperatorChanged", "type": "event"}, {"inputs": [{"internalType": "address", "name": "_newOperator", "type": "address"}], "name": "changeOperator", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "bytes32", "name": "_offeringId", "type": "bytes32"}], "name": "closeOffering", "outputs": [], "stateMutability": "payable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "_offerer", "type": "address"}, {"internalType": "address", "name": "_hostContract", "type": "address"}, {"internalType": "uint256", "name": "_tokenId", "type": "uint256"}, {"internalType": "uint256", "name": "_price", "type": "uint256"}], "name": "placeOffering", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "_address", "type": "address"}], "name": "viewBalances", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "bytes32", "name": "_offeringId", "type": "bytes32"}], "name": "viewOfferingNFT", "outputs": [{"internalType": "address", "name": "", "type": "address"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "withdrawBalance", "outputs": [], "stateMutability": "nonpayable", "type": "function"}];
const marketPlace = new web3.eth.Contract(nft_market_place_abi,nft_market_place_address);

Moralis.Cloud.define("placeOffering", async(request) => {
	const hostContract = request.params.hostContract;
 	const offerer = request.params.offerer;
 	const tokenId = request.params.tokenId;
  	const price = request.params.price;
  	const nonceOperator = web3.eth.getTransactionCount("0x77Ef4472cAc1AAca6B4bB82EA2bc41A6cf876EAf")
 	const functionCall = marketPlace.methods.placeOffering(offerer,hostContract,tokenId,web3.utils.toWei(price,"ether")).encodeABI();
    transactionBody = {
    	to: nft_market_place_address,
      	nonce:nonceOperator,
      	data:functionCall,
      	gas:400000,
      	gasPrice:web3.utils.toWei("1", "gwei")
    }
  	signedTransaction = await web3.eth.accounts.signTransaction(transactionBody,coordinatorKey);
  	return signedTransaction;
});

Moralis.Cloud.define("getBalance", async(request) => {
const balance = await marketPlace.methods.viewBalances(request.params.address).call();
return balance;
});