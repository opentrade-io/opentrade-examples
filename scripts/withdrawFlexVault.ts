
import * as dotenv from 'dotenv'
import { Contract,  JsonRpcProvider,  Wallet } from 'ethers';



const VAULT_ADDRESS = '0xc2BCF10ae9C952298E86777229D4ACd39EeE7555' //'0xa66BA7E8Cf3eD414F07c8a9847CE36Ca4fcE38D7'

export const LOCAL_HH_URL = 'http://127.0.0.1:8545'
export const SEPOLIA_URL = 'https://eth-sepolia.g.alchemy.com/v2/oHCT97GjJyLp6TwUMjZdOGPAqDnr9gu6'
const URL = LOCAL_HH_URL
const FlexVaultABi =
  require('./PoolFlex.json').abi

function init() {
  dotenv.config()
}


async function _withdrawFlexVault() {
  const provider = new JsonRpcProvider(URL)
  const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider)
  const flexVaultContract = new Contract(VAULT_ADDRESS, FlexVaultABi, wallet)

  const shares: BigInt = 1000000n
  const tx = await flexVaultContract.requestRedeem(shares)
  console.log('tx', tx)
  const receipt = await tx.wait()
  console.log('receipt', receipt)
  receipt.events?.forEach((event: any) => {
    console.log('Event ', event) // flexVaultContract.interface.parseLog(event))
  })
  receipt.logs?.forEach((log: any) => {
    console.log('Log ', flexVaultContract.interface.parseLog(log))

  })
  const withdrawEvents = await flexVaultContract.withdrawEvents()
  console.log('withdrawEvents', withdrawEvents)
}


init()

