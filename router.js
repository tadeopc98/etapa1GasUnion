const express = require('express');
const router = express.Router();
const createConnection = require('./database');
const connection = createConnection();
const crud = require('./controllers/crud');

router.use((req, res, next) => {
  res.locals.datos = req.session.datos; // Establece res.locals para que esté disponible en las vistas
  next();
});


router.get('/deleteClientSuministro/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM clientesSuministro WHERE noCliente = ?', [id], (error, results) => {
    if (error) {
      console.log(error);
    } else {
      res.redirect('/clientesSuministroAdmin');
    }
  });
});

router.get('/deleteUser/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM usuarios WHERE idUsuario = ?', [id], (error, results) => {
    if (error) {
      console.log(error);
    } else {
      res.redirect('/usersControlAdmin');
    }
  });
});

router.get('/deleteClientAdministracion/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM clientesAdministracion WHERE noCliente = ?', [id], (error, results) => {
    if (error) {
      console.log(error);
    } else {
      res.redirect('/clientesAdministracionAdmin');
    }
  });
});



router.post('/saveUser', crud.saveUser);
router.post('/updateUser', crud.updateUser);
router.post('/saveClientSuministro', crud.saveClientSuministro);
router.post('/updateSuministro', crud.updateSuministro);
router.post('/saveClientAdministracion',crud.saveClientAdministracion)
router.post('/updateAdministracion', crud.updateAdministracion);
router.post('/saveUnidad', crud.saveUnidad);
router.post('/startUnity', crud.startUnity);
router.post('/closeUnity', crud.closeUnity);


module.exports = router;
