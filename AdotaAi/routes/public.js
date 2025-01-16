import express from 'express'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import multer from "multer";
import fs from 'fs'

const prisma = new PrismaClient()
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET
const uploadDir = `/app/files`;

// Certifique-se de que o diretório existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerInstance = multer({
  storage: multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, uploadDir);
    },
    filename: function (req, file, callback) {
      callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
});

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

router.use('/ver', express.static("files"))
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
