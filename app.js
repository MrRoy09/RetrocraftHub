const express = require('express');
const mysql = require("mysql")
const dotenv = require('dotenv')
const path = require("path")
const bcrypt = require("bcryptjs")
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { v4: uuidv4 } = require('uuid');
const app = express();

app.use(bodyParser.json())
app.use(cookieParser())
app.use(express.urlencoded({extended: 'false'}))
app.use(express.json())
app.set('view engine', 'hbs')
app.use(express.static("views"));


class Session {
    constructor(username, expiresAt) {
        this.username = username
        this.expiresAt = expiresAt
    }
    isExpired() {
        this.expiresAt < (new Date())
    }
}
const sessions = {}


const db = mysql.createConnection({
    host: 'localhost',
    port: 3701,
    user: 'root',
    database: 'master-db',
})

db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("MySQL connected!")
    }
})


app.get("/", (req, res) => {
    res.render("index")
})

app.get("/home",(req,res)=>{
    console.log(req.cookies['session_token'])
    if (!req.cookies) {
        console.log("check1-fail")
        res.redirect('/')
        return
    }
    const sessionToken = req.cookies['session_token']
    if (!sessionToken) {
        console.log("check2-fail")
        res.redirect('/')
        return
        
    }
    userSession = sessions[sessionToken]
    if (!userSession) {
        console.log("check3-fail")
        res.redirect('/')
        return
        
    }
    if (userSession.isExpired()) {
        console.log("check4-fail")
        delete sessions[sessionToken]
        res.redirect('/')
        return
    }
    res.render('home')
})




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
                password_check=await bcrypt.compare(password,result[0].Password)
                if(!password_check){
                    
                    res.render('index',{message:'Wrong Password'})
                }
                else{
                    const sessionToken = uuidv4()
                    const now = new Date()
                    const expiresAt = new Date(+now + 120 * 1000)
                    const session = new Session(email, expiresAt)
                    sessions[sessionToken] = session
                    res.cookie("session_token", sessionToken, { expires: expiresAt })
                    res.redirect("/home")
                    res.end()
                }
            }
            
        }
    })


})

app.listen(5000, ()=> {
    console.log("server started on port 5000")
})



