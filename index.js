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
      res.redirect('/'); //SI EXISTE UN ERROR NOS REDIRECCIONA A LA PAGINA PRINCIPAL QUE ES EL LOGIN
      throw error; //NOS MUESTRA EN LA CONSOLA SI ES QUE XISTE ALGUN ERROR EN EL QUERY
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
      throw error;
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
      connection.query('SELECT (SELECT COUNT(*) FROM clientesSuministro) + (SELECT COUNT(*) FROM clientesAdministracion) AS total',(error, results2)=>{
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
    connection.query('SELECT COUNT(*) as totalServicios FROM clientesSuministro WHERE statusServicio = ?',['COMPLETADO'],(error, results)=>{
      if(error){
          throw error;
      } else {
        connection.query('SELECT COUNT(*) as totalServicios FROM clientesSuministro WHERE statusServicio IN (?,?)',['CANCELADO','REAGENDADO'],(error, results2)=>{
          if(error){
              throw error;
          } else {
            connection.query('SELECT COUNT(*) as totalServicios FROM clientesSuministro WHERE statusServicio = ?',['ASIGNADO'],(error, results3)=>{
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

app.get('/addUnidad', (req,res)=>{
  
  const datos = req.session.datos;
  res.render('addUnidad',{datos});
          
});

app.get('/viewUnidades',verificarSesion, (req, res)=>{     
  connection.query('SELECT * FROM unidades ',(error, results)=>{
      if(error){
          throw error;
      } else {
              const datos = req.session.datos;                     
              res.render('viewUnidades', {results:results,datos});  
        
                  
      }   
  })
});

app.get('/viewUnidadesServicios',verificarSesion, (req, res)=>{     
  connection.query('SELECT * FROM unidades WHERE statusServicio = ? AND statusUnidad = ?',['CERRADO','ACTIVO'],(error, results)=>{
      if(error){
          throw error;
      } else {
        connection.query('SELECT * FROM unidades WHERE statusServicio = ? AND statusUnidad = ?',['INICIADO','ACTIVO'],(error, results2)=>{
          if(error){
              throw error;
          } else {
            
            const datos = req.session.datos;                     
            res.render('viewUnidadesServicios', {results:results,results2:results2,datos});  
            
                      
          }   
      })
      }   
  })
});

app.get('/startUnidad/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM unidades WHERE noEco= ?', [id], (error, results) => {
    if (error) {
      throw error;
    } else {

        connection.query('SELECT * FROM usuarios WHERE rol IN (?,?) ', ['OPERADOR','TRIPULANTE'], (error, results2) => {
          if(error){
            throw error;
          } else {
            const datos = req.session.datos;
            const operadores = results2.map(row => row.nombre ); 
            
            res.render('startUnidad', { unidad: results[0],datos, operadores });
          }
        })
        
     
     
    }
  });
});

app.get('/closeUnidad/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM unidades WHERE noEco= ?', [id], (error, results) => {
    if (error) {
      throw error;
    } else {
        const datos = req.session.datos;
        
        res.render('closeUnidad', { unidad: results[0],datos });
     
     
    }
  });
});

app.get('/servicios',verificarSesion, (req, res)=>{     
  connection.query('SELECT a.*,b.* FROM clientesAdministracion a, bloques b WHERE a.bloque = b.nombreBloque AND a.bloque = ? AND a.noCliente NOT IN (SELECT noCliente FROM serviciosAsignadosAdmin WHERE statusServicio = ?) ORDER BY a.municipio,a.cp,a.colonia',['BLOQUE 4','PENDIENTE'],(error, results)=>{
      if(error){
          throw error;
      } else {
        connection.query('SELECT * FROM unidades WHERE statusServicio = ?',['INICIADO'],(error, results2)=>{
          if(error){
              throw error;
          } else {
            connection.query('SELECT * FROM clientesSuministro WHERE  proximaCarga IS NOT NULL AND noCliente NOT IN(SELECT noCliente FROM serviciosAsignadosSuministro WHERE statusServicio = ?) ORDER BY municipio,cp',['PENDIENTE'],(error, results3)=>{
              if(error){
                  throw error;
              } else {
                      const unidades = results2.map(row => row.noEco ); 
                      const datos = req.session.datos;                     
                      res.render('servicios', {results:results,results3:results3,unidades,datos});  
                
                          
              }   
          })
            
                      
          }   
      })
        
                  
      }   
  })
});

app.get('/rutasAdmin',verificarSesion, (req, res)=>{     
  connection.query('SELECT a.*,b.* FROM clientesAdministracion a, bloques b WHERE a.bloque = b.nombreBloque AND a.bloque = ? AND statusServicio != ?  ORDER BY a.municipio,a.cp,a.colonia, a.statusServicio',['BLOQUE 2','COMPLETADO'],(error, results)=>{
      if(error){
          throw error;
      } else {
        connection.query('SELECT * FROM unidades WHERE statusServicio = ?',['INICIADO'],(error, results2)=>{
          if(error){
              throw error;
          } else {
            
            
            connection.query('SELECT a.*,b.* FROM clientesAdministracion a, bloques b WHERE a.bloque = b.nombreBloque AND a.bloque = ? AND statusServicio = ? ORDER BY a.municipio,a.cp,a.colonia, a.statusServicio',['BLOQUE 2','COMPLETADO'],(error, results3)=>{
              if(error){
                  throw error;
              } else {
                
                
                          const unidades = results2.map(row => row.noEco ); 
                          const datos = req.session.datos;                     
                          res.render('rutasAdmin', {results:results,results3:results3,unidades,datos});              
              }   
          })              
          }   
      })     
      }   
  })
});

app.get('/verRutas',verificarSesion, (req, res)=>{    
  
  const sqlQuery = `
  SELECT 
    *
FROM 
    gasunion.clientesSuministro
WHERE
    (
        (frecuenciaCarga = 'SEMANAL' AND DATE_ADD(ultimaCarga, INTERVAL 7 DAY) = CURDATE()) OR
        (frecuenciaCarga = 'QUINCENAL' AND DATE_ADD(ultimaCarga, INTERVAL 15 DAY) = CURDATE()) OR
        (frecuenciaCarga = 'MENSUAL' AND DATE_ADD(ultimaCarga, INTERVAL 1 MONTH) = CURDATE())
    )
    AND statusServicio != ? 
  `;
  connection.query(sqlQuery,['PENDIENTE'],(error, results3)=>{
      if(error){
          throw error;
      } else {
        connection.query('SELECT * FROM unidades WHERE statusServicio = ?',['INICIADO'],(error, results2)=>{
          if(error){
              throw error;
          } else {
            connection.query('SELECT a.*,b.* FROM clientesAdministracion a, bloques b WHERE a.bloque = b.nombreBloque AND a.bloque = ? AND statusServicio != ?  ORDER BY a.municipio,a.cp,a.colonia, a.statusServicio',['BLOQUE 2','PENDIENTE'],(error, results)=>{
              if(error){
                  throw error;
              } else {
                connection.query('SELECT * FROM usuarios WHERE rol IN (?,?) ', ['OPERADOR','TRIPULANTE'], (error, results5) => {
                  if(error){
                    throw error;
                  } else {
                    const unidades = results2.map(row => row.noEco ); 
                    const datos = req.session.datos;  
                    const operadores = results5.map(row => row.nombre );                    
                    res.render('verRutas', {results:results,results3:results3,unidades,datos,operadores});  
                        }
                })
                             
              }   
          })             
          }   
      })     
      }   
  })
});

app.get('/asignaBloque',verificarSesion, (req, res)=>{    
  
  const sqlQuery = `
  SELECT
  GROUP_CONCAT(noCliente ORDER BY noCliente) AS numerosClientes,
  municipio
FROM
  gasunion.clientesSuministro
WHERE
  (
      (frecuenciaCarga = 'SEMANAL' AND DATE_ADD(ultimaCarga, INTERVAL 7 DAY) = CURDATE()) OR
      (frecuenciaCarga = 'QUINCENAL' AND DATE_ADD(ultimaCarga, INTERVAL 15 DAY) = CURDATE()) OR
      (frecuenciaCarga = 'MENSUAL' AND DATE_ADD(ultimaCarga, INTERVAL 1 MONTH) = CURDATE())
  )
  AND statusServicio = ?
GROUP BY
  municipio;
  `;
  connection.query(sqlQuery,['PENDIENTE'],(error, results)=>{
      if(error){
          throw error;
      } else {
        connection.query('SELECT * FROM unidades WHERE statusServicio = ?',['INICIADO'],(error, results2)=>{
          if(error){
              throw error;
          } else {
            const sqlAdminQuery = `
            SELECT GROUP_CONCAT(noCliente) AS numerosClientes, municipio
            FROM gasunion.clientesAdministracion
            	WHERE statusServicio = ?
                AND bloque = ?
            GROUP BY municipio
            ORDER BY municipio
            `;
            connection.query(sqlAdminQuery,['PENDIENTE','BLOQUE 2'],(error, results3)=>{
              if(error){
                  throw error;
              } else {
                 const unidades = results2.map(row => row.noEco ); 
                 const datos = req.session.datos;                     
                 res.render('asignaBloque', {results:results,results3:results3,unidades,datos});              
              }   
          })             
          }   
      })     
      }   
  })
});

app.get('/prepSum',verificarSesion, (req, res)=>{     
  
            connection.query('SELECT * FROM clientesSuministro  ORDER BY municipio,cp,ultimaCarga',(error, results)=>{
              if(error){
                  throw error;
              } else {
                      
                      const datos = req.session.datos;                     
                      res.render('prepSum', {results:results,datos});  
                
                          
              }   
          })
            
                      
          
      
});

app.get('/rutasSum',verificarSesion, (req, res)=>{ 
  const sqlQuery = `
  SELECT 
    *
FROM 
    clientesSuministro
WHERE
    (
        (frecuenciaCarga = 'SEMANAL' AND DATE_ADD(ultimaCarga, INTERVAL 7 DAY) = CURDATE()) OR
        (frecuenciaCarga = 'QUINCENAL' AND DATE_ADD(ultimaCarga, INTERVAL 15 DAY) = CURDATE()) OR
        (frecuenciaCarga = 'MENSUAL' AND DATE_ADD(ultimaCarga, INTERVAL 1 MONTH) = CURDATE())
    )
    AND statusServicio != ?
`;
  connection.query(sqlQuery,['COMPLETADO'],(error, results)=>{
      if(error){
          throw error;
      } else {
        connection.query('SELECT * FROM unidades WHERE statusServicio = ?',['INICIADO'],(error, results2)=>{
          if(error){
              throw error;
          } else {
            const sqlQuery2 = `
            SELECT 
    *
FROM 
    gasunion.clientesSuministro
WHERE
    (
        (frecuenciaCarga = 'SEMANAL' AND DATE_ADD(ultimaCarga, INTERVAL 7 DAY) = CURDATE()) OR
        (frecuenciaCarga = 'QUINCENAL' AND DATE_ADD(ultimaCarga, INTERVAL 15 DAY) = CURDATE()) OR
        (frecuenciaCarga = 'MENSUAL' AND DATE_ADD(ultimaCarga, INTERVAL 1 MONTH) = CURDATE())
    )
    AND statusServicio = ?
`;
            connection.query(sqlQuery2,['COMPLETADO'],(error, results3)=>{
              if(error){
                  throw error;
              } else {
                      const unidades = results2.map(row => row.noEco ); 
                      const datos = req.session.datos;                     
                      res.render('rutasSum', {results:results,results3:results3,unidades,datos});  
                
                          
              }   
          })
            
                      
          }   
      })
        
                  
      }   
  })
});


app.get('/gestionServicios',verificarSesion, (req, res)=>{     
  connection.query('SELECT a.*,b.* FROM serviciosAsignadosAdmin a, clientesAdministracion b WHERE a.noCliente = b.noCliente AND a.statusServicio != ?  ORDER BY a.statusServicio',['PENDIENTE'],(error, results)=>{
      if(error){
          throw error;
      } else {
        connection.query('SELECT * FROM unidades WHERE statusServicio = ?',['INICIADO'],(error, results2)=>{
          if(error){
              throw error;
          } else {
            connection.query('SELECT a.*,b.* FROM serviciosAsignadosSuministro a, clientesSuministro b WHERE a.noCliente = b.noCliente AND a.statusServicio != ?  ORDER BY a.statusServicio',['PENDIENTE'],(error, results3)=>{
              if(error){
                  throw error;
              } else {
                      const unidades = results2.map(row => row.noEco ); 
                      const datos = req.session.datos;                     
                      res.render('gestionServicios', {results:results,results3:results3,unidades,datos});  
                
                          
              }   
          })
            
                      
          }   
      })
        
                  
      }   
  })
});


app.post('/updateAdminService',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const noEco = req.body.selectedOption;
  const status = 'ASIGNADO';
  connection.query('UPDATE clientesAdministracion SET statusServicio = ?, unidadCarga = ? WHERE noCliente = ?',[status,noEco,noCliente],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/updateSumService',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const noEco = req.body.selectedOption;
  const status = 'ASIGNADO';
  connection.query('UPDATE clientesSuministro SET statusServicio = ?, unidadCarga = ? WHERE noCliente = ?',[status,noEco,noCliente],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/marcarCompletada',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const status = 'COMPLETADO';
  connection.query('UPDATE clientesAdministracion SET statusServicio = ? WHERE noCliente = ?',[status,noCliente],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/marcarCompletadaSum',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const status = 'COMPLETADO';
  connection.query('UPDATE clientesSuministro SET statusServicio = ? WHERE noCliente = ?',[status,noCliente],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/marcarReagendar',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const status = 'REAGENDADO';
  connection.query('UPDATE clientesAdministracion SET statusServicio = ? WHERE noCliente = ?',[status,noCliente],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/marcarReagendarSum',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const status = 'REAGENDADO';
  connection.query('UPDATE clientesSuministro SET statusServicio = ? WHERE noCliente = ?',[status,noCliente],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/marcarCancelacion',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const motivo = req.body.motivoSeleccionado;
  const status = 'CANCELADO';
  connection.query('UPDATE clientesAdministracion SET statusServicio = ?, observaciones = ? WHERE noCliente = ?',[status,motivo,noCliente],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/marcarCancelacionSum',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const motivo = req.body.motivoSeleccionado;
  const status = 'CANCELADO';
  connection.query('UPDATE clientesSuministro SET statusServicio = ?, observaciones = ? WHERE noCliente = ?',[status,motivo,noCliente],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/confirmaReagenda',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const fecha = req.body.fechaReagendar;
  const status = 'PENDIENTE';
  connection.query('UPDATE clientesAdministracion SET statusServicio = ?, proximaCarga = ? WHERE noCliente = ?',[status,fecha,noCliente],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/confirmaReagendaSum',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const fecha = req.body.fechaReagendar;
  const status = 'PENDIENTE';
  connection.query('UPDATE clientesSuministro SET statusServicio = ?, proximaCarga = ? WHERE noCliente = ?',[status,fecha,noCliente],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});






app.post('/terminarAdmin',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const status = req.body.selectedOption;
 
  connection.query('UPDATE serviciosAsignadosAdmin SET ? WHERE noCliente = ? AND statusServicio = ?',[{statusServicio:status,fecha:fechaActual},noCliente,'PENDIENTE'],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/terminarSum',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const status = req.body.selected;
 
  connection.query('UPDATE serviciosAsignadosSuministro SET ? WHERE noCliente = ? AND statusServicio = ?',[{statusServicio:status,fecha:fechaActual},noCliente,'PENDIENTE'],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/asignaBloqueAdministracion',verificarSesion, (req, res)=>{    
  const numerosClientes = req.body.numerosClientes;
  const ruta = req.body.selectedAdminRoute;
 
  connection.query('UPDATE clientesAdministracion SET statusServicio = ?, unidadCarga = ? WHERE noCliente IN (?)',['ASIGNADO',ruta,numerosClientes],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/asignaBloqueSuministro',verificarSesion, (req, res)=>{    
  const noCliente = req.body.noCliente;
  const status = req.body.selected;
 
  connection.query('UPDATE serviciosAsignadosSuministro SET ? WHERE noCliente = ? AND statusServicio = ?',[{statusServicio:status,fecha:fechaActual},noCliente,'PENDIENTE'],(error, results)=>{
      if(error){
          throw error;
          res.status(500).json({ success: false, message: 'Error al insertar en la base de datos.' });
      } else {
        res.json({ success: true, message: 'Opción guardada con éxito.' });
        
                  
      }   
  })
});

app.post('/asignar-unidad-admin', (req, res) => {
  const { clienteIds, unidad } = req.body;

  if (!clienteIds || !clienteIds.length) {
    return res.status(400).json({ error: 'IDs de clientes no proporcionados.' });
  }

  // Construye la consulta SQL
  const queryString = `UPDATE clientesAdministracion SET unidadCarga = ?, statusServicio = 'ASIGNADO' WHERE noCliente IN (?)`;
  console.log(queryString);
  // Ejecuta la consulta con los IDs de clientes
  connection.query(queryString, [unidad,clienteIds], (error, results) => {
    if (error) {
      console.error('Error al actualizar:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }

    console.log('Actualización exitosa:', results);
    res.json({ message: 'Actualización exitosa.' });
  });
});

app.post('/asignar-unidad-sum', (req, res) => {
  const { clienteIds, unidad } = req.body;

  if (!clienteIds || !clienteIds.length) {
    return res.status(400).json({ error: 'IDs de clientes no proporcionados.' });
  }

  // Construye la consulta SQL
  const queryString = `UPDATE clientesSuministro SET unidadCarga = ?, statusServicio = 'ASIGNADO' WHERE noCliente IN (?)`;
  console.log(queryString);
  // Ejecuta la consulta con los IDs de clientes
  connection.query(queryString, [unidad,clienteIds], (error, results) => {
    if (error) {
      console.error('Error al actualizar:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }

    console.log('Actualización exitosa:', results);
    res.json({ message: 'Actualización exitosa.' });
  });
});

app.use('/', require('./router'));



// Iniciar el servidor

app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});


process.on('SIGINT', () => {
  conexion.end();
  process.exit();
});