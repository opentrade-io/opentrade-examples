import * as dotenv from "dotenv";
import { Contract, JsonRpcProvider, Wallet } from "ethers";

// Pool Address. You can pick pool address listed in the app (Note: Some sandbox listed pools are Flex Vaults, try to pick a Dynamic Vault)
const POOL_DYNAMIC_ADDRESS = "0xc03B8490636055D453878a7bD74bd116d0051e4B";
// NOTE: Change this to the RPC provider URL for your network (e.g. sepolia, Fuji, Plume Testnet, etc.)
export const RPC_PROVIDER_URL = "https://eth-sepolia.g.alchemy.com/v2/oHCT97GjJyLp6TwUMjZdOGPAqDnr9gu6";

const URL = RPC_PROVIDER_URL;

// Import ABIs - you'll need to ensure these files exist
const PoolDynamicABI = require("../../abi/PoolDynamic.json").abi;
const ERC20ABI = require("../../abi/ERC20.json").abi;

function init() {
  dotenv.config();
}

async function dynamicChainDeposit(depositAmount: bigint) {
  console.log("Starting Dynamic Chain Deposit...");

  const provider = new JsonRpcProvider(URL);
  const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider);

  console.log("Wallet address:", wallet.address);
  console.log("Deposit amount:", depositAmount.toString(), "tokens (with appropriate decimals)");

  // Initialize PoolDynamic contract
  const poolDynamicContract = new Contract(POOL_DYNAMIC_ADDRESS, PoolDynamicABI, wallet);

  try {
    // Step 0: Verify this is indeed a Dynamic Pool
    console.log("\n--- Step 0: Verifying pool type ---");
    const poolType = await poolDynamicContract.poolType();
    console.log("Pool type:", poolType.toString());

    if (poolType !== 2n) {
      console.error(
        "❌ Error: This is not a Dynamic Pool! Expected poolType() to return 2, but got:",
        poolType.toString()
      );
      console.error("Please ensure you're using a Dynamic Pool address, not a Flex Pool or other pool type.");
      return;
    }
    console.log("✅ Confirmed: This is a Dynamic Pool");

    // Step 1: Fetch the liquidity asset address from the pool
    console.log("\n--- Step 1: Fetching liquidity asset address ---");
    const liquidityAssetAddress = await poolDynamicContract.liquidityAssetAddr();
    console.log("Liquidity asset address:", liquidityAssetAddress);

    // Initialize the liquidity asset (USDC) contract
    const liquidityAssetContract = new Contract(liquidityAssetAddress, ERC20ABI, wallet);

    // Get token symbol and decimals for better logging
    const tokenSymbol = await liquidityAssetContract.symbol();
    const tokenDecimals = await liquidityAssetContract.decimals();
    console.log("Token symbol:", tokenSymbol);
    console.log("Token decimals:", tokenDecimals);

    // Step 2: Check initial liquidity asset balance
    console.log("\n--- Step 2: Checking initial liquidity asset balance ---");
    const initialBalance = await liquidityAssetContract.balanceOf(wallet.address);
    console.log(`Initial ${tokenSymbol} balance:`, initialBalance.toString());

    // Step 3: Check if we have enough tokens
    if (initialBalance < depositAmount) {
      console.log(`Insufficient ${tokenSymbol} balance for deposit.`);
      console.log("Required:", depositAmount.toString(), "Available:", initialBalance.toString());
      return;
    }

    // Step 4: Approve the pool to spend tokens
    console.log(`\n--- Step 3: Approving ${tokenSymbol} spend ---`);
    const approveTx = await liquidityAssetContract.approve(POOL_DYNAMIC_ADDRESS, depositAmount);
    console.log("Approve transaction hash:", approveTx.hash);
    const approveReceipt = await approveTx.wait();
    console.log("Approve transaction confirmed in block:", approveReceipt?.blockNumber);

    // Verify allowance
    const allowance = await liquidityAssetContract.allowance(wallet.address, POOL_DYNAMIC_ADDRESS);
    console.log("Allowance set:", allowance.toString());

    // Step 5: Perform the deposit
    console.log("\n--- Step 4: Performing deposit ---");
    const depositTx = await poolDynamicContract.deposit(depositAmount, wallet.address);
    console.log("Deposit transaction hash:", depositTx.hash);
    const depositReceipt = await depositTx.wait();
    console.log("Deposit transaction confirmed in block:", depositReceipt?.blockNumber);

    // Step 6: Find and decode the PoolDeposit event
    console.log("\n--- Step 5: Checking deposit event ---");
    const poolDepositEvent = depositReceipt?.logs?.find((log: { topics: string[]; data: string }) => {
      try {
        const parsedLog = poolDynamicContract.interface.parseLog(log);
        return parsedLog?.name === "PoolDeposit";
      } catch {
        return false;
      }
    });

    if (poolDepositEvent) {
      const decodedEvent = poolDynamicContract.interface.parseLog(poolDepositEvent);
      console.log("PoolDeposit event found:");
      console.log("  Lender:", decodedEvent?.args?.lender);
      console.log("  Assets:", decodedEvent?.args?.assets?.toString());
      console.log("  Shares:", decodedEvent?.args?.shares?.toString());
      console.log("  Deposit Type:", decodedEvent?.args?.depositType?.toString(), "(1 = on-chain deposit)");
    } else {
      console.log("PoolDeposit event not found in transaction logs");
    }

    // Step 7: Check balances after deposit
    console.log("\n--- Step 6: Checking balances after deposit ---");

    // Check pool token balance
    const tokenBalance = await poolDynamicContract.balanceOf(wallet.address);
    console.log("Pool token balance:", tokenBalance.toString());

    // Check asset balance (this might be different from token balance due to exchange rates)
    try {
      const assetBalance = await poolDynamicContract.assetBalanceOf(wallet.address);
      console.log("Asset balance:", assetBalance.toString());
    } catch (error) {
      console.log("Could not fetch asset balance (method might not exist or have different name)");
    }

    // Check liquidity asset balance after deposit
    const finalBalance = await liquidityAssetContract.balanceOf(wallet.address);
    console.log(`Final ${tokenSymbol} balance:`, finalBalance.toString());
    console.log(`${tokenSymbol} used in deposit:`, (initialBalance - finalBalance).toString());

    console.log("\n✅ Dynamic Chain Deposit completed successfully!");
  } catch (error) {
    console.error("❌ Error during deposit:", error);
    throw error;
  }
}

// Main execution
init();

// Example: Deposit 1000 tokens (assuming 6 decimals like USDC)
const depositAmount = 1n * 1000000n; // 1000 tokens with 6 decimals

dynamicChainDeposit(depositAmount)
  .then(() => {
    console.log("Script completed successfully");
  })
  .catch((err: Error) => {
    console.error("Script failed:", err);
  });
