const mongoose = require('mongoose');
const MovilesSchema = mongoose.Schema(
{
    nombre: {
        type:String,
        required: [true,'El nombre es obligatorio']
    },
    terminal: {
        type:String,
        required: [true,'El terminal es obligatorio']
    },
    anio_lanzamiento: {
        type:String,
        required: [true,'El año de lanzamiento es obligatorio']
    },
    sistema: {
        type:String
    },
    imagen:{
        type:String 
    },
}
)

MovilesSchema.methods.toJSON = function() {
    const { _id,...movil} = this.toObject() ;
    movil.id=_id;
    return movil;
}

let Movil = mongoose.model('Movil',MovilesSchema);
module.exports = Movil;