Moralis.initialize(""); // Application id from moralis.io
Moralis.serverURL = ""; //Server url from moralis.io

const nft_market_place_address = "" //NFT Market Place Contract, code of this contract is in the following github repository https://github.com/DanielMoralisSamples/25_NFT_MARKET_PLACE. 

const web3 = new Web3(window.ethereum);

Moralis.authenticate().then(function(){
    populateNFTs();
    populateOfferings();
    populateBalance();
    subscribeOfferings();
    subscribeBuys();
    subscribeUpdateNFTs();
});

//Real Time Updates
async function subscribeOfferings(){
    let query = new Moralis.Query("PlacedOfferings");
    subscriptionAlerts = await query.subscribe();
    subscriptionAlerts.on('create', (object) => {
        cleanOfferings();
        populateOfferings();
    });
}

async function subscribeBuys(){
    let query = new Moralis.Query("ClosedOfferings");
    subscriptionAlerts = await query.subscribe();
    subscriptionAlerts.on('create', (object) => {
        cleanOfferings();
        populateOfferings();
        populateBalance();
    });
}

async function subscribeUpdateNFTs(){
    let query = new Moralis.Query("PolygonNFTOwners");
    subscriptionAlerts = await query.subscribe();
    subscriptionAlerts.on('update', (object) => {
        cleanNFTList();
        populateNFTs();
    });
}

//Display Balance Functions
async function getBalance(_address){
    const params =  {address: _address}
    const balance = await Moralis.Cloud.run("getBalance", params);
    return(balance);
}

async function populateBalance(){
    const presentBalance = await getBalance(ethereum.selectedAddress);
    const formatedBalance = "Your Market Place Balance is " + Moralis.Units.FromWei(presentBalance) + " ETH"
    document.getElementById("balance").innerHTML = formatedBalance;
}


//Display NFT Functions

async function populateNFTs(){
    const localNFTs = await getNFTs().then(function (data){
        let nftDisplays = getNFTObjects(data);
        displayUserNFTs(nftDisplays);
    });
}

async function getNFTs(){
    const queryAll = new Moralis.Query("PolygonNFTOwners");
    queryAll.equalTo("owner_of", ethereum.selectedAddress);
    const data = await queryAll.find()
    nftArray = [];
    for (let i=0; i< data.length; i++){
        const metadataInfo = await fetch(data[i].get("token_uri"));
        const metadata = await metadataInfo.json();
        const nft = {"object_id":data[i].id, "token_id":data[i].get("token_id"),"token_uri":data[i].get("token_uri"),"contract_type":data[i].get("contract_type"),"token_address":data[i].get("token_address"),"image":metadata["image"],"name":metadata["name"],"description":metadata["description"]}
        nftArray.push(nft)
    }
    return nftArray;
}

function displayUserNFTs(data){
    let entryPoint = 0;
    let rowId = 0;
    for (i=0;i<data.length;i+=3){
        let row = `<div id="row_${rowId}" class="row"></div>`;
        document.getElementById('NFTLists').innerHTML += row;
        for (j=entryPoint;j<=entryPoint+2;j++){
            if (j< data.length){
            document.getElementById("row_"+rowId).innerHTML += data[j];
            }
        }
        entryPoint += 3;
        rowId += 1;
    }
}

function cleanNFTList(){
    document.getElementById('NFTLists').innerHTML = "";
}

function generateNFTDisplay(id, name, description, uri){
    const nftDisplay = `<div id="${id}" class="col-lg-4 text-center">
                            <img src=${uri} class="img-fluid rounded" style="max-width: 30%">
                            <h3>${name}</h3>
                            <p>${description}</p>
                            <button id="button_${id}" class="btn btn-dark" onclick="selectNFT(this);">Select</button>
                        </div>`
    return nftDisplay;
}

function getNFTObjects(array){
    let nfts = [];
    for (i=0;i<array.length;i++){
        nfts.push(generateNFTDisplay(array[i].object_id,array[i].name,array[i].description,array[i].image))
    }
    return nfts;
}

async function selectNFT(nftObject){
    const nftId = nftObject.parentElement.id;
    let nft = window.nftArray.find(object => object.object_id == nftId);
    const nftDisplay = `<div id="${nft.object_id}" class="text-center">
                            <img src=${nft.image} class="img-fluid rounded" style="max-width: 40%">
                            <h3>${nft.name}</h3>
                            <p>${nft.description}</p>
                            <div id="sellActions">
                                <input id="price" type="text" class="form-control mb-2" placeholder="Price"> 
                                <button id="sellButton"class="btn btn-dark btn-lg btn-block mb-2" id="sell" onclick="offerNFT(this);">Offer for Sale</button>
                            </div>
                        </div>`
    document.getElementById("featured_nft").innerHTML = nftDisplay;
    nftOffered = await isNFTOffered(nft.token_address,nft.token_id);
    if (nftOffered){
        document.getElementById("sellActions").remove();
    }
}

async function isNFTOffered(hostContract, tokenId){
    let offering_exist = true;
    let offering_closed = false;
    const queryAll = new Moralis.Query("PlacedOfferings");
    queryAll.equalTo("hostContract", hostContract);
    queryAll.equalTo("tokenId", tokenId);
    const data = await queryAll.find();
    data.length > 0? offering_exist = true: offering_exist = false;
    for (let i=0; i< data.length; i++){
        offering_closed = await isOfferingClosed(data[i].get("offeringId"));
    }
    const result = offering_exist && !offering_closed
    return result;
}

//Display Offering Functions
async function populateOfferings(){
    let offeringArray = await getOfferings();
    let offerings = await getOfferingObjects(offeringArray);
    displayOfferings(offerings);
}

async function getOfferings(){
    const queryAll = new Moralis.Query("PlacedOfferings");
    const data = await queryAll.find()
    offeringArray = [];
    for (let i=0; i< data.length; i++){
        let flag = await isOfferingClosed(data[i].get("offeringId"));
        if (!flag) {
            const metadataInfo = await fetch(data[i].get("uri"));
            const metadata = await metadataInfo.json();
            const offering = {"offeringId":data[i].get("offeringId"),"offerer":data[i].get("offerer"),"hostContract":data[i].get("hostContract"),"tokenId":data[i].get("tokenId"),"price":web3.utils.fromWei(data[i].get("price")),"image":metadata["image"],"name":metadata["name"],"description":metadata["description"]}
            offeringArray.push(offering)
        }
    }
    return offeringArray;
}

async function isOfferingClosed(offeringId){
    const queryAll = new Moralis.Query("ClosedOfferings");
    queryAll.equalTo("offeringId", offeringId);
    const data = await queryAll.find()
    data.length > 0? result = true: result = false;
    return result;
}

function generateOfferingDisplay(id, uri, name, price){
    const offeringDisplay = `<div id="${id}" class="row">
                                <div class="col-lg-6 text-center">
                                    <img src=${uri} class="img-fluid rounded" style="max-width: 30%">
                                </div>
                                <div class="col-lg-6 text-center align-middle">
                                    <h3>${name}</h3>
                                    <h4>${price} ETH</h4>
                                    <button id="button_${id}" class="btn btn-dark" onclick="selectOffering(this);">Select</button>
                                </div>
                            </div>`
    return offeringDisplay;
}

function getOfferingObjects(array){
    let offerings = [];
    for (i=0;i<array.length;i++){
        offerings.push(generateOfferingDisplay(array[i].offeringId,array[i].image,array[i].name,array[i].price))
    }
    return offerings;
}

function displayOfferings(data){
    for (i=0;i<data.length;i++){
        document.getElementById('offeringList').innerHTML += data[i];
    }
}

function cleanOfferings(){
    document.getElementById('offeringList').innerHTML = "";
}

async function selectOffering(offeringObject){
    const offeringId = offeringObject.parentElement.parentElement.id;
    let offering = window.offeringArray.find(offering => offering.offeringId == offeringId);
    const offeringDisplay = `<div id="${offering.offeringId}" class="text-center">
                            <img src=${offering.image} class="img-fluid rounded" style="max-width: 40%">
                            <h3>${offering.name}</h3>
                            <h3>${offering.price + " ETH"}</h3>
                            <div id="buyActions">
                                <button id="buyButton"class="btn btn-dark btn-lg btn-block mb-2" onclick="buyNFT(this);">Buy</button>
                            </div>
                        </div>`
    document.getElementById("featured_nft").innerHTML = offeringDisplay;
    if (offering.offerer == ethereum.selectedAddress){
        document.getElementById("buyActions").remove();
    }
}


//Sell NFT Funtions

async function offerNFT(context){
    let nftId = context.parentElement.parentElement.id;
    let nft = window.nftArray.find(object => object.object_id == nftId);
    const price = document.getElementById("price").value;
    const contract = nft.token_address;
    const tokenId = nft.token_id;
    context.setAttribute("disabled",null);
    const approval = await approveMarketPlace(contract, tokenId);
    const tx_approval = `<p> Approval transaction ${approval}</p>`
    context.parentElement.innerHTML = tx_approval;
    const offering = await placeOffering(contract,tokenId, price);
    console.log(offering)
}

async function placeOffering(_hostContract, _tokenId, _price) {
    const params =  {hostContract: _hostContract,
                    offerer: ethereum.selectedAddress,
                    tokenId: _tokenId,
                    price: _price
    }
    const signedTransaction = await Moralis.Cloud.run("placeOffering", params);
    fulfillTx = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
  	return fulfillTx;
}

async function approveMarketPlace(hostContract, tokenId){
    const encodedFunction = web3.eth.abi.encodeFunctionCall({
        name: "approve",
        type: "function",
        inputs: [
            {type: 'address',
            name: 'to'},
            {type: 'uint256',
            name: 'tokenURI'}]
    }, [nft_market_place_address, tokenId]);
    
    const transactionParameters = {
        to: hostContract,
        from: ethereum.selectedAddress,
        data: encodedFunction
    };
    const txt = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters]
    });
    return txt
}

//Buy NFT Funtions

async function buyNFT(context){
    const offeringId = context.parentElement.parentElement.id;
    let offering = window.offeringArray.find(object => object.offeringId == offeringId);
    const price = Moralis.Units.ETH(offering.price);
    const priceHexString = BigInt(price).toString(16);
    closedOffering = await closeOffering(offeringId,priceHexString);
    const tx_closeOffering = `<p> Buying transaction ${closedOffering}</p>`;
    context.parentElement.innerHTML = tx_closeOffering;
}

async function closeOffering(offeringId, priceEncoded){
    const encodedFunction = web3.eth.abi.encodeFunctionCall({
        name: "closeOffering",
        type: "function",
        inputs: [
            {type: 'bytes32',
            name: '_offeringId'}]
    }, [offeringId]);
    
    const transactionParameters = {
        to: nft_market_place_address,
        from: ethereum.selectedAddress,
        value: priceEncoded,
        data: encodedFunction
    };
    const txt = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters]
    });
    return txt
}