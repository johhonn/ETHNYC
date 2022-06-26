import { Contract } from 'ethers'
import { task, types } from 'hardhat/config'

const RinkebyConnextHandler = '0x2307Ed9f152FA9b3DcDfe2385d279D8C2A9DF2b0'
const KovanConnextHandler = '0x3366A61A701FA84A86448225471Ec53c5c4ad49f'

task('deploy_source', '')
  .addOptionalParam<boolean>('logs', 'Print the logs', true, types.boolean)
  .setAction(
    async ({ logs }, hre): Promise<Contract | void> => {
      const SourceContractInstance = await hre.ethers.getContractFactory(
        'Source',
      )
      hre.run('compile')
      const chainID = hre.network.config.chainId
      console.log(hre.network.name)
      console.log(chainID)
      let source
      if (hre.network.name === 'rinkeby') {
        source = await SourceContractInstance.deploy(RinkebyConnextHandler)
      } else if (hre.network.name === 'kovan') {
        source = await SourceContractInstance.deploy(KovanConnextHandler)
      }

      await source?.deployed()

      logs &&
        console.log(`Source contract has been deployed to: ${source?.address}`)

      if (source) {
        return source
      }
    },
  )
