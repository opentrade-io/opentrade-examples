import * as dotenv from "dotenv";
import { Contract, JsonRpcProvider, Wallet } from "ethers";

// Contract addresses - you'll need to update these for your network
const POOL_DYNAMIC_ADDRESS = "0xc03B8490636055D453878a7bD74bd116d0051e4B"; // Update with actual PoolDynamic address

export const RPC_PROVIDER_URL = "https://eth-sepolia.g.alchemy.com/v2/oHCT97GjJyLp6TwUMjZdOGPAqDnr9gu6";
const URL = RPC_PROVIDER_URL;

// Import ABIs - you'll need to ensure these files exist
const PoolDynamicABI = require("../../abi/PoolDynamic.json").abi;

function init() {
  dotenv.config();
}

async function dynamicWithdraw(withdrawAmount: bigint) {
  init();

  // Setup provider and wallet
  const provider = new JsonRpcProvider(URL);
  const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

  console.log("--- Dynamic Withdraw Example ---");
  console.log("Wallet address:", wallet.address);
  console.log("Withdraw amount:", withdrawAmount.toString(), "shares");

  // Connect to contracts
  const poolDynamicContract = new Contract(POOL_DYNAMIC_ADDRESS, PoolDynamicABI, wallet);

  // Step 1: Check current pool token balance
  console.log("\n--- Step 1: Checking current pool token balance ---");
  const poolTokenBalance = await poolDynamicContract.balanceOf(wallet.address);

  console.log(`Pool tokens owned: ${poolTokenBalance}`);

  if (poolTokenBalance === 0n) {
    console.log("❌ No pool tokens to withdraw. Please deposit first using the deposit script.");
    return;
  }

  // Check if we have enough shares to withdraw
  if (poolTokenBalance < withdrawAmount) {
    console.log(`❌ Insufficient pool tokens for withdrawal.`);
    console.log("Required:", withdrawAmount.toString(), "Available:", poolTokenBalance.toString());
    return;
  }

  // Step 2: Request redemption
  console.log(`\n--- Step 2: Requesting redemption of ${withdrawAmount} shares ---`);

  const requestRedeemTx = await poolDynamicContract.requestRedeem(withdrawAmount);
  const requestRedeemReceipt = await requestRedeemTx.wait();

  console.log("✅ Redemption request submitted!");
  console.log("Transaction hash:", requestRedeemReceipt?.hash);

  // Step 3: Find and decode the RedeemRequested event
  console.log("\n--- Step 3: Checking redemption request event ---");
  const redeemRequestedEvent = requestRedeemReceipt?.logs?.find((log: { topics: string[]; data: string }) => {
    try {
      const parsedLog = poolDynamicContract.interface.parseLog(log);
      return parsedLog?.name === "RedeemRequested";
    } catch {
      return false;
    }
  });

  if (redeemRequestedEvent) {
    const parsedEvent = poolDynamicContract.interface.parseLog(redeemRequestedEvent);
    const { lender, assets, shares, uuid } = parsedEvent!.args;

    console.log("🎉 RedeemRequested event found:");
    console.log("  Lender:", lender);
    console.log("  Assets:", assets.toString());
    console.log("  Shares:", shares.toString());
    console.log("  UUID:", uuid);

    console.log("\n--- Redemption Request Status ---");
    console.log("✅ Step 1: Redemption requested");
    console.log("⏳ Step 2: Waiting for borrower manager to accept redemption");
    console.log("⏳ Step 3: Waiting for pool admin to repay redemption");

    // Propose improvement:
    // Add an sandbox exclusive api function to trigger/automate the redemption process
    console.log("\n--- Next Steps (Performed by OpenTrade) --- ");
    console.log("1. The borrower manager needs to call acceptRedemption() with your address and UUID");
    console.log("2. The pool admin needs to call repayRedemption() to complete the withdrawal");
    console.log("3. You will receive the liquidity asset tokens in your wallet");

    console.log("\n--- Important Information ---");
    console.log(`Redemption UUID: ${uuid}`);
    console.log(`Expected assets: ${assets.toString()}`);
    console.log("Save this UUID - it will be needed for the acceptance and repayment steps");
  } else {
    console.log("❌ RedeemRequested event not found in transaction logs");
  }
}

// Main execution
init();

const withdrawAmount = 20000n;

dynamicWithdraw(withdrawAmount)
  .then(() => {
    console.log("\n✅ Script completed successfully!");
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
  });
