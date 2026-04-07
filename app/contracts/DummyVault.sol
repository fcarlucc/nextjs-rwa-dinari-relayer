// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { SignatureChecker } from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import { IERC1271 } from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DummyVault is IERC1271 {
    address public immutable owner;
    bytes32 private immutable _DOMAIN_SEPARATOR;

    error Unauthorized();
    error CallFailed();

    constructor() {
        owner = msg.sender;
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("NexLabsVault")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @dev EIP-1271: Allows Dinari to verify that the Vault authorized an order.
     */
    function isValidSignature(bytes32 _hash, bytes memory _signature) public view override returns (bytes4) {
        if (SignatureChecker.isValidSignatureNow(owner, _hash, _signature)) {
            return IERC1271.isValidSignature.selector;
        }
        return 0xffffffff;
    }

    /**
     * @dev EXECUTION LOGIC: 
     * Allows the owner to interact with Dinari or DEXs through the Vault.
     */
    function execute(address target, uint256 value, bytes calldata data) external returns (bytes memory) {
        if (msg.sender != owner) revert Unauthorized();
        
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) revert CallFailed();
        
        return result;
    }

    /**
     * @dev Helper to check ERC20 balances directly in the vault
     */
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // Allow the vault to receive ETH
    receive() external payable {}
}