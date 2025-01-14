import express from 'express'
import { PrismaClient } from '@prisma/client'
import Multer from "multer";
import { google } from "googleapis";
import fs from 'fs'

const router = express.Router()
const prisma = new PrismaClient()

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
      parents: ["1I0maE0nQ42N_ucaN76AK4VUdbOsU1ebH"], // Change it according to your desired parent folder id
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


router.get('/animais', async (req,res)=>{

    try{const animais = await prisma.animal.findMany()

    res.status(200).json(animais)}
    catch(error){
        console.error(error)
        res.status(500).json({message:"Erro no lado do servidor"})
    }
})

router.get('/animais/:id', async (req,res)=>{

    const animais = await prisma.animal.findUnique({
        where: {
            id: req.params.id
        },
    })

    res.status(200).json(animais)
})

router.post('/animais', multer.single('file'), async (req, res) => {
    try {
  
      // Upload do arquivo
      if (!req.file) {
        return res.status(400).send('Nenhum arquivo enviado.');
      }
  
      const auth = authenticateGoogle();
      const uploadResponse = await uploadToGoogleDrive(req.file, auth);
  
      const pictureUrl = uploadResponse; // Assuma que isso é a URL ou ID do arquivo
  
      // Salvar no banco
      await prisma.animal.create({
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
            Picture: pictureUrl, // Salva a URL da imagem
        },
      });

      deleteFile(req.file.path);
  
      res.status(200).send({msg : 'Animal cadastrado'})
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro no servidor' });
    }
  });
/*
router.post('/animais', async (req,res)=>{

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
})*/

router.put('/animais/:id', async (req,res)=>{

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

router.delete('/animais/:id', async (req,res)=>{

    await prisma.animal.delete({
        where:{
            id: req.params.id
        }
    })
    res.status(200).send({msg : 'Animal excluido'})
})

export default router