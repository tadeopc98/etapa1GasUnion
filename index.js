const express = require('express');
const flash = require('express-flash');
const app = express();
const session = require('express-session');
app.use(express.urlencoded({extended:false}));
app.use(express.json());
const createConnection = require('./database')
const bodyParser = require('body-parser');
const {createCanvas, loadImage}= require('canvas');
const fs = require('fs');
const port = process.env.PORT || 3000;

app.use('/css', express.static(__dirname + '/css'));
app.use('/vendor', express.static(__dirname + '/vendor'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/images', express.static(__dirname + '/images'));




const fechaActual = new Date(); //Fecha actual
const horaActual = fechaActual.getHours();
const minActual = fechaActual.getMinutes();
const segActual = fechaActual.getSeconds()
const horaCompleta = horaActual + ':' + minActual + ':' + segActual;
const diaActual = fechaActual.getDate();
const mesActual = fechaActual.getMonth()+1;
const anioActual = fechaActual.getFullYear();
const fechaCompleta = anioActual + '-' + mesActual + '-' + diaActual;


// Configuración de express-session
app.use(session({
  secret: '123',
  resave: false,
  saveUninitialized: true
}));

app.use(flash());

const connection = createConnection();

app.use(bodyParser.urlencoded({extended:true}));




// Configuración de Express
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


// Ruta de inicio de sesión
app.get('/', (req, res) => {//DECLARAMOS QUE EL INDEX ES EL INICIO
  res.render('login');
});

const verificarSesion = (req, res, next) => {
  if (req.session && req.session.datos) {
    // El usuario tiene una sesión activa, permitir el acceso a las rutas del panel de control
    next();
  } else {
    // El usuario no tiene una sesión activa, redireccionar al inicio de sesión
    res.redirect('/');
  }
};

// Ruta de validación de inicio de sesión
app.post('/login', (req, res) => { //DESDE HTML EJECUTAMOS EL POST CON NOMBRE /login PARA QUE PODAMOS LLAMARLO
  const { username, password } = req.body; //TRAEMOS LOS DATOS DEL INDEX.HTML QUE SON LOS DATOS DE INICIO DE SESION

  const query = 'SELECT * FROM usuarios WHERE username = ? AND password = ? AND status = ?'; //QUERY PARA OBTENER SI EXISTE UN USUARIO CON ESE USERNAME Y PASSWORD Y QUE ADEMAS ESTE ACTIVO
  connection.query(query, [username, password,'ACTIVO'], (error, results) => { //PASAMOS LOS PARAMETROS AL QUERY Y OBTENEMOS EL RESULTADO O EL ERROR
    if (error) {
      console.error('Error en la consulta:', error); //NOS MUESTRA EN LA CONSOLA SI ES QUE XISTE ALGUN ERROR EN EL QUERY
      res.redirect('/'); //SI EXISTE UN ERROR NOS REDIRECCIONA A LA PAGINA PRINCIPAL QUE ES EL LOGIN
    } else if (results.length === 1) {//VALIDAMOS SI ENCONTRO UN DATO EN EL QUERY
      const rol = results[0].rol;
      req.session.datos = { //GUUARDAMOS EN EL OBJETO DATOS TODO LO QUE TRAIGAMOS DEL USUARIO EN EL QUERY
        idUsuario: results[0].idUsuario,
        nombre: results[0].nombre,
        noEmpleado: results[0].noEmpleado,
        username: results[0].username,
        password: results[0].password,
        rol: results[0].rol,
        status: results[0].status
      }     
      console.log(req.session.datos);
      
      //VALIDAMOS LOS ROLES PPARA REDIRECCIONAR A LA PAGINA RESPECTIVA
      if (rol === 'ADMINISTRADOR') {
        res.redirect('/administracion');
      }else if (rol === 'SUPERVISOR') {
        res.redirect('/supervisor');
      
      } else if(rol === 'OPERADOR'){
        res.redirect('/operador')
      } else {
        req.flash('error','Tu rol no es valido, intenta nuevamente')
        res.redirect('/');
        
      }
    } else {
      req.flash('error','Credenciales invalidas. Intentalo Nuevamente');
      res.redirect('/');//SI NO ENCUENTRA NINGUN DATO NOS REDIRECCIONA A LA PAGINA PRINCIPAL NUEVAMENTE
      
    }
  });
});

// Ruta de cierre de sesión
app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Error al cerrar sesión:', error);
    }
    console.log('Sesion cerrada')
    res.redirect('/');
  });
});


// DECLARAMOS LA Ruta del dashboard del administrador
app.get('/administracion',verificarSesion, (req, res) => {
  connection.query('SELECT * FROM clientes WHERE diaCarga BETWEEN DAY(CURDATE()) + 1 AND DAY(DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AND diaCarga <= DAY(LAST_DAY(DATE_ADD(CURDATE(), INTERVAL 30 DAY))) LIMIT 15;',(error, results)=>{
    if(error){
        throw error;
    } else {
      connection.query('SELECT COUNT(*) as total FROM clientes',(error, results2)=>{
        if(error){
            throw error;
        } else {
          connection.query('SELECT precio FROM preciogas limit 1',(error, results3)=>{
            if(error){
                throw error;
            } else {console.log(results)
              const datos = req.session.datos; //OBTENEMOS LA VARIABLE DATOS QUE CREAMOS EN EL METODO DE ARRIBA POST 
              res.render('administracion',{results:results,results2:results2,results3:results3,datos}); //PASAMOS EL OBJETO CON LOS DATOS QUE RECUPERAMOS ANTERIORMENTE
            }
          })
        }   
      })
    }   
  })
  
});

app.get('/bloques',verificarSesion, (req, res) => {
  connection.query('SELECT * FROM  bloques ',(error, results)=>{
    if(error){
        throw error;
    } else {
      const datos = req.session.datos;
      res.render('bloques',{results:results,datos});
    }

    })
  });


app.get('/supervisor',verificarSesion, (req, res) => {
  connection.query('SELECT * FROM clientes WHERE diaCarga BETWEEN DAY(CURDATE()) + 1 AND DAY(DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AND diaCarga <= DAY(LAST_DAY(DATE_ADD(CURDATE(), INTERVAL 7 DAY))) LIMIT 15;',(error, results)=>{
    if(error){
        throw error;
    } else {
      connection.query('SELECT COUNT(*) as total FROM clientes',(error, results2)=>{
        if(error){
            throw error;
        } else {
          connection.query('SELECT precio FROM preciogas limit 1',(error, results3)=>{
            if(error){
                throw error;
            } else {console.log(results)
              const datos = req.session.datos; //OBTENEMOS LA VARIABLE DATOS QUE CREAMOS EN EL METODO DE ARRIBA POST 
              res.render('supervisor',{results:results,results2:results2,results3:results3,datos}); //PASAMOS EL OBJETO CON LOS DATOS QUE RECUPERAMOS ANTERIORMENTE
            }
          })
        }   
      })
    }   
  })
  
});

app.get('/coordinador',verificarSesion, (req, res) => {
  connection.query('SELECT * FROM clientes WHERE diaCarga BETWEEN DAY(CURDATE()) + 1 AND DAY(DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AND diaCarga <= DAY(LAST_DAY(DATE_ADD(CURDATE(), INTERVAL 7 DAY))) LIMIT 15;',(error, results)=>{
    if(error){
        throw error;
    } else {
      connection.query('SELECT COUNT(*) as total FROM clientes',(error, results2)=>{
        if(error){
            throw error;
        } else {
          connection.query('SELECT precio FROM preciogas limit 1',(error, results3)=>{
            if(error){
                throw error;
            } else {console.log(results)
              const datos = req.session.datos; //OBTENEMOS LA VARIABLE DATOS QUE CREAMOS EN EL METODO DE ARRIBA POST 
              res.render('coordinador',{results:results,results2:results2,results3:results3,datos}); //PASAMOS EL OBJETO CON LOS DATOS QUE RECUPERAMOS ANTERIORMENTE
            }
          })
        }   
      })
    }   
  })
  
});

app.get('/operador',verificarSesion, (req, res) => {
    connection.query('SELECT * FROM clientes WHERE diaCarga BETWEEN DAY(CURDATE()) + 1 AND DAY(DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AND diaCarga <= DAY(LAST_DAY(DATE_ADD(CURDATE(), INTERVAL 7 DAY))) LIMIT 15;',(error, results)=>{
      if(error){
          throw error;
      } else {
        connection.query('SELECT COUNT(*) as total FROM clientes',(error, results2)=>{
          if(error){
              throw error;
          } else {
            connection.query('SELECT precio FROM preciogas limit 1',(error, results3)=>{
              if(error){
                  throw error;
              } else {console.log(results)
                const datos = req.session.datos; //OBTENEMOS LA VARIABLE DATOS QUE CREAMOS EN EL METODO DE ARRIBA POST 
                res.render('operador',{results:results,results2:results2,results3:results3,datos}); //PASAMOS EL OBJETO CON LOS DATOS QUE RECUPERAMOS ANTERIORMENTE
              }
            })
          }   
        })
      }   
    })
    
  });
  


app.get('/createUsers', (req,res)=>{
  
  const datos = req.session.datos;
  res.render('createUsers',{datos});
          
});


app.get('/createAdmin', (req,res)=>{
  
  const datos = req.session.datos;
  res.render('createAdmin',{datos});
          
});


app.get('/usersControlAdmin',verificarSesion, (req, res)=>{     
  connection.query('SELECT * FROM usuarios',(error, results)=>{
      if(error){
          throw error;
      } else {
          const datos = req.session.datos;                     
          res.render('usersControlAdmin', {results:results,datos});  
                    
      }   
  })
});

app.get('/addUser', (req,res)=>{
  
  const datos = req.session.datos;
  res.render('addUser',{datos});
          
});


app.get('/clientesSuministroAdmin',verificarSesion, (req, res)=>{     
  connection.query('SELECT * FROM clientesSuministro ',(error, results)=>{
      if(error){
          throw error;
      } else {
              const datos = req.session.datos;                     
              res.render('clientesSuministroAdmin', {results:results,datos});  
        
                  
      }   
  })
});

app.get('/clientesSuministroSupervisor',verificarSesion, (req, res)=>{     
  connection.query('SELECT * FROM clientesSuministro ',(error, results)=>{
      if(error){
          throw error;
      } else {
              const datos = req.session.datos;                     
              res.render('clientesSuministroSupervisor', {results:results,datos});  
        
                  
      }   
  })
});

app.get('/viewClientSuministro/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM clientesSuministro WHERE noCliente= ?', [id], (error, results) => {
    if (error) {
      throw error;
    } else {
        const datos = req.session.datos;
        
        res.render('viewClientSuministro', { client: results[0],datos });
     
     
    }
  });
});

app.get('/viewClientAdministracion/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM clientesAdministracion WHERE noCliente= ?', [id], (error, results) => {
    if (error) {
      throw error;
    } else {
      connection.query('SELECT nombreBloque FROM bloques', (error, results2) => {
      if (error) {
        throw error;
      } else {
        const datos = req.session.datos;
        const opcionesBloque = results2.map(row => row.nombreBloque ); 
        res.render('viewClientAdministracion', { client: results[0],datos,opcionesBloque });
      }
    });
     
    }
  });
});

app.get('/clientesAdministracionAdmin',verificarSesion, (req, res)=>{     
    connection.query('SELECT * FROM clientesAdministracion',(error, results)=>{
        if(error){
            throw error;
        } else {
                const datos = req.session.datos;                     
                res.render('clientesAdministracionAdmin', {results:results,datos});  
          
                    
        }   
    })
  });

  app.get('/clientesAdministracionSupervisor',verificarSesion, (req, res)=>{     
    connection.query('SELECT * FROM clientesAdministracion',(error, results)=>{
        if(error){
            throw error;
        } else {
                const datos = req.session.datos;                     
                res.render('clientesAdministracionSupervisor', {results:results,datos});  
          
                    
        }   
    })
  });


app.get('/createClientAdministracion', (req,res)=>{
  connection.query('SELECT  nombreBloque FROM bloques ',(error,results)=>{
      if(error){
          throw error;
      } else {
        connection.query('SELECT MAX(consecutivo) + 1 AS consec FROM foliosAdministracion ',(error,results2)=>{
          if(error){
              throw error;
          } else {
            connection.query('INSERT INTO foliosAdministracion SET ?',{consecutivo:results2[0].consec},(error,results3)=>{
              if(error){
                  throw error;
              } else { 
                const opcionesBloque = results.map(row => row.nombreBloque ); 
                const datos = req.session.datos;
              res.render('createClientAdministracion',{opcionesBloque,client:results2[0],datos});
              }
            })
          }
        })
          
      }
  })
  
});

app.get('/createClientSuministro', (req,res)=>{
  connection.query('SELECT MAX(consecutivo) + 1 AS consec FROM foliosSuministros ',(error,results)=>{
      if(error){
          throw error;
      } else {
        connection.query('INSERT INTO foliosSuministros SET ?',{consecutivo:results[0].consec},(error,results2)=>{
          if(error){
              throw error;
          } else {
            const datos = req.session.datos;
          res.render('createClientSuministro',{client:results[0],datos});
          
          }
        })
          
      }
  })
  
});




app.use('/', require('./router'));



// Iniciar el servidor

app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});
