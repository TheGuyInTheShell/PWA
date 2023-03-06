// Routes.js - Módulo de rutas
const express = require('express');
const router = express.Router();
const {publicKey, privateKey} = require('./vapid.json');
const urlsafe64 = require('urlsafe-base64');
const subs = require('./utils');



const mensajes = [

  {
    _id: 'XXX',
    user: 'spiderman',
    mensaje: 'Hola Mundo'
  }

];




// Get mensajes
router.get('/', function (req, res) {
  // res.json('Obteniendo mensajes');
  res.json( mensajes );
});


// Post mensaje
router.post('/', function (req, res) {
  
  const mensaje = {
    mensaje: req.body.mensaje,
    user: req.body.user
  };

  mensajes.push( mensaje );

  res.json({
    ok: true,
    mensaje
  });

});

router.post('/subscribe', (req, res)=>{
  const sub = req.body;
  subs.push(sub);
  res.json('subscribe');
});


router.get('/key', (req, res)=>{
  const codecKey = urlsafe64.decode(publicKey);
  res.send(codecKey);
});


router.post('/push', (req, res)=>{
  const notificacion = {
    titulo: req.body.titulo,
    contenido: req.body.contenido,
    usuario: req.body.usuario,
  }
  subs.sendPush(notificacion)
  res.json(notificacion)
});


module.exports = router;