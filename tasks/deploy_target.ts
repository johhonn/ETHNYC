import { Contract } from 'ethers'
import { task, types } from 'hardhat/config'
import { poseidon_gencontract as poseidonContract } from 'circomlibjs'
//n/a
const RinkebyConnextHandler = '0x2307Ed9f152FA9b3DcDfe2385d279D8C2A9DF2b0'
const Origin = '0xF4B9bfB371BbFA0d1D2c56f712f766652BCd1859'

//n-of-m source contract deployments
const KovanConnextHandler = '0x3366A61A701FA84A86448225471Ec53c5c4ad49f'

task('deploy_target', '')
  .addOptionalParam<boolean>('logs', 'Print the logs', true, types.boolean)
  .setAction(
    async ({ logs }, hre): Promise<Contract | void> => {
      const poseidonABI = poseidonContract.generateABI(2)
      const poseidonBytecode = poseidonContract.createCode(2)
      hre.run('compile')
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

      let target
      const TargetContractInstance = await hre.ethers.getContractFactory(
        'Target',
        {
          libraries: {
            IncrementalBinaryTree: incrementalBinaryTreeLib.address,
          },
        },
      )
      if (hre.network.name === 'rinkeby') {
        target = await TargetContractInstance.deploy(
          instance.address,
          RinkebyConnextHandler,
          Origin,
        )
      } else if (hre.network.name === 'kovan') {
        target = await TargetContractInstance.deploy(
          instance.address,
          KovanConnextHandler,
          Origin,
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
