const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const multer = require('multer');
const multerConfig = require('../config/multer');
const aws = require('aws-sdk');

const s3 = new aws.S3();



router.get('/posts', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) {return res.status(500).send({ error: error })}
        conn.query(
            `select * from images;`,
            (error, result) => {
                if (error) {return res.status(500).send({ err: error })}
                conn.release();
                return res.status(200).send({
                    quantidade: result.length,
                    resultado: result
                });
            }
        )
    });
});

router.post('/insertImage', multer(multerConfig).single('file'), (req, res, next) => {
    console.log(req.file);
    const { originalname: name, size, key, location: url = "" } = req.file;

    mysql.getConnection((error, conn) => {
        if (error) {return res.status(500).send({ error: error })}
        conn.query(
            `insert into images (url_image, name) values( ? , ?);`,
            [url, key],
            (error, result) => {
                if (error) {return res.status(500).send({ err: error })}
                conn.release();
                return res.status(200).send({
                    mensagem: 'Upload com sucesso.',
                    url: url, 
                    key :key
                });
            }
        )
    });
});

router.get('/insertImage/:id', (req, res, next) => {
    console.log(req.params.id);

    mysql.getConnection((error, conn) => {
        if (error) {return res.status(500).send({ error: error })}
        conn.query(
            `select url_image from images where name= ?;`,
            [req.params.id],
            (error, result) => {
                if (error) {return res.status(500).send({ err: error })}
                conn.release();
                return res.status(200).send({
                    mensagem: 'Imagem carregada do banco.',
                    url: result[0].url_image, 
                });
            }
        )
    });
});

router.delete('/del/:id', (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) {return res.status(500).send({ error: error })}
        conn.query(
            `delete from images where name = ?;`,
            [req.params.id],
            (error, result) => {
                if (error) {return res.status(500).send({ err: error })}
                conn.release();
                if(process.env.STORAGE_TYPE === 's3'){
                    s3.deleteObject({
                        Bucket: process.env.BUCKET_NAME,
                        Key: req.params.id
                    }).promise()
                }
                return res.status(200).send({
                    mensagem: 'Deletado com sucesso!',
                    id: req.params.id
                });
            }
        )
    });
});

module.exports = router;