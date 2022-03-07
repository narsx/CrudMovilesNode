const mongoose = require('mongoose');
const RolSchema = mongoose.Schema(
{
    rol: {
        type:String,
        required: [true,'El rol es obligatorio']
    }
}
)
let Rol = mongoose.model('Role',RolSchema);
module.exports = Rol;