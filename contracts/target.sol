//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@semaphore-protocol/contracts/interfaces/IVerifier.sol";
import "@semaphore-protocol/contracts/base/SemaphoreCore.sol";
import "@semaphore-protocol/contracts/base/SemaphoreGroups.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {IConnextHandler} from "@connext/nxtp-contracts/contracts/core/connext/interfaces/IConnextHandler.sol";
import {CallParams, XCallArgs} from "@connext/nxtp-contracts/contracts/core/connext/libraries/LibConnextStorage.sol";
import {IExecutor} from "@connext/nxtp-contracts/contracts/core/connext/interfaces/IExecutor.sol";

contract target is SemaphoreCore, SemaphoreGroups, Ownable {
    mapping(uint256 => uint256) public groupDeposits;
    uint256 total;
    // The external verifier used to verify Semaphore proofs.
    IVerifier public verifier;
    address public originContract;

    // The origin Domain ID
    uint32 public originDomain;
    IConnextHandler public immutable connext;
    IExecutor public executor;
    // A modifier for permissioned function calls.
    // Note: This is an important security consideration. If your target
    //       contract function is meant to be permissioned, it must check
    //       that the originating call is from the correct domain and contract.
    //       Also, check that the msg.sender is the Connext Executor address.
    modifier onlyExecutor() {
        require(
            IExecutor(msg.sender).originSender() == originContract &&
                IExecutor(msg.sender).origin() == originDomain &&
                msg.sender == address(executor),
            "Expected origin contract on origin domain called by Executor"
        );
        _;
    }

    constructor(address _verifier, IConnextHandler _connext) {
        verifier = IVerifier(_verifier);
        connext = _connext;
    }

    function createEntity(uint256 value) public override {
        _createGroup(total + 1, 20, 0);

        groupDeposits[total + 1] = value;
        total++;
    }

    function addCommitment(uint256 entityId, uint256 identityCommitment)
        public
        override
        onlyExecutor
    {
        _addMember(entityId, identityCommitment);
    }

    function withdraw(
        bytes32 _sig,
        uint256 nullifierHash,
        uint256[8] calldata _proof,
        uint256 entityId,
        address to,
        uint32 destinationDomain,
        address asset
    ) public {
        require(verify(_sig, nullifierHash, _proof, entityId), "");
        IERC20 token = IERC20(asset);

        // This contract approves transfer to Connext
        //token.approve(address(connext), amount);

        // Empty callData because this is a simple transfer of funds
        CallParams memory callParams = CallParams({
            to: to,
            callData: "", // empty here because we're only sending funds
            originDomain: originDomain,
            destinationDomain: destinationDomain,
            recovery: to, // fallback address to send funds to if execution fails on destination side
            callback: address(0), // zero address because we don't expect a callback
            callbackFee: 0, // fee paid to relayers; relayers don't take any fees on testnet
            forceSlow: false, // option to force Nomad slow path (~30 mins) instead of paying 0.05% fee
            receiveLocal: false // option to receive the local Nomad-flavored asset instead of the adopted asset
        });

        XCallArgs memory xcallArgs = XCallArgs({
            params: callParams,
            transactingAssetId: asset,
            amount: groupDeposits[entityId],
            relayerFee: 0 // fee paid to relayers; relayers don't take any fees on testnet
        });

        connext.xcall(xcallArgs);
    }

    function verify(
        bytes32 _sig,
        uint256 _nullifierHash,
        uint256[8] calldata _proof,
        uint256 entityId
    ) internal returns (bool) {
        uint8 depth = 20;
        uint256 root = getRoot(entityId);

        _verifyProof(_sig, root, _nullifierHash, entityId, _proof, verifier);

        // Prevent double-greeting (nullifierHash = hash(root + identityNullifier)).
        // Every user can greet once.
        _saveNullifierHash(_nullifierHash);
        return true;
    }
}
