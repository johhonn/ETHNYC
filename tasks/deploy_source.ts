import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree"
import { poseidon } from "circomlibjs"
import { Contract } from "ethers"
import { task, types } from "hardhat/config"
import hre from "hardhat"
import identityCommitments from "../public/identityCommitments.json"


const RinkebyConnextHandler = "0x2307Ed9f152FA9b3DcDfe2385d279D8C2A9DF2b0";
const GoerliConenxtHandler = "0xEC3A723DE47a644b901DC269829bf8718F175EBF"

task("deploy-source", "")
    .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
    .setAction(async ({ logs }, { ethers }): Promise<Contract | void> => {
        const SourceContract = await ethers.getContractFactory("Source");
        const Source = await SourceContract.deploy()

        await Source.deployed();

        logs && console.log(`Source contract has been deployed to: ${Source.address}`)

        const SourceContractInstance = await ethers.getContractFactory("Source")

        const chainID = hre.network.config.chainId;
        let source;
        if ( chainID === 4) {
            source = await SourceContractInstance.deploy(RinkebyConnextHandler);
        } else if (chainID === 5) {
            source = await SourceContractInstance.deploy(GoerliConenxtHandler);
        }

        await source?.deployed()

        logs && console.log(`Source contract has been deployed to: ${source?.address}`);

        if (source) { return source };
    })
