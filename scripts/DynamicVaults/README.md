# Dynamic Vaults - Deposit Script

This directory contains scripts for interacting with Dynamic Vaults in the OpenTrade protocol.

## Overview

The `depositToDynamicVault.ts` script allows you to deposit tokens into a Dynamic Vault pool. The script handles the complete deposit workflow including token approval and balance verification.

## How Dynamic Vault Deposits Work

When you successfully deposit tokens into a Dynamic Vault, the contract will mint pool tokens to your wallet. These pool tokens represent your share of the vault's total assets.

**Important Note**: The number of pool tokens you receive might **not** be 1:1 with the amount you deposit. The actual amount of pool tokens minted depends on the vault's current **exchange rate**

For example:

- If you deposit 1000 USDC and the exchange rate is 1.05, you might receive approximately 952 pool tokens
- If the exchange rate is 0.98, you might receive approximately 1020 pool tokens

The `PoolDeposit` event in the script output will show you the exact number of shares (pool tokens) you received for your deposit.

## Prerequisites

1. **Node.js and npm/yarn** - Ensure you have Node.js installed
2. **Private Key** - You'll need a private key for the wallet that will perform the deposit
3. **Tokens** - Your wallet must have sufficient balance of the pool's liquidity asset (e.g., USDC)

   > **Note**: To access OpenTrade mock tokens for testing purposes, please contact our sales team.

4. **Network Access** - RPC access to the target blockchain network

   > **Resource**: You can find public RPC endpoints for various networks at [https://chainlist.org/](https://chainlist.org/). Though we recommend using a private one for reliability purposes.

## Setup

### 1. Install Dependencies

From the project root directory, install the required dependencies:

```bash
npm install
# or
yarn install
```

### 2. Environment Configuration

Create a `.env` file in the project root (if it doesn't exist) and add your private key:

```bash
PRIVATE_KEY=your_private_key_here
```

### 3. Script Configuration

Before running the script, you may need to update the following constants in `depositToDynamicVault.ts`:

#### Required Configuration:

- **`POOL_DYNAMIC_ADDRESS`**: Set this to the address of the Dynamic Vault you want to deposit into
- **`RPC_PROVIDER_URL`**: Update with your network's RPC endpoint

#### Current Configuration:

```typescript
const POOL_DYNAMIC_ADDRESS = "0xc03B8490636055D453878a7bD74bd116d0051e4B";
const RPC_PROVIDER_URL = "https://sepolia.gateway.tenderly.co";
```

#### Deposit Amount:

The script is currently configured to deposit 1000 tokens with 6 decimals:

```typescript
const depositAmount = 1000n * 1000000n; // 1000 tokens with 6 decimals
```

You can modify this value based on your needs.

## Required ABI Files

Ensure the following ABI files exist in the project root's `abi/` directory:

- `PoolDynamic.json` - ABI for the Dynamic Pool contract
- `ERC20.json` - Standard ERC20 token ABI

**Note**: These files should already be present in the project. The script automatically imports them from `../../abi/` relative to the script location.

## Execution

### Running the Script

From the project root directory, execute:

```bash
npx ts-node scripts/DynamicVaults/depositToDynamicVault.ts
```

Or if you have TypeScript installed globally:

```bash
ts-node scripts/DynamicVaults/depositToDynamicVault.ts
```

### Expected Output

The script will output detailed logs showing:

1. **Initial Setup**: Wallet address and deposit amount
2. **Asset Information**: Liquidity asset address, symbol, and decimals
3. **Balance Check**: Initial token balance verification
4. **Approval**: Token approval transaction for the pool
5. **Deposit**: The actual deposit transaction
6. **Event Logs**: PoolDeposit event details
7. **Final Balances**: Updated balances after deposit

### Example Output:

```
Starting Dynamic Chain Deposit...
Wallet address: 0x1234...
Deposit amount: 1000000000 tokens (with appropriate decimals)

--- Step 1: Fetching liquidity asset address ---
Liquidity asset address: 0x5678...
Token symbol: USDC
Token decimals: 6

--- Step 2: Checking initial liquidity asset balance ---
Initial USDC balance: 5000000000

--- Step 3: Approving USDC spend ---
Approve transaction hash: 0xabc123...
Approve transaction confirmed in block: 12345

--- Step 4: Performing deposit ---
Deposit transaction hash: 0xdef456...
Deposit transaction confirmed in block: 12346

✅ Dynamic Chain Deposit completed successfully!
```

## Troubleshooting

### Common Issues:

1. **Insufficient Balance**: Ensure your wallet has enough of the liquidity asset
2. **Network Issues**: Verify your RPC URL is correct and accessible
3. **Gas Issues**: Ensure your wallet has enough ETH/native tokens for gas fees
4. **Contract Issues**: Verify the pool address is correct and the pool is active

### Error Messages:

- **"Insufficient balance"**: Your wallet doesn't have enough tokens for the deposit
- **"Transaction reverted"**: Could indicate issues with pool state, approvals, or gas
- **"Network error"**: Check your RPC configuration and internet connection

## Security Considerations

- Never share your private key
- Test with small amounts first
- Verify contract addresses before interacting
- Use testnet for development and testing

## Support

For additional help or questions about the Dynamic Vaults system, refer to the main project documentation or contact the development team.
