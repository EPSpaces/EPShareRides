const express=require("express"),fs=require("fs"),mongoose=require("mongoose"),{authenticateToken:r,getToken:e}=require("../utils/authUtils"),User=require("../schemas/User.model.js"),Event=require("../schemas/Event.model.js"),ObjectId=require("mongodb").ObjectId,Carpool=require("../schemas/Carpool.model.js"),router=express.Router();function writeToJSON(r,e){let t=JSON.stringify(e,null,2);fs.writeFile(r,t,r=>{r&&console.error("Error writing to JSON file:",r)})}router.get("/points",e,r,(r,e)=>{let t=require("../database/points.json");e.json(t)}),router.get("/offerToCarpool",e,r,(r,e)=>{let t=require("../database/offerToCarpool.json");e.json(t)}),router.post("/joinCarpool",e,r,async(r,e)=>{let t;try{t=await Carpool.find({})}catch(o){console.error("Error retrieving carpools: "+o),e.status(500).send("Error retrieving carpools");return}let{carpool:a,address:s}=r.body,n=a;if(!n||!s){e.status(400).send("Invalid request");return}let i=r.email,l;try{if(!(l=await User.findOne({email:i}))){e.clearCookie("authToken"),e.redirect("/signin?err=Error with system finding User, please try again");return}}catch(d){console.error("Error finding user: "+d),e.clearCookie("authToken"),e.redirect("/signin?err=Internal server error, please sign in again");return}firstName=l.firstName,lastName=l.lastName;let c={email:r.email,firstName,lastName,address:s};try{if(!(a=await Carpool.findById(n))){e.status(404).send("Carpool not found");return}if(a.carpoolers.length>=a.seats){e.status(400).send("Carpool is full");return}let u=a.carpoolers.some(e=>e.email===r.email);if(u){e.status(409).send("You are already in this carpool");return}let p=await Carpool.findByIdAndUpdate(n,{$push:{carpoolers:c}},{new:!0});e.status(200).send(p)}catch(g){console.error("Error:",g),e.status(500).send("Internal Server Error")}e.status(200)}),router.get("/events",e,r,async(r,e)=>{let t;try{t=await Event.find({})}catch(o){console.error("Error getting events: "+o),e.status(500).send("Error getting events");return}e.json(t)}),router.post("/events",e,r,async(r,e)=>{let{eventName:t,wlocation:o,date:a,category:s,addressToPut:n}=r.body,i,l=r.email;try{if(!(i=await User.findOne({email:l}))){e.clearCookie("authToken"),e.redirect("/signin?err=Error with verifing privileges, please try again");return}}catch(d){console.error("Error finding user: "+d),e.clearCookie("authToken"),e.redirect("/signin?err=Internal server error, please sign in again");return}let{firstName:c,lastName:u,admin:p}=i;if(!p){e.sendStatus(401);return}try{let g=new Event({firstName:c,lastName:u,eventName:t,wlocation:o,address:n,date:a,category:s});console.log(g),await g.save()}catch($){console.error("Error saving event: "+$),e.status(500).send("Error saving event");return}e.status(200).send("Event saved")}),router.get("/carpools",e,r,async(r,e)=>{try{let t=await Carpool.find({});e.json(t)}catch(o){console.error("Error retrieving carpools: "+o),e.status(500).send("Error retrieving carpools")}}),router.get("/userCarpools",e,r,async(r,e)=>{let t=[];try{let o=await Carpool.find({email:r.email}).exec(),a=await Carpool.find({"carpoolers.email":r.email}).exec();t=[...o,...a]}catch(s){console.error("Error retrieving carpools: "+s),e.status(500).send("Error retrieving carpools");return}e.json(t)}),router.get("/mapRoute/:id",e,r,async(r,e)=>{let{id:t}=r.params;if(!t){e.status(400).send("Bad Request");return}let o;try{o=await Carpool.findById(t)}catch(a){console.error("Error retrieving carpool: "+a),e.status(500).send("Error retrieving carpool");return}let s;try{s=(s=await Event.findById(new mongoose.Types.ObjectId(o.nameOfEvent))).address}catch(n){console.error("Error retrieving event: "+n),e.status(500).send("Error retrieving event");return}if("point"==o.route)e.json({final:s,stops:[o.wlocation]});else{let i=[];o.carpoolers.forEach(r=>{i.push(r.address)}),e.json({final:s,stops:i})}}),router.get("/carpoolUserCommunication/:id",e,r,async(r,e)=>{let{id:t}=r.params;if(!t){e.status(400).send("Bad Request");return}let o;try{o=new mongoose.Types.ObjectId(t)}catch(a){e.status(400).send("Bad Request");return}let s=[];try{let n=await Carpool.findById(o),i=n.email,l=await User.findOne({email:i}).cell;void 0==l||"none"==l?s.push(i):s.push(l);let d=await Carpool.findById(o).exec(),c=d.carpoolers;for(let u of c){let p=await User.findOne({email:u.email}).cell;"none"==p||void 0==p?s.push(u.email):s.push(p)}}catch(g){console.error("Error getting communication for carpool: "+g),e.status(500).send("Error getting communication for carpool");return}e.json(s)}),router.patch("/carpools/updateRoute/:id",e,r,async(r,e)=>{let{id:t}=r.params,o=new mongoose.Types.ObjectId(t),{route:a,wlocation:s,carpoolers:n}=r.body;if(!a||!s||!n||!t){e.status(400).send("Bad Request");return}try{await Carpool.findByIdAndUpdate(o,{route:a,wlocation:s,carpoolers:n},{new:!0})}catch(i){console.error("Error updating carpool: "+i),e.status(500).send("Error updating carpool");return}e.status(200).send("Carpool updated")}),router.delete("/carpools/:id",e,r,async(r,e)=>{try{let{id:t}=r.params,o=await Carpool.deleteOne({_id:new ObjectId(t)});e.json(o)}catch(a){console.error("Error retrieving carpools: "+a),e.status(500).send("Error retrieving carpools")}}),router.patch("/carpools/deleteCarpooler",e,r,async(r,e)=>{try{let{_id:t,_id2:o}=r.body,a=await Carpool.updateOne({_id:new ObjectId(o)},{$pull:{carpoolers:{_id:new ObjectId(t)}}});e.json(a)}catch(s){console.error("Error updating carpools: "+s),e.status(500).send("Error updating carpools")}}),router.patch("/carpools/:id",e,r,async(r,e)=>{try{let{id:t}=r.params,{route:o,wlocation:a}=r.body,s=await Carpool.updateOne({_id:new ObjectId(t)},{$set:{route:o}},{$set:{wlocation:a}});e.json(s)}catch(n){console.error("Error updating carpools: "+n),e.status(500).send("Error updating carpools")}}),router.patch("/users/update",async(r,e)=>{try{let{_id:t,address:o,privacy:a}=r.body,s=await User.updateOne({_id:new ObjectId(t)},{$set:{address:o,privacy:a}});e.json(s)}catch(n){console.error("Error updating user: "+n),e.status(500).send("Error updating user")}}),router.post("/carpools",e,r,async(r,e)=>{let{firstName:t,lastName:o,seats:a,route:s,wlocation:n,carpoolers:i,nameOfEvent:l,email:d}=r.body;if(!t||!o||!a||!s||!n||!i||!l||!d){e.status(400);return}let c=new Carpool({firstName:t,lastName:o,seats:a,route:s,wlocation:n,carpoolers:i,nameOfEvent:l,email:d});try{await c.save()}catch(u){console.error("Error creating new carpool: "+u),e.status(500).send("Error creating new carpool");return}e.status(200).send("Carpool created")}),router.get("/users",e,r,async(r,e)=>{let t;try{t=await User.find({})}catch(o){console.error("Error getting users: "+o),e.status(500).send("Error getting users");return}e.json(t)}),module.exports=router;
