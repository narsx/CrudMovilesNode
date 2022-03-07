const mongoose = require('mongoose');
const dbConnection = async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_CNN, {
            useNewUrlParser:true,
            useUnifiedTopology:true
           
        });
        console.log('Base de datos ONLINE ')
    }
    catch( error ) {
        console.log(error);
        throw new Error('Error al iniciar al base de datos');
    }
}
module.exports = {dbConnection};