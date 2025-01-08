import express from 'express'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET

router.post('/cadastro', async (req, res)=>{
   try { 
    const user = req.body

    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(user.password, salt)

    await prisma.usuarios.create({
        data: {
            email: user.email,
            name: user.name,
            cpf: user.cpf,
            birthdate: user.birthdate,
            phone: user.phone,
            password: hashPassword
        },
    })

    res.status(200).json({msg:"usuario criado"})
    }
    catch(error){
        console.error(error)
        res.status(500).json({message:"Erro no lado do servidor"})
    }
})

router.post('/login', async (req,res)=>{
    try {
        const userInfo = req.body

        const user = await prisma.usuarios.findUnique({
            where: {email: userInfo.email},
        })

        if(!user){
            return res.status(404).json({message: "Usuario não encontrado"})
        }

        const isMatch = await bcrypt.compare(userInfo.password, user.password)

        if(!isMatch){
            return res.status(400).json({message: "Senha invalida"})
        }

        //Gerando o JWT token
        const token = jwt.sign({id: user.id}, JWT_SECRET, {expiresIn: '7d'})

        res.status(200).json(token)

    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Erro no lado do servidor"})
    }
})


export default router
