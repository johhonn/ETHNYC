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
    mapping(uint256 => uint256[]) public groupCommitments;
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

    constructor(
        address _verifier,
        IConnextHandler _connext,
        address _executor
    ) {
        verifier = IVerifier(_verifier);
        connext = _connext;
        executor = IExecutor(_executor);
        createEntity(10**18);
        createEntity(5 * 10**18);
    }

    function createEntity(uint256 value) public {
        total++;
        _createGroup(total, 20, 0);

        groupDeposits[total] = value;
    }

    function addCommitment(uint256 identityCommitment) public onlyExecutor {
        //default to pool one
        _addMember(1, identityCommitment);
        groupCommitments[1].push(identityCommitment);
    }

    function addTestCommitment(uint256 entity, uint256 identityCommitment)
        public
    {
        //default to pool one
        groupCommitments[entity].push(identityCommitment);
        _addMember(entity, identityCommitment);
    }

    function getTreeInfo(uint256 id) public view returns (uint256[], uint256) {
        return (groupCommitments[id], getRoot(id));
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

    function verifyTest(
        bytes32 _sig,
        uint256 _nullifierHash,
        uint256[8] calldata _proof,
        uint256 entityId
    ) public view {
        uint256 root = getRoot(entityId);

        _verifyProof(_sig, root, _nullifierHash, entityId, _proof, verifier);
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
