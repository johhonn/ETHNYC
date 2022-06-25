import { Contract } from 'ethers'
import { task, types } from 'hardhat/config'
import { poseidon_gencontract as poseidonContract } from 'circomlibjs'
const RinkebyConnextHandler = '0x2307Ed9f152FA9b3DcDfe2385d279D8C2A9DF2b0'
const RinkebyConnextExecutor = '0xB17Be17999ED91C8829554CBb1C1CcB1c8CD8134'
const GoerliConenxtHandler = '0xEC3A723DE47a644b901DC269829bf8718F175EBF'
const GoerliConnextExecutor = ''
task('deploy_target', '')
  .addOptionalParam<boolean>('logs', 'Print the logs', true, types.boolean)
  .setAction(
    async ({ logs }, hre): Promise<Contract | void> => {
      const poseidonABI = poseidonContract.generateABI(2)
      const poseidonBytecode = poseidonContract.createCode(2)

      const [signer] = await hre.ethers.getSigners()

      const PoseidonLibFactory = new hre.ethers.ContractFactory(
        poseidonABI,
        poseidonBytecode,
        signer,
      )
      const poseidonLib = await PoseidonLibFactory.deploy()

      const Verifier20 = await hre.ethers.getContractFactory('Verifier20')
      const instance = await Verifier20.deploy()

      await instance.deployed()

      logs &&
        console.log(
          `verfier contract has been deployed to: ${instance.address}`,
        )

      await poseidonLib.deployed()
      logs &&
        console.log(
          `Poseidon library has been deployed to: ${poseidonLib.address}`,
        )
      console.log('deploying')
      const IncrementalBinaryTreeLibFactory = await hre.ethers.getContractFactory(
        'IncrementalBinaryTree',
        {
          libraries: {
            PoseidonT3: poseidonLib.address,
          },
        },
      )

      const incrementalBinaryTreeLib = await IncrementalBinaryTreeLibFactory.deploy()

      await incrementalBinaryTreeLib.deployed()

      logs &&
        console.log(
          `IncrementalBinaryTree library has been deployed to: ${incrementalBinaryTreeLib.address}`,
        )

      const chainID = hre.network.config.chainId
      let target
      const TargetContractInstance = await hre.ethers.getContractFactory(
        'Target',
        {
          libraries: {
            IncrementalBinaryTree: incrementalBinaryTreeLib.address,
          },
        },
      )
      if (chainID === 4) {
        target = await TargetContractInstance.deploy(
          instance.address,
          RinkebyConnextHandler,
          RinkebyConnextExecutor,
        )
      } else if (chainID === 5) {
        target = await TargetContractInstance.deploy(
          instance.address,
          GoerliConenxtHandler,
          GoerliConnextExecutor,
          {
            libraries: {
              IncrementalBinaryTree: incrementalBinaryTreeLib.address,
            },
          },
        )
      }

      await target?.deployed()

      logs &&
        console.log(`Target contract has been deployed to: ${target?.address}`)

      if (target) {
        return target
      }
    },
  )
