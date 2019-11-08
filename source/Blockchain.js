const generateNodeId = require('../utils/functions').generateNodeId;
const Block = require('./Block');
const globalConfigs = require('../global');


class Blockchain {
    constructor() {
        this.nodeId = generateNodeId();
        this.peers = [];
        this.initBlockchain();
        this.getBlockByIndex = this.getBlockByIndex.bind(this);
        this.resetChain = this.resetChain.bind(this);
        this.getBlocks = this.getBlocks.bind(this);
        this.getAddressesBalances = this.getAddressesBalances.bind(this);
        this.getTransactionByHash = this.getTransactionByHash.bind(this);
        this.getBlockByIndex = this.getBlockByIndex.bind(this);
        this.getInfo = this.getInfo.bind(this);
        this.debug = this.debug.bind(this);
    }

    initBlockchain() {
        this.chain = [];
        this.pendingTransactions = [];
        this.confirmedTransactions = [];
        this.currentDifficulty = globalConfigs.initialDifficulty;
        this.cumulativeDifficulty = 0;
        this.addresses = [];
        this.nodes = [];

        this.chain.push(new Block({
            index: 0,
            prevBlockHash: '0',
            previousDifficulty: 0,
            pendingTransactions: this.pendingTransactions,
            nonce: 0,
            minedBy: '00000000000000000000000000000000',
        }));
    }

    getBlockByIndex(req, response) {
        if (!req.params.index || !this.chain[req.params.index]) {
            return response
                .status(404)
                .json({ message: 'Block not found' });
        }
        return response.json(this.chain[req.params.index]);
    }

    resetChain({ res }) {
        this.initBlockchain();
        return res
            .status(200)
            .json({ message: 'The chain was reset to its genesis block.' });
    }

    getBlocks({ res }) {
        return res
            .status(200)
            .json(this.chain);
    }
    getPendingTransactions({ res }) {
        return res
            .status(200)
            .json(this.pendingTransactions);
    }
    getConfirmedTransactions({ res }) {
        return res
            .status(200)
            .json(this.confirmedTransactions);
    }
    addBlockToChain(req) {
        new Block({
            index: this.chain.length,
            prevBlockHash: this.chain[this.chain.length - 1].blockHash,
            previousDifficulty: this.chain[this.chain.length - 1].difficulty,
            pendingTransactions: this.pendingTransactions, 
            minedBy: req.params.minerAddress
        });
    }

    getInfo({ res }) {
        return res.json({
            about: globalConfigs.appName,
            nodeId: this.nodeId,
            peers: this.peers,
            chainId: this.chain[0].blockHash,
            nodeUrl: req.protocol + '://' + req.get('host'),
            currentDifficult: this.currentDifficulty,
            blocksCount: this.chain.length,
            cumulativeDifficulty: this.cumulativeDifficulty,
            confirmedTransactions: this.confirmedTransactions.length,
            pendingTransactions: this.pendingTransactions.length,
        });
    }

    debug({ res }) {
        return res.json({
            selfUrl: req.protocol + '://' + req.get('host'),
            nodeId: this.nodeId,
            peers: this.peers,
            transactions: this.confirmedTransactions,
            currentDifficult: this.currentDifficulty,
            blocksCount: this.chain.length,
            cumulativeDifficulty: this.cumulativeDifficulty,
            confirmedTransactions: this.confirmedTransactions.length,
            pendingTransactions: this.pendingTransactions.length,
            chain: {
                blocks: this.chain,
                prevBlockHash: this.chain,
            },
        });
    }

    getAddressesBalances() {
        let addresses = this.addresses;
        let addressesInfo = null;
        if (addresses.length > 0) {
            addressesInfo = addresses.filter(({ confirmedBalance }) => confirmedBalance !== 0)
                .map(({ address, safeBalance }) => {
                    return {
                        [address]: safeBalance
                    };
                });
        }
        if (addressesInfo) {
            return response.send({ addressesBalances: addressesInfo });
        }
        return response.status(400).send({ message: 'No Addresses Found' })
    }

    

    getTransactionByHash(request, response) {
        const hash = request.params.hash;

        if (!/^0x([A-Fa-f0-9]{64})$/.test(hash)) {
            return response
                .status(400)
                .json({ message: 'Invalid transaction hash' })
        }

        let transaction = this.confirmedTransactions.find(txn => txn.transactionDataHash === hash)

        if (transaction) return response.status(200).json(transaction)

        transaction = this.pendingTransactions.find(txn => txn.transactionDataHash === hash)

        if (transaction) return response.status(200).json(transaction)

        return response
            .status(404)
            .json({ message: 'Transaction not found' })
    }
}

module.exports = Blockchain;