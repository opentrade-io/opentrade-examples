
import * as dotenv from 'dotenv'
import { Contract, JsonRpcProvider, Wallet } from 'ethers';



const VAULT_ADDRESS = '0xa66BA7E8Cf3eD414F07c8a9847CE36Ca4fcE38D7'
//const WALLET_ADDRESS = '0xF8A28702CB3D58583FD1882b76220B20597cef8A'
export const SEPOLIA_URL = 'https://eth-sepolia.g.alchemy.com/v2/oHCT97GjJyLp6TwUMjZdOGPAqDnr9gu6'
const FlexVaultABi =
  require('./PoolFlex.json').abi

function init() {
  dotenv.config()
}

async function withdrawFlexVault() {
  const provider = new JsonRpcProvider(SEPOLIA_URL)
  const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider)
  const flexVaultContract = new Contract(VAULT_ADDRESS, FlexVaultABi, wallet)
  const poolType = await flexVaultContract.poolType()
  console.log('poolType', poolType)
  const shares = 1000000n
  const tx = await flexVaultContract.requestRedeem(shares)
  console.log('tx', tx)
  const receipt = await tx.wait() 
  console.log('receipt', receipt)
  receipt.events?.forEach((event: any) => {
    console.log('Event ',event) // flexVaultContract.interface.parseLog(event))
  })
  receipt.logs?.forEach((log: any) => {
      console.log('Log ',flexVaultContract.interface.parseLog(log))

  })
  const withdrawEvents = await flexVaultContract.withdrawEvents()
  console.log('withdrawEvents', withdrawEvents)
}

init()
withdrawFlexVault()
  .then(() => {
    console.log('done')
  })
  .catch((e) => {
    console.error(e)
  })  
