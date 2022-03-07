const {response,request} = require('express');
const jwt = require('jsonwebtoken');
const validarJWT = (req=request,res=response,next)=>
{
    const token = req.header('x-token');
    if (!token) {
        return res.status(401).json({
            msg:'No hay token en la petición'
        })
    }
    try {
        const payload = jwt.verify(token,process.env.SECRETORPRIVATEKEY);
        console.log('PAYLOAD:',payload);
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({
            msg:'El token no es válido'
        })
    }
}
module.exports = {validarJWT }
