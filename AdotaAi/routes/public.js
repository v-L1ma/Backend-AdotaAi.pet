import express from 'express'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import Multer from "multer";
import multerS3 from 'multer-s3'
import { S3Client } from '@aws-sdk/client-s3';


const prisma = new PrismaClient()
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET

// Configuração do cliente S3 com AWS SDK v3
const s3 = new S3Client({
  region: process.env.AWS_REGION, // Certifique-se de definir a região no .env
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


const myBucket = process.env.AWS_BUCKET_NAME;

// Configuração do multer com multer-s3
const multer = Multer({
  storage: multerS3({
    s3: s3,
    bucket: myBucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, callback) => {
      // Define o nome do arquivo como timestamp + nome original
      callback(null, `${Date.now()}_${file.originalname}`);
    },
  }),
});

router.post("/upload", multer.single("file"), (req,res)=>{
  console.log(req.file)
  res.status(200).json({message: "Deu bom"})
})

  router.post('/cadastro', multer.single("file"), async (req, res) => {
    try {
      const { email, name, password, cpf, birthdate, phone } = req.body;
  
      // Upload do arquivo
      if (!req.file) {
        return res.status(400).send('Nenhum arquivo enviado.');
      }
  
      // Criptografar a senha
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);

      const imageURL = req.file.location;
      console.log(imageURL)
      
  
      // Salvar no banco
      await prisma.usuarios.create({
        data: {
          email,
          name,
          password: hashPassword,
          cpf,
          birthdate,
          phone,
          Picture: imageURL,
        },
      });
  
      res.status(200).json({ msg: 'Usuário criado com sucesso!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro no servidor' });
    }
  });

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
