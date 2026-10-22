import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import { LOGISTICS, countYard } from './simulation/logistics'
import { simulateShipOperations } from './simulation/shipOperations'
import { simulateTruckOperations } from './simulation/truckOperations'
import { simulateTrainOperations } from './simulation/trainOperations'
import { updateMaintenance } from './simulation/maintenance'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

let running = false

// Tick toutes les 30 secondes (au lieu de 1 minute) pour plus de dynamisme
cron.schedule('*/30 * * * * *', async () => {
  if (running) {
    console.warn('⏭️ [CRON] Tick précédent encore en cours, on saute.')
    return
  }
  running = true

  try {
    await updateMaintenance(prisma) // rotation de maintenance (se limite à 1 fois/heure)

    const stock = await countYard(prisma)
    const fillRate = (stock / LOGISTICS.PORT_CAPACITY) * 100

    const ships = await simulateShipOperations(prisma, stock)
    const trucks = await simulateTruckOperations(prisma, stock, fillRate)
    const trains = await simulateTrainOperations(prisma, fillRate)

    const newStock = await countYard(prisma)
    const newFill = (newStock / LOGISTICS.PORT_CAPACITY) * 100

    console.log(
      `📊 ${newFill.toFixed(2)}% (${newStock.toLocaleString()}) | ` +
        `navires +${ships.unloaded}/-${ships.loaded} | ` +
        `camions +${trucks.added}/-${trucks.removed} | ` +
        `trains +${trains.added}/-${trains.removed}`
    )
  } catch (error) {
    console.error('❌ [CRON] Erreur:', error)
  } finally {
    running = false
  }
})