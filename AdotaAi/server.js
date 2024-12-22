import express, { json } from 'express'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'

const prisma = new PrismaClient()

const app = express()

app.use(express.json())
app.use(cors('http://localhost:5173'))

app.get('/animais', async (req,res)=>{

    const animais = await prisma.animal.findMany()

    res.status(200).json(animais)
})

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

    await prisma.animal.update({
        where:{
            id: req.params.id
        }
    })
    res.status(200).send({msg : 'Animal excluido'})
})


app.listen(3000)