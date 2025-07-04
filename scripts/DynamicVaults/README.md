# Dynamic Vaults - Deposit & Withdraw Scripts

This directory contains scripts for interacting with Dynamic Vaults in the OpenTrade protocol.

## Overview

This directory includes two main scripts:

- `depositToDynamicVault.ts` - Deposit tokens into a Dynamic Vault pool
- `withdrawFromDynamicVault.ts` - Request withdrawal from a Dynamic Vault pool

Both scripts handle the complete workflows for their respective operations including token approval, balance verification, and transaction processing.

## How Dynamic Vaults Work

### Deposits

When you successfully deposit tokens into a Dynamic Vault, the contract will mint pool tokens to your wallet. These pool tokens represent your share of the vault's total assets.

**Important Note**: The number of pool tokens you receive might **not** be 1:1 with the amount you deposit. The actual amount of pool tokens minted depends on the vault's current **exchange rate**

For example:

- If you deposit 1000 USDC and the exchange rate is 1.05, you might receive approximately 952 pool tokens
- If the exchange rate is 0.98, you might receive approximately 1020 pool tokens

The `PoolDeposit` event in the script output will show you the exact number of shares (pool tokens) you received for your deposit.

### Withdrawals

Dynamic Vault withdrawals are **asynchronous** and require multiple steps:

1. **Request Redemption**: You submit a withdrawal request for a specific number of pool tokens
2. **Borrower Manager Approval**: The borrower manager must accept your redemption request
3. **Pool Admin Repayment**: The pool admin completes the withdrawal by transferring the liquidity assets

**Important**: The withdrawal process does **not** execute immediately. Your request will be pending until both the borrower manager and pool admin complete their respective steps.

## Prerequisites

1. **Node.js and npm/yarn** - Ensure you have Node.js installed
2. **Private Key** - You'll need a private key for the wallet that will perform operations
3. **Tokens** - For deposits, your wallet must have sufficient balance of the pool's liquidity asset (e.g., USDC)
   > **Note**: To access OpenTrade mock tokens for testing purposes, please contact our sales team.
4. **Pool Tokens** - For withdrawals, your wallet must have pool tokens from previous deposits. You can get these by performing a deposit

5. **Network Access** - RPC access to the target blockchain network

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

Before running each scripts, you may need to update the following constants:

#### Required Configuration:

- **`POOL_DYNAMIC_ADDRESS`**: Set this to the address of the Dynamic Vault you want to interact with
- **`RPC_PROVIDER_URL`**: Update with your network's RPC endpoint

#### Deposit Amount Configuration:

The deposit script is currently configured to deposit 1000 tokens with 6 decimals:

```typescript
const depositAmount = 1n * 1000000n; // 1000 tokens with 6 decimals
```

#### Withdraw Amount Configuration:

The withdraw script is currently configured to withdraw 20000 pool token shares:

```typescript
const withdrawAmount = 20000n; // 20000 shares
```

You can modify these values based on your needs.

## Required ABI Files

Ensure the following ABI files exist in the project root's `abi/` directory:

- `PoolDynamic.json` - ABI for the Dynamic Pool contract
- `ERC20.json` - Standard ERC20 token ABI (required for deposits)

**Note**: These files should already be present in the project. The scripts automatically import them from `../../abi/` relative to the script location.

## Execution

### Running the Deposit Script

From the project root directory, execute:

```bash
npx ts-node scripts/DynamicVaults/depositToDynamicVault.ts
```

### Running the Withdraw Script

From the project root directory, execute:

```bash
npx ts-node scripts/DynamicVaults/withdrawFromDynamicVault.ts
```

## Expected Output

### Deposit Script Output

The deposit script will output detailed logs showing:

1. **Initial Setup**: Wallet address and deposit amount
2. **Asset Information**: Liquidity asset address, symbol, and decimals
3. **Balance Check**: Initial token balance verification
4. **Approval**: Token approval transaction for the pool
5. **Deposit**: The actual deposit transaction
6. **Event Logs**: PoolDeposit event details
7. **Final Balances**: Updated balances after deposit

#### Example Deposit Output:

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

--- Step 4: Performing deposit ---
Deposit transaction hash: 0xdef456...

✅ Dynamic Chain Deposit completed successfully!
```

### Withdraw Script Output

The withdraw script will output detailed logs showing:

1. **Initial Setup**: Wallet address and withdraw amount
2. **Balance Check**: Current pool token balance verification
3. **Redemption Request**: Transaction submitting the withdrawal request
4. **Event Details**: RedeemRequested event with UUID and asset information
5. **Next Steps**: Instructions for completing the withdrawal process

#### Example Withdraw Output:

```
--- Dynamic Withdraw Example ---
Wallet address: 0x1234...
Withdraw amount: 20000 shares

--- Step 1: Checking current pool token balance ---
Pool tokens owned: 50000

--- Step 2: Requesting redemption of 20000 shares ---
✅ Redemption request submitted!
Transaction hash: 0xabc123...

--- Step 3: Checking redemption request event ---
🎉 RedeemRequested event found:
  Lender: 0x1234...
  Assets: 19500
  Shares: 20000
  UUID: 0xdef456...

--- Next Steps (Performed by OpenTrade) ---
1. The borrower manager needs to call acceptRedemption() with your address and UUID
2. The pool admin needs to call repayRedemption() to complete the withdrawal
3. You will receive the liquidity asset tokens in your wallet

--- Important Information ---
Redemption UUID: 0xdef456...
Expected assets: 19500
Save this UUID - it will be needed for the acceptance and repayment steps

✅ Script completed successfully!
```

## Troubleshooting

### Common Issues:

#### Deposit Issues:

- **Insufficient Balance**: Ensure your wallet has enough of the liquidity asset
- **Approval Failed**: Check if the token approval transaction succeeded
- **Pool Type Error**: Verify you're using a Dynamic Pool address (poolType should return 2)

#### Withdraw Issues:

- **No Pool Tokens**: Ensure you have pool tokens from previous deposits
- **Insufficient Shares**: Check that you have enough pool tokens for the withdrawal amount
- **Pending Requests**: Remember that withdrawals require manual approval steps

#### General Issues:

- **Network Issues**: Verify your RPC URL is correct and accessible
- **Gas Issues**: Ensure your wallet has enough ETH/native tokens for gas fees
- **Contract Issues**: Verify the pool address is correct and the pool is active

### Error Messages:

- **"Insufficient balance"**: Your wallet doesn't have enough tokens for the operation
- **"Transaction reverted"**: Could indicate issues with pool state, approvals, or gas
- **"Network error"**: Check your RPC configuration and internet connection
- **"This is not a Dynamic Pool"**: Verify you're using the correct pool address

## Important Notes

### Withdrawal Process

- **Asynchronous Nature**: Withdrawals are not immediate and require approval from OpenTrade team members
- **UUID Tracking**: Always save the redemption UUID for tracking purposes
- **No Immediate Balance Changes**: Your liquidity asset balance won't change until the withdrawal is fully processed

### Security Considerations

- Never share your private key
- Test with small amounts first
- Verify contract addresses before interacting
- Use testnet for development
- Keep withdrawal UUIDs secure and accessible

## Support

For additional help or questions about the Dynamic Vaults system, refer to the main project documentation or contact the development team.
