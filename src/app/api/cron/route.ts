import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { LOGISTICS, countYard } from '../../../../simulation/logistics'
import { simulateShipOperations } from '../../../../simulation/shipOperations'
import { simulateTruckOperations } from '../../../../simulation/truckOperations'
import { simulateTrainOperations } from '../../../../simulation/trainOperations'
import { updateMaintenance } from '../../../../simulation/maintenance'

// On initialise Prisma pour l'API
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Vercel appellera cette fonction automatiquement
export async function GET(request: Request) {
  // Sécurité basique : on vérifie un secret (optionnel mais recommandé)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await updateMaintenance(prisma)

    const stock = await countYard(prisma)
    const fillRate = (stock / LOGISTICS.PORT_CAPACITY) * 100

    const ships = await simulateShipOperations(prisma, stock)
    const trucks = await simulateTruckOperations(prisma, stock, fillRate)
    const trains = await simulateTrainOperations(prisma, fillRate)

    const newStock = await countYard(prisma)
    const newFill = (newStock / LOGISTICS.PORT_CAPACITY) * 100

    const logMessage = `📊 ${newFill.toFixed(2)}% (${newStock.toLocaleString()}) | navires +${ships.unloaded}/-${ships.loaded} | camions +${trucks.added}/-${trucks.removed} | trains +${trains.added}/-${trains.removed}`
    console.log(logMessage)

    return NextResponse.json({ 
      success: true, 
      fillRate: newFill, 
      message: logMessage 
    })
  } catch (error) {
    console.error('❌ [CRON] Erreur:', error)
    return NextResponse.json({ error: 'Erreur lors de la simulation' }, { status: 500 })
  }
}