/* This contracts are offered for learning purposes only, to illustrate certain aspects of development regarding web3, 
   they are not audited of course and not for use in any production environment. 
   They are not aiming to illustrate true randomness or reentrancy control, as a general rule they use transfer() instead of call() to avoid reentrancy,
   which of course only works is the recipient is not intended to be a contract that executes complex logic on transfer.
*/


// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "OpenZeppelin/openzeppelin-contracts@4.0.0/contracts/token/ERC721/ERC721.sol";

contract MarketPlace{

    event OfferingPlaced(bytes32 indexed offeringId, address indexed hostContract, address indexed offerer,  uint tokenId, uint price, string uri);
    event OfferingClosed(bytes32 indexed offeringId, address indexed buyer);
    event BalanceWithdrawn (address indexed beneficiary, uint amount);
    event OperatorChanged (address previousOperator, address newOperator);

    address operator;
    uint offeringNonce;

    struct offering {
        address offerer;
        address hostContract;
        uint tokenId;
        uint price;
        bool closed; 
    }
    
    mapping (bytes32 => offering) offeringRegistry;
    mapping (address => uint) balances;

    constructor (address _operator) {
        operator = _operator;
    }

    function placeOffering (address _offerer, address _hostContract, uint _tokenId, uint _price) external {
        require (msg.sender == operator, "Only operator dApp can create offerings");
        bytes32 offeringId = keccak256(abi.encodePacked(offeringNonce, _hostContract, _tokenId));
        offeringRegistry[offeringId].offerer = _offerer;
        offeringRegistry[offeringId].hostContract = _hostContract;
        offeringRegistry[offeringId].tokenId = _tokenId;
        offeringRegistry[offeringId].price = _price;
        offeringNonce += 1;
        ERC721 hostContract = ERC721(offeringRegistry[offeringId].hostContract);
        string memory uri = hostContract.tokenURI(_tokenId);
        emit  OfferingPlaced(offeringId, _hostContract, _offerer, _tokenId, _price, uri);
    }
    
    function closeOffering(bytes32 _offeringId) external payable {
        require(msg.value >= offeringRegistry[_offeringId].price, "Not enough funds to buy");
        require(offeringRegistry[_offeringId].closed != true, "Offering is closed");
        ERC721 hostContract = ERC721(offeringRegistry[_offeringId].hostContract);
        offeringRegistry[_offeringId].closed = true;
        balances[offeringRegistry[_offeringId].offerer] += msg.value;
        hostContract.safeTransferFrom(offeringRegistry[_offeringId].offerer, msg.sender, offeringRegistry[_offeringId].tokenId);
        emit OfferingClosed(_offeringId, msg.sender);
    } 

    function withdrawBalance() external {
        require(balances[msg.sender] > 0,"You don't have any balance to withdraw");
        uint amount = balances[msg.sender];
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit BalanceWithdrawn(msg.sender, amount);
    }

    function changeOperator(address _newOperator) external {
        require(msg.sender == operator,"only the operator can change the current operator");
        address previousOperator = operator;
        operator = _newOperator;
        emit OperatorChanged(previousOperator, operator);
    }

    function viewOfferingNFT(bytes32 _offeringId) external view returns (address, uint, uint, bool){
        return (offeringRegistry[_offeringId].hostContract, offeringRegistry[_offeringId].tokenId, offeringRegistry[_offeringId].price, offeringRegistry[_offeringId].closed);
    }

    function viewBalances(address _address) external view returns (uint) {
        return (balances[_address]);
    }

}
