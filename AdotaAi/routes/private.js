import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()


router.get('/animais', async (req,res)=>{

    try{const animais = await prisma.animal.findMany()

    res.status(200).json(animais)}
    catch(error){
        console.error(error)
        res.status(500).json({message:"Erro no lado do servidor"})
    }
})

export default router