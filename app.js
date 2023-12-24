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

const sessions = {}

class Session {
    constructor(username,name,user_id) {
        this.email = username
        this.name  = name
        this.user_id=user_id
    }
    
}

class Job{
    constructor(jobid,jobname,jobdes,isRequested=0){
        this.jobid=jobid
        this.jobname=jobname
        this.jobdes=jobdes
        this.isRequested=isRequested
    }
}

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
        
        insert_query="INSERT INTO USERS (name,email,password) VALUES ?;"
        var hashedPassword = await bcrypt.hash(password, 8)
        var value=[['user',email, hashedPassword]]
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
    check_query = "SELECT * from users WHERE email=?;"
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
                password_check=await bcrypt.compare(password,result[0].password)
                if(!password_check){
                    
                    res.render('index',{message:'Wrong Password'})
                }
                else{
                    username=result[0].name
                    user_id=result[0].userid
                    const sessionToken = uuidv4()
                    const now = new Date()
                    const session = new Session(email,username,user_id)
                    sessions[sessionToken] = session
                    res.cookie("session_token", sessionToken)
                    res.redirect("/userhome")
                    res.end()
                }
            }
            
        }
    })


})

app.get("/userhome",(req,res)=>{
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
    var session_cookie_no=req.cookies['session_token']
    user_name=sessions[session_cookie_no].name
    userid=sessions[session_cookie_no].user_id
    query='SELECT * FROM active_jobs WHERE userid=?'
    values=[[userid]]
    db.query(query,values,(err,result)=>{
        jobList=[]
        for (var i=0;i<result.length;i++){
            job=new Job(result[i].job_id,result[i].job_name,result[i].job_description)
            jobList.push(job)
        }
        res.render('home',{jobList:jobList})
    })
    
})

app.get("/job-page",(req,res)=>{
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

    var session_cookie_no=req.cookies['session_token']
    user_name=sessions[session_cookie_no].name
    userid=sessions[session_cookie_no].user_id
    query='SELECT * FROM jobs WHERE job_accepted=0;'
    db.query(query,(err,result)=>{
        if (err){
            console.log(err)
        }
        var jobList=[]
        for (var i=0;i<result.length;i++){
            query='SELECT * from job_requests where jobid=? AND user_id=?'
            values=[[result[i].job_id],userid]
            job=new Job(result[i].job_id,result[i].job_name,result[i].job_description)
            jobList.push(job)
        }
        res.render('jobPage',{jobList:jobList})})
})

app.get("/requestjob",(req,res)=>{
    var session_cookie_no=req.cookies['session_token']
    var userid=sessions[session_cookie_no].user_id
    var jobid=req.query.id
    query="SELECT * FROM jobs where job_id=?;"
    value=[[jobid]]
    db.query(query,value,(err,result)=>{
        if (err){
            console.log(err)
        }
        producerid=result[0].producer_id
        query="INSERT INTO job_requests (`jobid`, `producer_id`, `user_id`) VALUES?"
        values=[[jobid,producerid,userid]]
        db.query(query,[values],(err,result)=>{
            if (err){
                console.log(err)
            }
            console.log(result)
        })
    })
    res.redirect('/userhome')
})


app.listen(5000, ()=> {
    console.log("server started on port 5000")
})



