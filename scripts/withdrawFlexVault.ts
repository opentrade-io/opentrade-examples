
import * as dotenv from 'dotenv'
import { Contract, EventLog, JsonRpcProvider, Log, LogDescription, Wallet } from 'ethers';



const VAULT_ADDRESS = '0xc2BCF10ae9C952298E86777229D4ACd39EeE7555' //'0xa66BA7E8Cf3eD414F07c8a9847CE36Ca4fcE38D7'
const WALLET_ADDRESS = '0xF8A28702CB3D58583FD1882b76220B20597cef8A'
export const LOCAL_HH_URL = 'http://127.0.0.1:8545'
export const SEPOLIA_URL = 'https://eth-sepolia.g.alchemy.com/v2/oHCT97GjJyLp6TwUMjZdOGPAqDnr9gu6'
const URL = LOCAL_HH_URL
const FlexVaultABi =
  require('./PoolFlex.json').abi

function init() {
  dotenv.config()
}
type WithdrawEvent = {
  requestedShares: BigInt,
  requestedAssets: BigInt,
  requestTimestamp?: number,
  processedTimestamp?: number,
  repaidTimestamp?: number,
  lender: string,
  eventId: BigInt
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

async function withdrawGetActiveWithdrawEvents(): Promise<WithdrawEvent[]> {
  const provider = new JsonRpcProvider(URL)
  const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider)
  const flexVaultContract = new Contract(VAULT_ADDRESS, FlexVaultABi, wallet)

  const withdrawEvents: WithdrawEvent[] = []

  // Add REPAY EVENTS

  {
    const eventFilter = flexVaultContract.filters.RepayLoanToLender(WALLET_ADDRESS, null, null)

    const events: (Log[] | EventLog[]) = await flexVaultContract.queryFilter(eventFilter)
    for (let i = 0; i < events.length; i++) {
      const log = events[i]
      const block = await provider.getBlock(log.blockNumber)
      const logDescription = flexVaultContract.interface.parseLog(log) as LogDescription


      withdrawEvents.push({
        requestedShares: logDescription.args[2],
        requestedAssets: logDescription.args[3],
        repaidTimestamp: block?.timestamp,
        lender: logDescription?.args[0],
        eventId: logDescription?.args[1]
      })

      console.log('RepayLoanToLender ', flexVaultContract.interface.parseLog(log)?.args)


    }
  }
  // PROCESEED
  {
    const eventFilter = flexVaultContract.filters.RepayToPoolProcessed(WALLET_ADDRESS, null, null)

    const events: (Log[] | EventLog[]) = await flexVaultContract.queryFilter(eventFilter)
    for (let i = 0; i < events.length; i++) {
      const log = events[i]
      const block = await provider.getBlock(log.blockNumber)
      const logDescription = flexVaultContract.interface.parseLog(log) as LogDescription

      const eventId = logDescription.args[1]
      let match = false
      withdrawEvents.forEach((ev) => {
        if (ev.eventId === eventId) {
          ev.processedTimestamp = block?.timestamp
          match = true
          console.log('MATCH  ', logDescription?.args, ev)
        }
      })



      if (!match) {

        withdrawEvents.push({
          requestedShares: logDescription.args[2],
          requestedAssets: logDescription.args[3],
          processedTimestamp: block?.timestamp,
          lender: logDescription?.args[0],
          eventId: logDescription?.args[1]
        })
      }

      console.log('RepayToPoolProcessed ', flexVaultContract.interface.parseLog(log)?.args)


    }
  }

  



  {
    const eventFilter = flexVaultContract.filters.RedeemRequested(WALLET_ADDRESS, null, null)

    const events: (Log[] | EventLog[]) = await flexVaultContract.queryFilter(eventFilter)
    const storedWithdrawEvensts = await flexVaultContract.withdrawEvents()

    for (let i = 0; i < events.length; i++) {
      const log = events[i]

      const block = await provider.getBlock(log.blockNumber)

      const logDescription = flexVaultContract.interface.parseLog(log)

      let match = false
      withdrawEvents.forEach((ev) => {
        console.log('check match ', block?.timestamp, ev.requestTimestamp)
        if (logDescription?.args[2]  === ev.requestedShares && logDescription?.args[1]  === ev.requestedAssets) {
          match = true
          console.log('MATCH  ', logDescription?.args, ev)
          ev.requestTimestamp = block?.timestamp  
        }
      })
      if (!match) {
        const storedEvent = storedWithdrawEvensts.find((ev: any) => { return ev[0] === logDescription?.args[2] && ev[1] === logDescription?.args[1] })  
        if (storedEvent) {
          console.log('MATCH  ', logDescription?.args, storedEvent)
          withdrawEvents.push({
            requestedShares: logDescription?.args[2],
            requestedAssets: logDescription?.args[1],
            requestTimestamp: block?.timestamp,
            lender: logDescription?.args[0],
            eventId: storedEvent.eventId
          })
        } else {
          console.log('RedeemRequested No Match 1 ', block?.timestamp, log.blockNumber, logDescription?.args)
        }

      }

    }
  }
 



  // {
  //   const rawWithdrawEvents = await flexVaultContract.withdrawEvents()
  //   console.log('withdrawEvents', rawWithdrawEvents)
  //   const withdrawEvents = rawWithdrawEvents.map((ev: any) => {

  //     return {
  //       requestedShares: ev[0],
  //       requestedAssets: ev[1],
  //       transferOutDayTimestamp: Number(ev[2]),
  //       requestTimestamp: Number(ev[3]),
  //       lender: ev[4],
  //       eventId: ev[5],
  //     } as WithdrawEvent
  //   })
  // }

}



init()
withdrawGetActiveWithdrawEvents()
  .then(() => {
    console.log('done')
  })
  .catch((e) => {
    console.error(e)
  })  
