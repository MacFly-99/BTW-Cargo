import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import { LOGISTICS } from './simulation/logistics'
import { simulateTruckArrivals } from './simulation/truckArrivals'
import { simulateTrainEvacuation } from './simulation/trainEvacuation'
import { simulateShipOperations } from './simulation/shipOperations'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const PORT_CAPACITY = 120000

// ==========================================
// TÂCHE 1 : Opérations des navires (Toutes les minutes)
// ==========================================
cron.schedule('* * * * *', async () => {
  console.log('⏱️ [CRON] Opérations maritimes...')
  await simulateShipOperations(prisma)
  console.log('✅ [CRON] Opérations maritimes terminées.')
})

// ==========================================
// TÂCHE 2 : Flux logistique complet (Toutes les 1 minute)
// ==========================================
cron.schedule('* * * * *', async () => {
  console.log('📦 [CRON] Cycle logistique global...')

  try {
    const currentStock = await prisma.container.count({ where: { shipId: null } })
    const fillRate = (currentStock / PORT_CAPACITY) * 100

    console.log(`📊 Taux de remplissage du port : ${fillRate.toFixed(2)}% (${currentStock.toLocaleString()} conteneurs)`)

    // --- LOGIQUE DE PALIERS CRITIQUES ---
    
    if (fillRate >= LOGISTICS.SATURATION_THRESHOLD) {
      // ÉTAT CRITIQUE : Évacuation d'urgence
      console.log(`🚨 SATURATION : ${fillRate.toFixed(1)}%. Évacuation par train d'urgence !`)
      await simulateTrainEvacuation(prisma, true) // Urgence = double capacité
    } 
    else if (fillRate <= LOGISTICS.EMPTY_THRESHOLD) {
      // ÉTAT VIDE : Arrivage massif (on fait venir des camions en masse)
      console.log(`📉 PORT VIDE : ${fillRate.toFixed(1)}%. Arrivage massif de camions.`)
      
      for (let i = 0; i < 5; i++) {
        await simulateTruckArrivals(prisma)
      }
    } 
    else {
      // ÉTAT NORMAL : Flux fluide
      console.log(`✅ FLUX NORMAL : ${fillRate.toFixed(1)}%. Activité standard.`)
      
      // Les camions arrivent
      await simulateTruckArrivals(prisma)
      
      // ET on évacue systématiquement par train si on est au-dessus de 60%
      if (fillRate > 60) {
        await simulateTrainEvacuation(prisma, false)
      }
    }

    console.log('✅ [CRON] Cycle logistique terminé.')
  } catch (error) {
    console.error('❌ [CRON] Erreur:', error)
  }
})