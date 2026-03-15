require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  solidity: {
    version: '0.8.25',
    settings: { 
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'paris'
    },
  },
  networks: {
    ganache: {
      url: 'http://127.0.0.1:7545',
      chainId: 1337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 11155111,
    },
  },
};