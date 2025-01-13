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
      keyFile: './googledrive.json',
      scopes: "https://www.googleapis.com/auth/drive",
    });
    return auth;
  };

  const uploadToGoogleDrive = async (file, auth) => {
    const fileMetadata = {
      name: file.originalname,
      parents: ["10IAFrfvR7Pakm1ouF31uorr6zir5H-pV"], // Change it according to your desired parent folder id
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

  router.post("/upload", multer.single("file"), async (req, res, next) => {
    try {
        if (!req.file) {
          res.status(400).send("No file uploaded.");
          return;
        }
        const auth = authenticateGoogle();
        const response = await uploadToGoogleDrive(req.file, auth);
        deleteFile(req.file.path);
        res.status(200).json({ response });
      } catch (err) {
        console.log(err);
        next(err)
    }
  })

  router.post("/upload", multer.single("file"), async (req, res, next) => {
    try {
        if (!req.file) {
          res.status(400).send("No file uploaded.");
          return;
        }
        const auth = authenticateGoogle();
        const response = await uploadToGoogleDrive(req.file, auth);
        res.status(200).json({ response });
      }catch (err) {
        console.log(err);
        next(err); // Passa o erro para o próximo middleware de tratamento de erros
      }
  })
    

router.post('/cadastro', async (req, res)=>{
   try { 
    const user = req.body

    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(user.password, salt)

    await prisma.usuarios.create({
        data: {
            email: user.email,
            name: user.name,            
            password: hashPassword,
            cpf: user.cpf,
            birthdate: user.birthdate,
            phone: user.phone,
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
