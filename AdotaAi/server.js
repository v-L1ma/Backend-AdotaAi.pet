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

const port = process.env.PORT || 3000

app.get('/animais/:id', async (req,res)=>{

    const animais = await prisma.animal.findUnique({
        where: {
            id: req.params.id
        },
    })

    res.status(200).json(animais)
})

app.post('/animais', async (req,res)=>{

    await prisma.animal.create ({
        data: {
            nome: req.body.nome,
            raca: req.body.raca,
            foto: req.body.foto,
            datanasc: req.body.datanasc,
            sexo: req.body.sexo,
            vacinado: req.body.vacinado,
            castrado: req.body.castrado,
            vermifugado: req.body.vermifugado,
            descricao: req.body.descricao,
        },
    })

    res.status(200).send({msg : 'Animal cadastrado'})
})

app.put('/animais/:id', async (req,res)=>{

    await prisma.animal.update({
        where:{
            id: req.params.id
        },
        data: {
            nome: req.body.nome,
            raca: req.body.raca,
            foto: req.body.foto,
            datanasc: req.body.datanasc,
            sexo: req.body.sexo,
            vacinado: req.body.vacinado,
            castrado: req.body.castrado,
            vermifugado: req.body.vermifugado,
            descricao: req.body.descricao,
        },
    })

    res.status(200).send({msg : 'Informações atualizadas'})

})

app.delete('/animais/:id', async (req,res)=>{

    await prisma.animal.delete({
        where:{
            id: req.params.id
        }
    })
    res.status(200).send({msg : 'Animal excluido'})
})

app.use('/', publicRoutes)
app.use('/', auth, privateRoutes)


app.listen(port, ()=> console.log("server on"))