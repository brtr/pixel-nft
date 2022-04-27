/**
* @type import('hardhat/config').HardhatUserConfig
*/

require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

const { API_URL, PRIVATE_KEY, API_KEY } = process.env;

module.exports = {
   solidity: "0.8.0",
   defaultNetwork: "matic",
   etherscan: {
      apiKey: API_KEY,
   },
   networks: {
      hardhat: {},
      matic: {
         url: API_URL,
         accounts: [PRIVATE_KEY]
      }
   },
}