const express = require('express');
const mysql = require("mysql")
const dotenv = require('dotenv')
const path = require("path")
const bcrypt = require("bcryptjs")

const publicDir = path.join(__dirname, './public')


const app = express();
const db = mysql.createConnection({
    host: 'localhost',
    port: 3701,
    user: 'root',
    database: 'login-db',
})

db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("MySQL connected!")
    }
})
app.set('view engine', 'hbs')
app.use(express.static("views"));

app.get("/", (req, res) => {
    res.render("index")
})

app.use(express.urlencoded({extended: 'false'}))
app.use(express.json())

app.post("/signup", (req, res) => {    
    const {email, password, password_confirm } = req.body
    check_query = "SELECT * from users WHERE Email=?;"
    let user_email =[[email]]
    db.query(check_query,user_email,async(err,result)=>{
        if(err){
            console.log(err)
        }
        if (result.length!=0){
            return res.render('index',{message:'Email already Registered'})
        }
        if (password!=password_confirm){
            return res.render('index',{message:'passwords dont match'})
        }
        
        insert_query="INSERT INTO USERS (Email,Password) VALUES ?;"
        let hashedPassword = await bcrypt.hash(password, 8)
        let value=[[email, hashedPassword]]
        db.query(insert_query,[value],(err,result2)=>{
            if (err){
                console.log(err)
            }
            else{
                console.log("Registration successful")
                return res.render('index',{message:'User Registration Successful!'})
            }
            
        })


    })
})

app.post("/login",(req,res)=>{
    const {email, password, } = req.body
    check_query = "SELECT * from users WHERE Email=?;"
    let user_email =[[email]]
    db.query(check_query,user_email,async(err,result)=>{
        if (err){
            console.log(err)
        }
        else{
            if (result.length==0){
                res.render('index',{message:'Email not registered'})
            }
            else{
                if(!bcrypt.compare(password,result[0].Password)){
                    
                    res.render('index',{message:'Wrong Password'})
                }
                else{
                    res.render('index',{message:'Successful... Redirecting '})
                }
            }
            
        }
    })


})

app.listen(5000, ()=> {
    console.log("server started on port 5000")
})



