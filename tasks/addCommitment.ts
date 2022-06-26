import { Contract } from "ethers";
import { id } from "ethers/lib/utils";
import { task, types } from "hardhat/config";

const KovanConnextHandler = "0x3366A61A701FA84A86448225471Ec53c5c4ad49f";

task("addCommitment", "")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs }, hre): Promise<Contract | void> => {
    const SourceContractInstance = await hre.ethers.getContractFactory(
      "Source"
    );

    const source = await SourceContractInstance.attach(KovanConnextHandler);
    const isDeployed = await source?.deployed();
    if (isDeployed) {
      source.addCommitment();
    }

    logs &&
      console.log(`Source contract has been deployed to: ${source?.address}`);

    if (source) {
      return source;
    }
  });
