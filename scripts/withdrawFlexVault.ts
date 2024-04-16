
import * as dotenv from 'dotenv'
import { Contract, JsonRpcProvider, Wallet } from 'ethers';



const VAULT_ADDRESS = '0xa66BA7E8Cf3eD414F07c8a9847CE36Ca4fcE38D7'


export const MAINNET_URL = 'https://eth-mainnet.g.alchemy.com/v2/fcK4AEYquRkIgqn0REy8N0uOsiO3kqKI'

export const SANDBOX_URL = 'https://eth-sepolia.g.alchemy.com/v2/oHCT97GjJyLp6TwUMjZdOGPAqDnr9gu6'
const URL = SANDBOX_URL
const FlexVaultABi =
  require('./PoolFlex.json').abi

function init() {
  dotenv.config()
}

// Note the number of shares are at 6 decimals places so 1e6 is 1 share

async function withdrawSharesFlexVault(shares: BigInt) {
  const provider = new JsonRpcProvider(URL)
  const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider)
  const flexVaultContract = new Contract(VAULT_ADDRESS, FlexVaultABi, wallet)


  const tx = await flexVaultContract.requestRedeem(shares)
  console.log('tx', tx)
  const receipt = await tx.wait()
  console.log('receipt', receipt)

}
// Note the assets (USDC or Eurc) are at 6 decimals places so 1e6 is 1 USDC or Eurc
async function withdrawUSDCFlexVault(assets: BigInt) {
  const provider = new JsonRpcProvider(URL)
  const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider)
  const flexVaultContract = new Contract(VAULT_ADDRESS, FlexVaultABi, wallet)
  const shares = await flexVaultContract.convertToShares(assets)

  const tx = await flexVaultContract.requestRedeem(shares)
  console.log('tx', tx)
  const receipt = await tx.wait()
  console.log('receipt', receipt)

}

// Note the assets (USDC or Eurc) are at 6 decimals places so 1e6 is 1 USDC or Eurc
async function depositFlexVault(assets: BigInt) {
  const provider = new JsonRpcProvider(URL)
  const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider)

  const flexVaultContract = new Contract(VAULT_ADDRESS, FlexVaultABi, wallet)


  const tx = await flexVaultContract.deposit(assets, wallet.address)
  console.log('tx', tx)
  const receipt = await tx.wait()
  console.log('receipt', receipt)

}

init()
withdrawUSDCFlexVault(1000000n)
  .then()
  .catch((err: Error) => {
    console.error('err', err)
  })



