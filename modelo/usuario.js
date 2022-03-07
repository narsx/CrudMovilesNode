const mongoose = require('mongoose');
const UsuarioSchema = mongoose.Schema(
{
    nombre: {
        type:String,
        required: [true,'El nombre es obligatorio']
    },
    correo: {
        type:String,
        required: [true,'El nombre es obligatorio']
    },
    password: {
        type:String,
        required: [true,'La contraseña es obligatoria']
    },
    img: {
        type:String
    },
    rol: {
        type:String,
        default: [ 'ADMIN_ROLE','USER_ROLE']
    },
    estado: {
        type: Boolean,
        default:true
    },
    google: {
        type: Boolean,
        default:true
    }
}
)
let Usuario = mongoose.model('Usuario',UsuarioSchema);
module.exports = Usuario;