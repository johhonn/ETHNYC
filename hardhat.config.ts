import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import * as dotenv from 'dotenv'
import 'hardhat-gas-reporter'
import 'hardhat-dependency-compiler'
import { HardhatUserConfig } from 'hardhat/config'
import './tasks/deploy_source'
import './tasks/deploy_target'
dotenv.config()

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: '0.8.11',
  dependencyCompiler: {
    paths: ['@semaphore-protocol/contracts/verifiers/Verifier20.sol'],
  },
  networks: {
    goerli: {
      url: process.env.GOERLI_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 90000000000,
    },
    rinkeby: {
      url: process.env.RINKEBY_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
}

export default config
