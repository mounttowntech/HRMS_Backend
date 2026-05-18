const jwt = require("jsonwebtoken");
exports.verifyToken = (req,res,next)=>{
 try{
  const h=req.headers.authorization;
  if(!h) return res.status(401).json({success:false,message:"No token provided"});
  const token=h.startsWith("Bearer ")?h.split(" ")[1]:null;
  if(!token) return res.status(401).json({success:false,message:"Invalid token format"});
  const d=jwt.verify(token,process.env.JWT_SECRET);
  req.user={id:d.id,companyId:d.companyId,employeeId:d.employeeId,role:d.role}; next();
 }catch(e){return res.status(401).json({success:false,message:"Token expired or invalid"});}
};
exports.allowRoles=(...roles)=>(req,res,next)=>{
 if(!req.user) return res.status(401).json({success:false,message:"Unauthorized"});
 if(!roles.includes(req.user.role)) return res.status(403).json({success:false,message:`Access denied. Allowed roles: ${roles.join(", ")}`});
 next();
};
