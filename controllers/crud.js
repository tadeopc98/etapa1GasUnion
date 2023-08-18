//Invocamos a la conexion de la DB
const express = require('express');
const session = require('express-session');
const createConnection = require('../database');
const connection = createConnection();
const toastr = require('toastr');



const fechaActual = new Date(); //Fecha actual
const horaActual = fechaActual.getHours();
const minActual = fechaActual.getMinutes();
const segActual = fechaActual.getSeconds()
const horaCompleta = horaActual + ':' + minActual + ':' + segActual;
const diaActual = fechaActual.getDate();
const mesActual = fechaActual.getMonth()+1;
const anioActual = fechaActual.getFullYear();
const fechaCompleta = anioActual + '-' + mesActual + '-' + diaActual;

//GUARDAR un REGISTRO
exports.saveUser = (req, res)=>{
    const nombre = req.body.nombre.toUpperCase();
    const num = req.body.num;
    const user = req.body.username;
    const pass = req.body.pass;
    const rol = req.body.rol.toUpperCase();
    const st = req.body.st.toUpperCase();
    
    connection.query('SELECT COUNT(*) AS count FROM usuarios WHERE noEmpleado = ?',[num], (error, countResult)=>{
        if(error){
            console.log(error);
        }else{
            const existingCount = countResult[0].count;
            if (existingCount === 0)
            {
                connection.query('INSERT INTO usuarios SET ?',{nombre:nombre,noEmpleado:num,username:user,password:pass,rol:rol,status:st}, (error, results)=>{
                    if(error){
                        console.log(error);
                    }else{
                        
                        res.redirect('/usersControlAdmin');
                               
                    }
            });   
            }
            else{
                
                res.redirect('/addUser');
            
            }
               
        }
});
};

exports.saveClientSuministro = (req, res)=>{
    const noCliente = req.body.noCliente;
    const fecRegistro = fechaCompleta;
    const usuarioRegistro = req.body.usuarioReg.toUpperCase();
    const status = req.body.status;
    const nombreCliente = req.body.nombre.toUpperCase();
    const razonSocial = req.body.razonSocial.toUpperCase();
    const obser = req.body.observaciones.toUpperCase();
    const telefono = req.body.telefono.toUpperCase();
    const telefonoFijo = req.body.telFijo.toUpperCase();
    const correo = req.body.correo.toLowerCase();
    const correo2 = req.body.correo2.toLowerCase();
    const calle = req.body.calle.toUpperCase();
    const noExt = req.body.noExterior.toUpperCase();
    const noInt = req.body.noInterior.toUpperCase();
    const cp = req.body.cp;
    const colonia = req.body.colonia.toUpperCase();
    const municipio = req.body.municipio.toUpperCase();
    const estado = req.body.estado.toUpperCase();
    const direccion = calle+' #'+noExt+', '+noInt+', '+colonia+', '+municipio+', C.P. '+cp+', '+estado;
          direccion.toUpperCase();
    const frecCarga = req.body.frecCarga.toUpperCase();
    const diaCarga = req.body.diaCarga.toUpperCase();
    const pagoPref = req.body.tipoPago.toUpperCase();
    const tipoCliente = req.body.tipoCliente.toUpperCase();
 
    connection.query('INSERT INTO clientesSuministro SET ?',{noCliente:noCliente,fecRegistro:fecRegistro,usuarioRegistro:usuarioRegistro,statusCliente:status,nombreCliente:nombreCliente,
                                                   razonSocial:razonSocial,observaciones:obser,telefonoCelular:telefono,telefonoFijo:telefonoFijo,
                                                   correoCliente:correo,correoAlternativo:correo2,calle:calle,noExterior:noExt,noInterior:noInt,cp:cp,colonia:colonia,
                                                   municipio:municipio,estado:estado,direccion:direccion,frecuenciaCarga:frecCarga,diaCarga:diaCarga,tipoPago:pagoPref,
                                                   tipoCliente:tipoCliente}, (error, results)=>{
        if(error){
            console.log(error);
        }else{
            res.redirect('/clientesSuministroAdmin');          
        }
});
};

exports.saveClientAdministracion = (req, res)=>{
    const noCliente = req.body.noCliente;
    const fecRegistro = fechaCompleta;
    const usuarioRegistro = req.body.usuarioReg.toUpperCase();
    const status = req.body.status;
    const nombreCliente = req.body.nombre.toUpperCase();
    const razonSocial = req.body.razonSocial.toUpperCase();
    const obser = req.body.observaciones.toUpperCase();
    const nombreAdministracion = req.body.nombreAdmin.toUpperCase();
    const residente = req.body.residente.toUpperCase();
    const telefono = req.body.telefono.toUpperCase();
    const telefonoFijo = req.body.telFijo.toUpperCase();
    const correo = req.body.correo.toLowerCase();
    const correo2 = req.body.correo2.toLowerCase();
    const calle = req.body.calle.toUpperCase();
    const noExt = req.body.noExterior.toUpperCase();
    const noInt = req.body.noInterior.toUpperCase();
    const cp = req.body.cp;
    const colonia = req.body.colonia.toUpperCase();
    const municipio = req.body.municipio.toUpperCase();
    const estado = req.body.estado.toUpperCase();
    const direccion = calle+' #'+noExt+', '+noInt+', '+colonia+', '+municipio+', C.P. '+cp+', '+estado;
          direccion.toUpperCase();
    const pagoPref = req.body.tipoPago.toUpperCase();
    const bloque = req.body.bloque.toUpperCase();
    const tipoCliente = req.body.tipoCliente.toUpperCase();
    const diaCarga = req.body.diaCarga.toUpperCase();
    
 
    connection.query('INSERT INTO clientesAdministracion SET ?',{noCliente:noCliente,fecRegistro:fecRegistro,usuarioRegistro:usuarioRegistro,statusCliente:status,nombreCliente:nombreCliente,
                                                   razonSocial:razonSocial,observaciones:obser,nombreAdministracion:nombreAdministracion,residente:residente,telefonoCelular:telefono,telefonoFijo:telefonoFijo,
                                                   correoAdministracion:correo,correoAlternativo:correo2,calle:calle,noExterior:noExt,noInterior:noInt,cp:cp,colonia:colonia,
                                                   municipio:municipio,estado:estado,direccion:direccion,tipoPago:pagoPref,bloque:bloque,
                                                   tipoCliente:tipoCliente,diaCarga:diaCarga}, (error, results)=>{
        if(error){
            console.log(error);
        }else{
            res.redirect('/clientesAdministracionAdmin');          
        }
});
};


//ACTUALIZAR un REGISTRO
exports.updateUser = (req, res)=>{
    const id = req.body.id;
    const nombre = req.body.nombre.toUpperCase();
    const num = req.body.num;
    const user = req.body.user;
    const pass = req.body.pass;
    const rol = req.body.rol;
    const st = req.body.st.toUpperCase();

    connection.query('UPDATE usuarios SET ? WHERE noEmpleado = ?',[{nombre:nombre,username:user,status:req.body.st}, num], (error, results)=>{
        if(error){
            console.log(error);
        }else{           
            res.redirect('/dashboard/UsersControlAdmin');         
        }
});
};

exports.updateSuministro = (req, res)=>{
    const noCliente = req.body.noCliente;
    const fecRegistro = fechaCompleta;
    const usuarioRegistro = req.body.usuarioReg.toUpperCase();
    const status = req.body.status;
    const nombreCliente = req.body.nombre.toUpperCase();
    const razonSocial = req.body.razonSocial.toUpperCase();
    const obser = req.body.observaciones.toUpperCase();
    const telefono = req.body.telefono.toUpperCase();
    const telefonoFijo = req.body.telFijo.toUpperCase();
    const correo = req.body.correo.toLowerCase();
    const correo2 = req.body.correo2.toLowerCase();
    const calle = req.body.calle.toUpperCase();
    const noExt = req.body.noExterior;
    const noInt = req.body.noInterior;
    const cp = req.body.cp;
    const colonia = req.body.colonia.toUpperCase();
    const municipio = req.body.municipio.toUpperCase();
    const estado = req.body.estado.toUpperCase();
    const direccion = calle+' #'+noExt+', '+noInt+', '+colonia+', '+municipio+', C.P. '+cp+', '+estado;
          direccion.toUpperCase();
    const frecCarga = req.body.frecCarga.toUpperCase();
    const diaCarga = req.body.diaCarga.toUpperCase();
    const pagoPref = req.body.tipoPago.toUpperCase();
    const tipoCliente = req.body.tipoCliente.toUpperCase();

    connection.query('UPDATE clientesSuministro SET ? WHERE noCliente = ?',[{statusCliente:status,
                                                                    razonSocial:razonSocial,observaciones:obser,telefonoCelular:telefono,telefonoFijo:telefonoFijo,
                                                                    correoCliente:correo,correoAlternativo:correo2,calle:calle,noExterior:noExt,noInterior:noInt,cp:cp,colonia:colonia,
                                                                    municipio:municipio,estado:estado,direccion:direccion,frecuenciaCarga:frecCarga,diaCarga:diaCarga,tipoPago:pagoPref,
                                                                    },noCliente], (error, results)=>{
        if(error){
            console.log(error);
        }else{
            const datos = req.session.datos;
            if(datos.rol === 'ADMINISTRADOR'){ 
                res.redirect('/clientesSuministroAdmin');
            }
            else if(datos.rol === 'SUPERVISOR')
            {
                res.redirect('/clientesSuministroSupervisor')
            }                
        }
});
};

exports.updateAdministracion = (req, res)=>{
    const noCliente = req.body.noCliente;
    const fecRegistro = fechaCompleta;
    const usuarioRegistro = req.body.usuarioReg.toUpperCase();
    const status = req.body.status;
    const nombreCliente = req.body.nombre.toUpperCase();
    const razonSocial = req.body.razonSocial.toUpperCase();
    const obser = req.body.observaciones.toUpperCase();
    const nombreAdministracion = req.body.nombreAdmin.toUpperCase();
    const residente = req.body.residente.toUpperCase();
    const telefono = req.body.telefono.toUpperCase();
    const telefonoFijo = req.body.telFijo.toUpperCase();
    const correo = req.body.correo.toLowerCase();
    const correo2 = req.body.correo2.toLowerCase();
    const calle = req.body.calle.toUpperCase();
    const noExt = req.body.noExterior.toUpperCase();
    const noInt = req.body.noInterior.toUpperCase();
    const cp = req.body.cp;
    const colonia = req.body.colonia.toUpperCase();
    const municipio = req.body.municipio.toUpperCase();
    const estado = req.body.estado.toUpperCase();
    const direccion = calle+' #'+noExt+', '+noInt+', '+colonia+', '+municipio+', C.P. '+cp+', '+estado;
          direccion.toUpperCase();
    const pagoPref = req.body.tipoPago.toUpperCase();
    const bloque = req.body.bloque.toUpperCase();
    const tipoCliente = req.body.tipoCliente.toUpperCase();
    const diaCarga = req.body.diaCarga.toUpperCase();

    connection.query('UPDATE clientesAdministracion SET ? WHERE noCliente = ?',[{statusCliente:status,
                                                                            razonSocial:razonSocial,observaciones:obser,nombreAdministracion:nombreAdministracion,residente:residente,telefonoCelular:telefono,telefonoFijo:telefonoFijo,
                                                                            correoAdministracion:correo,correoAlternativo:correo2,calle:calle,noExterior:noExt,noInterior:noInt,cp:cp,colonia:colonia,
                                                                            municipio:municipio,estado:estado,direccion:direccion,tipoPago:pagoPref,bloque:bloque,
                                                                            diaCarga:diaCarga},noCliente], (error, results)=>{
        if(error){
            console.log(error);
        }else{
            const datos = req.session.datos;
            if(datos.rol === 'ADMINISTRADOR'){
                res.redirect('/clientesAdministracionAdmin');
            }
            else if(datos.rol === 'SUPERVISOR'){
                res.redirect('/clientesAdministracionSupervisor');
            }                
        }
});
};




