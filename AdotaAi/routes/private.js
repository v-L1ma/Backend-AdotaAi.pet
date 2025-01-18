import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient() 


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
  
      // Salvar no banco
      await prisma.animal.create({
        data: {
            idDono: req.body.idDono,
            nome: req.body.nome,
            raca: req.body.raca,
            foto: req.body.foto,
            datanasc: req.body.datanasc,
            sexo: req.body.sexo,
            vacinado: req.body.vacinado,
            castrado: req.body.castrado,
            vermifugado: req.body.vermifugado,
            descricao: req.body.descricao,
            Picture: req.file.filename,
        },
      });
  
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
            Picture: req.file.path,
        },
    })

    res.status(200).send({msg : 'Informações atualizadas'})

})

//Carregar animais cadastrados pelo dono
router.get('/animais-cadastrados', async (req, res) => {
  try {
      const { id } = req.query; // esse id é o do dono do pet

      if (!id) {
          return res.status(400).json({ message: "Id é obrigatório" });
      }

      const animais = await prisma.animal.findMany({
          where: { idDono: id }, // Certifique-se do tipo do campo
      });

      res.status(200).json(animais);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro no lado do servidor" });
  }
});

router.delete('/animais/:id', async (req,res)=>{

    await prisma.animal.delete({
        where:{
            id: req.params.id
        }
    })
    res.status(200).send({msg : 'Animal excluido'})
})

export default router