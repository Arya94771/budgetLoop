const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken =(id)=>jwt.sign({id},process.env.JWT_SECRET,{expiresIn:'7d'});
exports.register=async(req,res)=>{
  const {name,email,password}=req.body;

  if(!name || !email || !password) {
    return res.status(400).json({message:'Please provide name, email and password'});
    }
  if(password.length<6){
    return res.status(400).json({message:'Password must be at least 6 characters'});
  }

  const exists=await User.findOne({email});
  if(exists){
    return res.status(400).json({message:'Email already exists'});
  }
  const hashed=await bcrypt.hash(password,10);
  const user=await User.create({name,email,password:hashed});
  const token=signToken(user._id);
  res.status(201).json({token,user:{id:user._id,name:user.name,email:user.email}});
}
exports.login=async(req,res)=>{
  const {email,password}=req.body;
  if(!email || !password){
    return res.status(400).json({message:'Please provide email and password'});
  }

  const user=await User.findOne({email}).select('+password');
  const match=user&&(await bcrypt.compare(password,user.password));
  if(!match){
    return res.status(400).json({message:'Invalid email or password'});
  }
  res.json({token:signToken(user._id),user:{id:user._id,name:user.name,email:user.email}});
};