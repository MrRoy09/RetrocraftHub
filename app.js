const express = require('express');
const mysql = require("mysql")
const dotenv = require('dotenv')
const path = require("path")
const bcrypt = require("bcryptjs")
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { v4: uuidv4 } = require('uuid');
const { userInfo } = require('os');
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
    constructor(jobid,jobname,jobdes,image='images/director.jpg',isRequested=0){
        this.jobid=jobid
        this.jobname=jobname
        this.jobdes=jobdes
        this.isRequested=isRequested
        this.image=image

    }
}

class Userinfo{
    constructor(name, email, phone, address , jobprofile ,previousjobs, paygrade){
        this.name=name
        this.email=email
        this.phone=phone
        this.address=address
        this.jobprofile=jobprofile
        this.previousjobs=previousjobs
        this.paygrade=paygrade
    }
}

function user_registration(name,email,password,password_confirm){
    return new Promise(function(resolve,reject){
        var query_str="SELECT * FROM  users WHERE email=?;"
        var values=[email]
        db.query(query_str,values,async (err,result)=>{
            if(err){
                return reject(err)
            }

            if(result.length!=0){
                return resolve('User already Exists')
            }

            if(password!=password_confirm){
                return resolve('Passwords Dont Match')
            }
            var insert_query="INSERT INTO users (name,email,password) VALUES ?;"
            var hashedPassword = await bcrypt.hash(password, 8)
            var value=[[name,email, hashedPassword]]
            db.query(insert_query,[value],(err,result2)=>{
                if (err){
                    return reject('Error Occured in DB')
                }
                else{
                    return resolve("Successful")
                }
            })
        })
    })
}

function producer_registration(name,email,password,password_confirm){
    return new Promise(function(resolve,reject){
        var query_str="SELECT * FROM producers WHERE email=?;"
        var values=[email]
        db.query(query_str,values,async (err,result)=>{
            if(err){
                return reject(err)
            }

            if(result.length!=0){
                return resolve('User already Exists')
            }

            if(password!=password_confirm){
                return resolve('Passwords Dont Match')
            }
            var insert_query="INSERT INTO producers (name,email,password) VALUES ?;"
            var hashedPassword = await bcrypt.hash(password, 8)
            var value=[[name,email, hashedPassword]]
            db.query(insert_query,[value],(err,result2)=>{
                if (err){
                    return reject('Error Occured in DB')
                }
                else{
                    return resolve("Successful")
                }
            })
        })
    })
}

function getJobRequests(userid,db){
    return new Promise(function(resolve,reject){
        var query_str="SELECT * FROM job_requests WHERE userid=?"
        var value=[[userid]]
        db.query(query_str,value,(err,res)=>{
        if(err){
            return reject(err)
        }
        else{
            return resolve(res)
        }
    })
    })
}

function getJobs(jobid,db,filters=None){
    return new Promise(function(resolve,reject){
        var query_str="SELECT * FROM jobs WHERE jobid=?"
        var value=[[jobid]]
        db.query(query_str,value,(err,res)=>{
            if(err){
                return reject(err)
            }
            else{
                return resolve(res)
            }
        })
    })
}

function getAllJobs(db){
    return new Promise(function(resolve,reject){
        var query_str="SELECT * from jobs WHERE job_accepted=0"
        db.query(query_str,(err,res)=>{
            if(err){
                return reject(err)
            }
            else{
                return resolve(res)
            }
        })
    })
}

function getUserInfo(db,userid){
    return new Promise(function(resolve,reject){
        var query_str="SELECT * from user_info WHERE userid=?"
        var value=[[userid]]
        db.query(query_str,value,(err,res)=>{
            if(err){
                return reject(err)
            }
            else{
                return resolve(res)
            }
        })
    })
}

const db = mysql.createConnection({
    host: 'localhost',
    port: 3307,
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

app.get("/onboard",(req,res)=>{
    res.render('onboard')
})


app.post("/signup", async(req, res) => {   
    const {name,email, password, password_confirm,role} = req.body
    if(role=='users'){
        var response=await user_registration(name,email,password,password_confirm)
        if(response=="Successful"){
            res.render('userregistration')
        }
        else{
            res.render('index',{message:response})
        }
    }
    else if (role=='producers'){
        var response=await producer_registration(name,email,password,password_confirm)
        if(response=="Successful"){
            res.render('producerregistration')
        }
        else{
            res.render('index',{message:response})
        }
    }
})

app.post("/user-info", async(req,res)=>{
    console.log(req.body)
    res.redirect('/')
})

app.post("/producer-info",async(req,res)=>{
    console.log(req.body)
    res.redirect('/')
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
        if (result.length==0){
            var image='images/director.jpg'
            job=new Job(0,'Nothing Yet','Keep Looking Champ',image)
            jobList.push(job)
        }
        else{
            for (var i=0;i<result.length;i++){
                if(result[i].jobname=='Director'){
                    var image='images/director.jpg'
                    job=new Job(result[i].jobid,result[i].jobname,result[i].jobdescription,image)
                    jobList.push(job)
                }
                else if (result[i].jobname=='Makeup Artist'){
                    var image='images/makeup.jpg'
                    job=new Job(result[i].jobid,result[i].jobname,result[i].jobdescription,image)
                    jobList.push(job)
                }
                else{
                    job=new Job(result[i].jobid,result[i].jobname,result[i].jobdescription)
                    jobList.push(job)
                }
            }
        }
        res.render('home',{jobList:jobList})
    })
    
})

app.get("/job-page",async (req,res)=>{
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

    jobList=[]
    rows=await getAllJobs(db)

    for(var i=0;i<rows.length;i++){
        jobList.push(new Job(rows[i].jobid,rows[i].jobname,rows[i].jobdes))
    }
    
    res.render('jobPage',{jobList:jobList})
    return
})
    
app.get("/requestjob",(req,res)=>{
    var session_cookie_no=req.cookies['session_token']
    var userid=sessions[session_cookie_no].user_id
    var jobid=req.query.id
    query="SELECT * FROM job_requests where jobid=? AND userid=?"
    value1=[jobid,userid]
    db.query(query,value1,(err,result)=>{
        if(err){
            console.log(err)
        }
        if (result.length!=0){
            res.redirect('/job-page')
            return
        }
        query="SELECT * FROM jobs where jobid=?;"
        value=[[jobid]]
        db.query(query,value,(err,result)=>{
        if (err){
            console.log(err)
        }
        producerid=result[0].producerid
        query="INSERT INTO job_requests (`jobid`, `producerid`, `userid`) VALUES?"
        values=[[jobid,producerid,userid]]
        db.query(query,[values],(err,result)=>{
            if (err){
                console.log(err)
            }
            res.redirect('/job-page')
            return
        })
    })
    })
    return
})

app.get("/view-requests",async (req,res)=>{
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
    if (!session_cookie_no){
        res.redirect('/')
    }
    
    var userid=sessions[session_cookie_no].user_id
    rows=await getJobRequests(userid,db)
    var applications=[]
    for(var i=0;i<rows.length;i++){
        var job1 = await getJobs(rows[i].jobid,db)
        applications.push(new Job(job1[0].jobid,job1[0].jobname,job1[0].jobdes))
    }
    res.render('JobApplications',{jobList:applications})
})

app.get("/profile",async(req,res)=>{
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
    userid=sessions[session_cookie_no].user_id

    rows=await getUserInfo(db,userid)
    if(rows.length==0){
        res.render('profile')
        return
    }
    rows=rows[0]
    var userinfo=new Userinfo(rows.name,rows.email,rows.phone_number,rows.Address,rows.job_profile,rows.previous_jobs,rows.pay_grade)
    res.render('profile', {userinfo:userinfo})
})

app.get("/logout",(req,res)=>{
    const sessionToken = req.cookies['session_token']
    delete sessions[sessionToken]
    res.redirect('/')
})

app.listen(5000, ()=> {
    console.log("server started on port 5000")
})



