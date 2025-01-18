import express from 'express'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET



  router.post('/cadastro', multer.single('file'), async (req, res) => {
    try {
      const { email, name, password, cpf, birthdate, phone } = req.body;
  
      // Upload do arquivo
      if (!req.file) {
        return res.status(400).send('Nenhum arquivo enviado.');
      }
  
      // Criptografar a senha
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
  
      // Salvar no banco
      await prisma.usuarios.create({
        data: {
          email,
          name,
          password: hashPassword,
          cpf,
          birthdate,
          phone,
          Picture: req.file.filename,
        },
      });
  
      res.status(200).json({ msg: 'Usuário criado com sucesso!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro no servidor' });
    }
  });

//http://localhost:3000/ver/file.path

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

        //res.status(200).json(token)
        const userWithoutPassword = {...user}
        delete userWithoutPassword.password
        res.status(200).json({"user":userWithoutPassword , "token":token})

    } catch (error) {
        console.error(error)
        res.status(500).json({message:"Erro no lado do servidor"})
    }
})


export default router
