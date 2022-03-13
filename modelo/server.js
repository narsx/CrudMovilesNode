const express = require('express');
require('dotenv').config();
const bcryptjs = require('bcryptjs');
const { dbConnection } = require('../database/config')
const Movil = require('./moviles');
const { body, validationResult, check } = require('express-validator');
const { validarJWT } = require('../middleware/validar-JWT');
const port = process.env.PORT;
const Usuario = require('./usuario');
const { generarJWT } = require("../helpers/generarJWT");
const {OAuth2Client} = require('google-auth-library');
const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid'); 
class Server {
    constructor() {
        this.app = express();
        this.conectarDB();
        this.middlewares();
        this.rutas();
    }
    middlewares() {
        this.app.use(express.json())//Middleware para leer json;
        this.app.use(express.static('public'));
        //^Middleware para servir la carpeta public
        this.app.use(fileUpload({
          useTempFiles: true,
          tempFileDir: '/tmp/'
        }));
    }
    async conectarDB() {
        await dbConnection()
    }
    rutas() {
         /******* RUTAS DEL LOGIN *****/
         this.app.post(
            "/login",
            check("correo", "El correo no es válido").isEmail(),
            check("password", "La contraseña no puede ser vacía").not().isEmpty(),
            async function (req, res) {
              const erroresVal = validationResult(req);
              //comprueba si ha habido errores en los checks
              if (!erroresVal.isEmpty()) {
                return res.status(400).json({ msg: erroresVal.array() });
              }
              const { correo, password } = req.body;
              try {
                //verifico si el correo existe en la BD
                const miusuario = await Usuario.findOne({ correo });
                if (!miusuario) {
                  res.status(400).json({
                    msg: "El correo no existe",
                    correo,
                  });
                } else {
                  //verifico la contraseña
                  const validPassword = bcryptjs.compareSync(
                    password,
                    miusuario.password
                  );
                  if (!validPassword) {
                    res.status(400).json({
                      msg: "El password no es correcto",
                    });
                  } else {
                    //genero el JWT
                    const token = await generarJWT(miusuario.id);
                    const id = miusuario.id;
                    res.json({
                      msg: "Login OK",
                      token,
                      id,
                    });
                  }
                }
              } catch (error) {
                console.log(error);
                res.status(500).json({
                  msg: "Error de autenticación",
                });
              }
            }
          );
        //Get muestra los movilesse require pasarle la id.
        this.app.get('/webresources/generic/movil/:id', async function (req, res) {
            const id = req.params.id;
            let moviles = await Movil.findById(id);
            res.json(
                moviles

            )
        })
        //Get muestas todos los moviles
        this.app.get('/webresources/generic/moviles', async function (req, res) {
            let moviles = await Movil.find();
            res.json(
                moviles
            )
        })
        /*Post moviles */
        this.app.post('/webresources/generic/moviles', function (req, res) {
            const body = req.body;
            let miMovil = new Movil(body);
            miMovil.save();
            res.json({
                ok: true,
                msg: 'post API Moviles',
                miMovil
            })
        })
        //put-MOVILES
        this.app.put('/webresources/generic/moviles/:id', async function (req, res) {
            const body = req.body;
            const id = req.params.id;
            await Movil.findByIdAndUpdate(id, body);
            res.json({
                ok: true,
                msg: 'post API Moviles',
                body
            })
        })
        //delete-MOVILES
        this.app.delete('/webresources/generic/moviles/:id', async function (req, res) {
            const id = req.params.id;
            await Movil.findByIdAndDelete(id);
            res.status(200).json({
                ok: true,
                msg: 'delete API'
            })
        })
             /******* RUTAS DE GOOGLE *****/
             this.app.post(
                "/google",
                check("id_token", "El token es necesario").not().isEmpty(),
                async function (req, res) {
                  const erroresVal = validationResult(req);
                  //comprueba de errores en los checks
                  if (!erroresVal.isEmpty()) {
                    return res.status(400).json({ msg: erroresVal.array() });
                  }
                    const { id_token } = req.body;
                    const { OAuth2Client } = require("google-auth-library");
                    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      
                  try {
                    
      
                    const ticket = await client.verifyIdToken({
                      idToken: id_token,
                      audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
                      // Or, if multiple clients access the backend:
                      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
                    });
                    const payload = ticket.getPayload();
                    console.log('PAYLOAD', payload);
                    const correo = payload.email;
                    const img = payload.picture;
                    const nombre = payload.name;
                    let miusuario = await Usuario.findOne({ correo });
                    if (!miusuario) {
                      let data = {
                        nombre, correo, password: "123", img, google: true,
                        rol: 'USER_ROLE'
                      }
                      miusuario = new Usuario(data);
                      await miusuario.save();
                      console.log('Usuario a crear', miusuario);
                    }
                    // If request specified a G Suite domain:
                    // const domain = payload['hd'];
      
                    /**** GENERO UN TOKEN VALIDO ****/
                    const tokenGenerado = await generarJWT(miusuario.id);
                    const id = miusuario.id;
      
                    //******** ENVÍO UN RESPUESTA */
                    res.json({
                      msg: "Todo bien con Google",
                      id_token,
                      token: tokenGenerado,
                      miusuario
                    });
                  } catch (error) {
                    res.json({
                      msg: "ERROR DE VERIFICACION DE GMAIL",
                      id_token
                    });
                  }
                }
              );
                   /**** RUTA SUBIR ARCHIVOS ****/
    this.app.post(
      "/subir",
      
      async function (req, res) {
        if(!req.files){
          res.status(400).json({
            msg:'No se han mandado archivos',
          });
        }
        
        /* Esperamos un archivo con el nombre de un archivo */
        if(!req.files.imagen){
          res.status(400).json({
            msg:'No se han mandado archivos',
          });
        }else{
          const imagen = req.files.imagen;
          const nombreCortado = imagen.name.split(".");
          const extension = nombreCortado[nombreCortado.length -1];
          //Validar la extension
          const extensionesValidar = ['jpg','png','jpeg','gif'];
          if(!extensionesValidar.includes( extension )){
            return res.status(400).json({
              msg: `La extension ${extension} no está permitida, ${extensionesValidar}`,
            });
          }
          //Cambia el nombre 
          const nombreTemp = uuidv4() + "." + extension;
          const path = require('path');
          const uploadPath = path.join(__dirname,'../public/imagenes/',nombreTemp);
          imagen.mv(uploadPath,function(err){
            if(err){
              return res.status(500).json(err);
            }
            res.status(200).json({
              msg:'Archivo subido con exito',
              uploadPath,
              extension,
              nombreTemp
            });
          });
        }
      });
        /******* RUTAS DEL USUARIO */
        this.app.get('/', function (req, res) {

        })
        this.app.get('/api', async function (req, res) {
            let usuarios = await Usuario.find();
            res.status(403).json({
                ok: true,
                msg: 'get API',
                usuarios
            })
        })
        this.app.get('/suma', function (req, res) {
            const num1 = Number(req.query.num1);
            const num2 = Number(req.query.num2);
            res.send(`La suma de ${num1} y ${num2} es ${(num1) + (num2)}`)
        })

        this.app.post('/api',
            body('correo').isEmail(),
            check('nombre', 'El nombre es obligatorio').not().isEmpty(),
            check('password', 'El password debe tener al menos 6 caracteres').isLength({ min: 6 }),
            check('rol', 'El rol no es válido').isIn(['ADMIN_ROLE', 'USER_ROLE']),
            check('correo').custom(
                async function (correo) {
                    const existeCorreo = await Usuario.findOne({ correo });
                    if (existeCorreo) {
                        throw new Error(`El correo ${correo} YA está en la BD`)
                    }
                }

            ),


            function (req, res) {
                const body = req.body;
                let usuario = new Usuario(body);
                //valida el correo
                const erroresVal = validationResult(req);
                if (!erroresVal.isEmpty()) {
                    return res.status(400).json({ msg: erroresVal.array() });
                }
                //**** le hago el hash a la contraseña */
                const salt = bcryptjs.genSaltSync();
                usuario.password = bcryptjs.hashSync(usuario.password, salt)
                usuario.save();
                res.json({
                    ok: true,
                    msg: 'post API',
                    usuario
                })
            })
        this.app.put('/api/:id', async function (req, res) {
            const id = req.params.id;
            let { password, ...resto } = req.body;
            //**** le hago el hash a la contraseña */
            const salt = bcryptjs.genSaltSync();
            password = bcryptjs.hashSync(password, salt);
            resto.password = password;
            await Usuario.findByIdAndUpdate(id, resto);
            res.status(403).json({
                ok: true,
                msg: 'put API',
                id,
                resto
            })
        })
        this.app.delete('/api/:id', validarJWT, async function (req, res) {
            const id = req.params.id;
            await Usuario.findByIdAndDelete(id);
            res.status(403).json({
                ok: true,
                msg: 'delete API'
            })
        })
        this.app.get('/saludo', function (req, res) {
            res.send('<h1>Hola 2DAW</h1>')
        })
        this.app.get('*', function (req, res) {
            res.sendFile(__dirname + '/404.html')
        })
        
    }


    listen() {
        this.app.listen(port, function () {
            console.log('Escuchando el puerto', port)
        });
    }
}
module.exports = Server;