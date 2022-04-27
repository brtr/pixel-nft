#### Local setup

To run this project locally, follow these steps.

1. Clone the project locally, change into the directory, and install the dependencies:

```sh
git clone https://github.com/brtr/techbay_cat.git

cd techbay_cat

# install using NPM or Yarn
npm install

# or

yarn
```

2. Compile contract

```sh
npx hardhat compile
```

3. Deploy contract

```sh
npx hardhat run scripts/deploy.js
```

4. Mint NFT

```sh
npx hardhat run scripts/mint.js
```

### Configuration
To deploy to Polygon test or main networks, update the configurations located in __.env__ to use a private key and, optionally, deploy to a private RPC like Infura or Alchemy.


### Verify contract
[guide](https://forum.openzeppelin.com/t/verify-erc20-token-on-etherscan-that-was-deployed-through-remix-step-by-step-guide/9051)




