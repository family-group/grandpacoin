const { generateNodeId } = require('../../utils/functions');
const Block = require('./Block');
const BigNumber = require('bignumber.js');
const moment = require('moment');


class Blockchain {
    constructor() {
        this.nodeId = generateNodeId();
        this.peers = {};
        this.initBlockchain();
    }

    initBlockchain() {
        this.chain = [];
        this.confirmedTransactions = [];
        this.confirmedTransactionsData = {}; // to store transactions history
        this.pendingTransactions = [];
        this.currentDifficulty = global.initialDifficulty;
        this.addresses = {};
        this.addressesIds = [];
        this.chain.push(Block.getGenesisBlock());
        this.blockNumber = 0;
        this.blockCandidates = {};
        this.totalBlockTime = 0;
    }

    getTransactionByHash(hash) {
        let transaction = this.pendingTransactions.find(txn => txn.transactionDataHash === hash)
        if (!transaction) {
            for (const block of this.chain) {
                transaction = block.transactions.find(txn => txn.transactionDataHash === hash)
                if (transaction) break;
            }
        }
        return transaction;
    }

    getcumulativeDifficult() {
        return this.chain.reduce((cumulativeDifficulty, block) => {
            return new BigNumber(16)
                .exponentiatedBy(block.difficulty)
                .plus(cumulativeDifficulty)
                .toString()
        }, "0");
    }

    addBlock(newBlock) {
        const lastBlockDate = this.getLastBlock().dateCreated;
        this.chain.push(newBlock);
        this.adjustDifficulty(newBlock.dateCreated, lastBlockDate);
        this.blockCandidates = {};
    }

    getBlockCandidate(blockDataHash) {
        return this.blockCandidates[blockDataHash];
    }

    storeBlockCandidate(blockCandidate) {
        this.blockCandidates = { ...this.blockCandidates, ...blockCandidate };
    }

    adjustDifficulty(newBlockDate, lastBlockDate) {
        if (this.chain.length > 1) {
            const lastBlockTime = BigNumber(moment(lastBlockDate).unix());
            const newBlockTime =  BigNumber(this.totalBlockTime).plus(moment(newBlockDate).unix());
            this.totalBlockTime = newBlockTime.toString();
        }
    }
    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }
}

const blockChain = new Blockchain();
module.exports = blockChain;
