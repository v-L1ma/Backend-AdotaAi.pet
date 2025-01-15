import express from 'express'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import Multer from "multer";
import { google } from "googleapis";
import fs from 'fs'

const prisma = new PrismaClient()
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET

const credentials = 
  {
    "type": "service_account",
    "project_id": "adotaai-447500",
    "private_key_id": "da20436fea23658ea407d4761b9066f670800adb",
    "private_key": process.env.private_key.replace(/\\n/g, '\n'),
    "client_email": "adotaai@adotaai-447500.iam.gserviceaccount.com",
    "client_id": "110718253060481934072",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/adotaai%40adotaai-447500.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com",
  }



const multer = Multer({
    storage: Multer.diskStorage({
      destination: function (req, file, callback) {
        callback(null, `./files`);
      },
      filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  const authenticateGoogle = () => {
    const auth = new google.auth.GoogleAuth({
    
      credentials,
      scopes: "https://www.googleapis.com/auth/drive",
    });
    return auth;
  };

  const uploadToGoogleDrive = async (file, auth) => {
    const fileMetadata = {
      name: file.originalname,
      parents: ["1ABftdbXNw2MvdnEAglxLsjvCRxLpPLKD"], // Change it according to your desired parent folder id
    };
  
    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    };
  
    const driveService = google.drive({ version: "v3", auth });
  
    const response = await driveService.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id",
    });
    return response.data.id;
  };

  const deleteFile = (filePath) => {
    fs.unlink(filePath, () => {
      console.log("file deleted");
    });
  };

  router.post('/cadastro', multer.single('file'), async (req, res) => {
    try {
      const { email, name, password, cpf, birthdate, phone } = req.body;
  
      // Upload do arquivo
      if (!req.file) {
        return res.status(400).send('Nenhum arquivo enviado.');
      }
  
      const auth = authenticateGoogle();
      const uploadResponse = await uploadToGoogleDrive(req.file, auth);
  
      const pictureUrl = uploadResponse; // Assuma que isso é a URL ou ID do arquivo
  
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
          Picture: pictureUrl, // Salva a URL da imagem
        },
      });

      deleteFile(req.file.path);
  
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
