import {IConnextHandler} from "@connext/nxtp-contracts/contracts/core/connext/interfaces/IConnextHandler.sol";
import {CallParams, XCallArgs} from "@connext/nxtp-contracts/contracts/core/connext/libraries/LibConnextStorage.sol";

/**
 * @title Source
 * @notice Example contract for cross-domain calls (xcalls).
 */
contract Source {
    event UpdateInitiated(address to, uint256 newValue, bool permissioned);
    event CallbackCalled(bytes32 transferId, bool success, uint256 newValue);

    IConnextHandler public immutable connext;
    uint256 depositValue = 100 ether;

    constructor(IConnextHandler _connext) {
        connext = _connext;
    }

    /**
   * Cross-domain update of a value on a target contract.
   @dev Initiates the Connext bridging flow with calldata to be used on the target contract.
   */
    function addCommitment(
        address to,
        address asset,
        uint32 originDomain,
        uint32 destinationDomain,
        uint256 newValue
    ) external payable {
        bytes4 selector;
        bool forceSlow;

        // Encode function of the target contract (from Target.sol)
        //IERC20(asset).transferFrom(msg.sender, address(this), depositValue);
        selector = bytes4(keccak256("addCommitment(uint256)"));
        forceSlow = true;

        bytes memory callData = abi.encodeWithSelector(selector, newValue);

        CallParams memory callParams = CallParams({
            to: to,
            callData: callData,
            originDomain: originDomain,
            destinationDomain: destinationDomain,
            recovery: to, // fallback address to send funds to if execution fails on destination side
            callback: address(this), // this contract implements the callback
            callbackFee: 0, // fee paid to relayers; relayers don't take any fees on testnet
            forceSlow: forceSlow, // option to force Nomad slow path (~30 mins) instead of paying 0.05% fee
            receiveLocal: false // option to receive the local Nomad-flavored asset instead of the adopted asset
        });

        XCallArgs memory xcallArgs = XCallArgs({
            params: callParams,
            transactingAssetId: asset,
            amount: depositValue, // no amount sent with this calldata-only xcall
            relayerFee: 0 // fee paid to relayers; relayers don't take any fees on testnet
        });

        connext.xcall(xcallArgs);

        emit UpdateInitiated(to, newValue, true);
    }

    /**
   * Callback function required for contracts implementing the ICallback interface.
   @dev This function is called to handle return data from the destination domain.
   */
    function callback(
        bytes32 transferId,
        bool success,
        bytes memory data
    ) external {
        uint256 newValue = abi.decode(data, (uint256));
        emit CallbackCalled(transferId, success, newValue);
    }
}
