import express from 'express'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'
import publicRoutes from './routes/public.js'
import privateRoutes from './routes/private.js'

import auth from './middlewares/auth.js'

const prisma = new PrismaClient()

const app = express()

app.use(express.json())
app.use(cors())

app.get('/', (req,res)=>{
    res.status(200).json({msg:"API Funcionando"})
})



app.use('/', publicRoutes)
app.use('/', auth, privateRoutes)
app.use('/ver', express.static('/app/files'))


app.listen(process.env.PORT || 3000, ()=> console.log("server on"))