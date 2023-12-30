const express = require('express');
const mysql = require("mysql")
const dotenv = require('dotenv')
const path = require("path")
const bcrypt = require("bcryptjs")
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { v4: uuidv4 } = require('uuid');
const { userInfo } = require('os');
const multer   =  require('multer')
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now()+path.extname(file.originalname))
    } 
})
var upload = multer({ storage: storage })

const app = express();

app.use(bodyParser.json())
app.use(cookieParser())
app.use(express.urlencoded({extended: 'false'}))
app.use(express.json())
app.set('view engine', 'hbs')
app.use('/uploads',express.static('uploads'))
app.use(express.static("views"));

const sessions = {}
const psessions={}

class Session {
    constructor(username,name,user_id) {
        this.email = username
        this.name  = name
        this.user_id=user_id
    }
    
}

class Job{
    constructor(jobid,jobname,jobdes,image='images/director.png',isRequested=0){
        this.jobid=jobid
        this.jobname=jobname
        this.jobdes=jobdes
        this.isRequested=isRequested
        this.image=image
    }
}

class JobRequests{
    constructor(request_id,jobid,userid,username,request_date=null){
        this.request_id=request_id
        this.jobid=jobid
        this.userid=userid
        this.username=username
        this.request_date=request_date
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

class ProducerInfo{
    constructor(name,email,phone,address,about){
        this.name=name
        this.email=email
        this.phone=phone
        this.address=address
        this.about=about
    }
}

class JobInfo{
    constructor(jobid,producerid,jobname,jobdes,skills,profiles,details,time,pay){
        this.jobid=jobid
        this.producerid=producerid
        this.jobname=jobname
        this.jobdes=jobdes
        this.skills=skills
        this.profiles=profiles
        this.details=details
        this.time=time
        this.pay=pay
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

function user_registration(name,email,password,password_confirm){
    return new Promise(function(resolve,reject){
        var query_str="SELECT * FROM  users WHERE email=?;"
        var values=[email]
        db.query(query_str,values,async (err,result)=>{
            if(err){
                return reject(err)
            }

            if(result.length!=0){
                return resolve(['User already Exists'])
            }

            if(password!=password_confirm){
                return resolve(['Passwords Dont Match'])
            }
            var insert_query="INSERT INTO users (name,email,password) VALUES ?;"
            var hashedPassword = await bcrypt.hash(password, 8)
            var value=[[name,email, hashedPassword]]
            db.query(insert_query,[value],(err,result2)=>{
                if (err){
                    return reject(['Error Occured in DB'])
                }
                else{
                    return resolve(["Successful",result2.insertId])
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
                    return resolve(["Successful",result2.insertId])
                }
            })
        })
    })
}

function getEmailFromId(type,id){
    return new Promise(function(resolve,reject){
        if(type==1){
            query_str='SELECT email from users where userid=?;'
            value=[[id]]
            db.query(query_str,value,(err,res)=>{
                if(err){
                    return reject(err)
                }
                else{
                    return resolve(res)
                }
            })
        }
        else if (type==2){
            query_str="select email from producers where producerid=?";
            value=[[id]]
            db.query(query_str,value,(err,res)=>{
                if(err){
                    return reject(err)
                }
                else{
                    return resolve(res)
                }
            })
        }
    })
}

function user_info_insert(userid,name,email,phone,birthday,gender,address,jobprofile,about,previousjobs,profile_image='images\\\default.jpg'){
    return new Promise(function(resolve,reject){
        var query_str="INSERT INTO user_info VALUES ?"
        values=[[userid,name,email,phone,gender,address,about,previousjobs,jobprofile,profile_image]]
        db.query(query_str,[values],(err,res)=>{
            if(err){
                return reject(err)
            }
            else{
                return resolve("Success")
            }
        })
    })
}

function producer_info_insert(id,name,email,phone,gender,address,about,profile_image='images\\\default.jpg'){
    return new Promise(function(resolve,reject){
        var query_str="INSERT INTO producer_info VALUES ?"
        values=[[id,name,email,phone,gender,address,about,profile_image]]
        db.query(query_str,[values],(err,res)=>{
            if(err){
                return reject(err)
            }
            else{
                return resolve("Success")
            }
        })
    })

}

function get_user_pfp_name(user_id,db){
    return new Promise(function(resolve,reject){
        var query_str="SELECT profile_image from user_info where userid=?"
        value=[[user_id]]
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

function get_producer_pfp_name(producer_id,db){
    return new Promise(function(resolve,reject){
        var query_str="SELECT profile_image from producer_info where producerid=?"
        value=[[producer_id]]
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

function getJobs(jobid,db,filter=null){
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

function getProducerAllJobs(db,producerid){
    return new Promise(function(resolve,reject){
        query='SELECT * FROM jobs WHERE producerid=?'
        values=[[producerid]]
        jobList=[]
        db.query(query,values,async(err,result)=>{
            if (result.length==0){
                var image='images/director.png'
                job=new Job(0,'Nothing Yet','Use the create job option to create a job posting',image)
                jobList.push(job)
            }
            else{
                for (var i=0;i<result.length;i++){
                    if(result[i].jobname=='Director'){
                        var image='images/director.png'
                        job=new Job(result[i].jobid,result[i].jobname,result[i].jobdescription,image)
                        jobList.push(job)
                    }
                    else if (result[i].jobname=='Makeup Artist'){
                        var image='images/makeup.png'
                        job=new Job(result[i].jobid,result[i].jobname,result[i].jobdescription,image)
                        jobList.push(job)
                    }
                    else{
                        job=new Job(result[i].jobid,result[i].jobname,result[i].jobdescription)
                        jobList.push(job)
                    }
                }
            }
            return resolve(jobList)
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

function getproducerinfo(db,producerid){
    return new Promise(function(resolve,reject){
        var query_str="Select * from producer_info where producerid=?"
        var value=[[producerid]]
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

function getproducerjob(db,producerid){
    return new Promise(function(resolve,reject){
        var query_str="SELECT * from jobs where producerid=?"
        var value=[[producerid]]
        db.query(query_str,value,(err,res)=>{
            if(err){
                console.log(err)
                return reject(err)
            }
            else{
                return resolve(res)
            }
        })
    })
}

function getJobRequestsProducer(db,jobid){
    return new Promise(function(resolve,reject){
        var query_string="Select * from job_requests where jobid=?;"
        var value=[[jobid]]
        db.query(query_string,value,(err,res)=>{
            if(err){
                console.log(err)
                return reject(err)
            }
            else{
                return resolve(res)
            }
        })
    })
}

function newJob(db,id,jobname,jobdes,jobskills,jobdetails,jobprofiles,time,pay){
    return new Promise(function(resolve,reject){
        var query_str="insert into jobs (producerid,jobname,jobdes,skills,profiles,details,time,pay) values?;"
        var values=[[id,jobname,jobdes,jobskills,jobprofiles,jobdetails,time,pay]]
        db.query(query_str,[values],(err,res)=>{
            if(err){
                console.log(err)
                return reject([err])
            }
            else{
                return resolve(['Success',res.insertId])
            }
        })
    })
}

function acceptUserApplication(db,request_id){
    return new Promise(function(resolve,reject){
        var query_str="select * from job_requests where request_id=?;"
        var value=[[request_id]]
        db.query(query_str,value,async(err,res)=>{
            if(err){
                return reject(err)
            }
            else{
                var job_info=await getJobs(res[0].jobid,db)
                query_str="insert into active_jobs (jobid,userid,jobname,jobdescription,producerid) values ?"
                var values=[[res[0].jobid,res[0].userid,job_info[0].jobname,job_info[0].jobdes,res[0].producerid]]
                db.query(query_str,[values],(err,res2)=>{
                    if(err){
                        return reject(err)
                    }
                    else{
                        query_str="delete from job_requests where jobid=?"
                        value=[[res[0].jobid]]
                        db.query(query_str,value,(err,res3)=>{
                            if(err){
                                return reject(err)
                            }
                            else{
                                query_str="update jobs set job_accepted=? where jobid=?"
                                value=[1,res[0].jobid]
                                db.query(query_str,value,(err,res)=>{
                                    if(err){
                                        return reject(err)
                                    }
                                    else{
                                        return resolve("success")
                                    }
                                })

                            }
                        })
                    }
                })
            }
        })
    })
}

function declineUserApplication(db,request_id){
    return new Promise(function(resolve,reject){
        query_str="delete from job_requests where request_id=?"
        value=[[request_id]]
        db.query(query_str,value,(err,res)=>{
            if(err){
                console.log(err)
                return reject(err)
            }
            else{
                return resolve("success")
            }
        })
    })
}

function getJobInformation(db,jobid){
    return new Promise(function(resolve,reject){
        var query_str="select * from jobs where jobid=?"
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
        if(response[0]=="Successful"){
            res.render('userregistration',{userid:response[1]})
        }
        else{
            res.render('index',{message:response})
        }
    }
    else if (role=='producers'){
        var response=await producer_registration(name,email,password,password_confirm)
        if(response[0]=="Successful"){
            res.render('producerregistration',{producerid:response[1]})
        }
        else{
            res.render('index',{message:response})
        }
    }
})

app.post("/user-info", upload.single('profile_image'), async(req,res)=>{
    const userid=req.query.id
    const {name,phone,birthday,gender,address,job_profile,about,previous_jobs}=req.body
    var email= await getEmailFromId(1,userid)
    email=email[0].email
    if(req.file){
        var response=await user_info_insert(userid,name,email,phone,birthday,gender,address,job_profile,about,previous_jobs,req.file.path)
    }
    else{
        var response=await user_info_insert(userid,name,email,phone,birthday,gender,address,job_profile,about,previous_jobs)
    }
    
    if(response=="Success"){
        res.render('index',{message:"Successfully Registered, please Log in"})
    }
    else{
        res.render('index',{message:"Error, please contact adminstrator"})
    }
})

app.post("/producer-info",async(req,res)=>{
    const producerid=req.query.id
    const {name,phone,birthday,gender,address,about}= req.body
    console.log(name,phone,birthday,gender,address,about)
    var email=await getEmailFromId(2,producerid)
    email=email[0].email
    if(req.file){
        var response=await producer_info_insert(producerid,name,email,phone,gender,address,about,req.file.path)
    }
    else{
        var response=await producer_info_insert(producerid,name,email,phone,gender,address,about)
    }

    if(response=="Success"){
        res.render('index',{message:"Successfully registered, please log in"})
    }
    else{
        res.render('index',{message:'error occured, please contact admin'})
    }
    return
}) 

app.post("/login",(req,res)=>{
    const {email, password, role} = req.body
    if(role=="users"){
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
    }

    else if(role=='producers'){
        check_query = "SELECT * from producers WHERE email=?;"
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
                    user_id=result[0].producerid
                    const sessionToken = uuidv4()
                    const now = new Date()
                    const session = new Session(email,username,user_id)
                    psessions[sessionToken] = session
                    res.cookie("session_token", sessionToken)
                    res.redirect("/producerhome")
                    res.end()
                }
            }
            
        }
    })
    }
})

app.get("/userhome",async (req,res)=>{
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

    pfp_row=await get_user_pfp_name(userid,db)
    pfp=pfp_row[0].profile_image
    console.log(pfp)

    query='SELECT * FROM active_jobs WHERE userid=?'
    values=[[userid]]
    db.query(query,values,(err,result)=>{
        jobList=[]
        if (result.length==0){
            var image='images/director.png'
            job=new Job(0,'Nothing Yet','Keep Looking Champ',image)
            jobList.push(job)
        }
        else{
            for (var i=0;i<result.length;i++){
                if(result[i].jobname=='Director'){
                    var image='images/director.png'
                    job=new Job(result[i].jobid,result[i].jobname,result[i].jobdescription,image)
                    jobList.push(job)
                }
                else if (result[i].jobname=='Makeup Artist'){
                    var image='images/makeup.png'
                    job=new Job(result[i].jobid,result[i].jobname,result[i].jobdescription,image)
                    jobList.push(job)
                }
                else{
                    job=new Job(result[i].jobid,result[i].jobname,result[i].jobdescription)
                    jobList.push(job)
                }
            }
        }
        res.render('userhome',{jobList:jobList,profile_image:pfp,name:user_name})
    })
    
})

app.get("/producerhome",async (req,res)=>{
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
    producerSession = psessions[sessionToken]
    if (!producerSession) {
        console.log("check3-fail")
        res.redirect('/')
        return
    }

    var session_cookie_no=req.cookies['session_token']
    user_name=psessions[session_cookie_no].name
    userid=psessions[session_cookie_no].user_id
    pfp_row=await get_producer_pfp_name(userid,db)
    pfp=pfp_row[0].profile_image
    var jobList=await getProducerAllJobs(db,userid)

    res.render('producerhome',{jobList:jobList,profile_image:pfp,name:user_name})
    return   
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

    pfp_row=await get_user_pfp_name(userid,db)
    pfp=pfp_row[0].profile_image

    jobList=[]
    rows=await getAllJobs(db)

    for(var i=0;i<rows.length;i++){
        jobList.push(new Job(rows[i].jobid,rows[i].jobname,rows[i].jobdes))
    }
    
    res.render('userjobPage',{jobList:jobList,profile_image:pfp,name:user_name})
    return
})
    
app.get("/requestjob",(req,res)=>{
    var session_cookie_no=req.cookies['session_token']
    var userid=sessions[session_cookie_no].user_id
    var username=sessions[session_cookie_no].name
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
        query="INSERT INTO job_requests (jobid, producerid, userid,username) VALUES ?;"
        values=[[jobid,producerid,userid,username]]
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

app.get("/jobrequests",async (req,res)=>{
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
    producerSession = psessions[sessionToken]
    if (!producerSession) {
        console.log("check3-fail")
        res.redirect('/')
        return
    }

    var session_cookie_no=req.cookies['session_token']
    user_name=psessions[session_cookie_no].name
    userid=psessions[session_cookie_no].user_id
    pfp_row=await get_producer_pfp_name(userid,db)
    pfp=pfp_row[0].profile_image
    var jobid=req.query.jobid
    var requests=await getJobRequestsProducer(db,jobid)
    var request_list=[]
    for(var i=0;i<requests.length;i++){
        request_list.push(new JobRequests(requests[i].request_id,requests[i].jobid,requests[i].userid,requests[i].username))
    }
    res.render('producerrequests',{request_list:request_list,profile_image:pfp,name:user_name})
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
    
    var user_name=sessions[session_cookie_no].name
    var userid=sessions[session_cookie_no].user_id
    pfp_row=await get_user_pfp_name(userid,db)
    pfp=pfp_row[0].profile_image
    rows=await getJobRequests(userid,db)
    var applications=[]
    for(var i=0;i<rows.length;i++){
        var job1 = await getJobs(rows[i].jobid,db)
        applications.push(new Job(job1[0].jobid,job1[0].jobname,job1[0].jobdes))
    }
    res.render('userjobapplications',{jobList:applications,profile_image:pfp,name:user_name})
})

app.get("/producerprofile",async(req,res)=>{
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
    producerSession = psessions[sessionToken]
    if (!producerSession) {
        console.log("check3-fail")
        res.redirect('/')
        return
    }
    var session_cookie_no=req.cookies['session_token']
    var producerid=psessions[session_cookie_no].user_id
    var user_name=psessions[session_cookie_no].name
    var pfp_row=await get_producer_pfp_name(userid,db)
    pfp=pfp_row[0].profile_image
    var producer_info_row=await getproducerinfo(db,producerid)
    var producer_jobs=await getproducerjob(db,producerid)
    var joblist=[]
    for(var i=0;i<producer_jobs.length;i++){
        row=producer_jobs[i]
        job=new Job(row.jobid,row.jobname,row.jobdes)
        joblist.push(job)
    }
    

    if(producer_info_row.length==0){
        return
    }
    producer_info_row=producer_info_row[0]
    var producerinfo=new ProducerInfo(producer_info_row.name,producer_info_row.email,producer_info_row.phone,producer_info_row.address,producer_info_row.about)
    res.render('producerprofile',{userinfo:producerinfo,joblist:joblist,profile_image:pfp,name:user_name})
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
    producerSessions=psessions[sessionToken]
    if (!userSession && !producerSessions) {
        console.log("check3-fail")
        res.redirect('/')
        return
    }
    if(userSession){
        var session_cookie_no=req.cookies['session_token']
        userid=sessions[session_cookie_no].user_id
        user_name=sessions[session_cookie_no].name
        pfp_row=await get_user_pfp_name(userid,db)
        pfp=pfp_row[0].profile_image

        rows=await getUserInfo(db,userid)
        if(rows.length==0){
            res.render('userprofile')
            return
        }
        rows=rows[0]
        var userinfo=new Userinfo(rows.name,rows.email,rows.phone_number,rows.address,rows.job_profile,rows.previous_jobs,rows.pay_grade)
        res.render('userprofile', {userinfo:userinfo,profile_image:pfp,name:user_name})
    }
    else if(producerSessions){
        user_id=req.query.id //user id of the profile requested
        var session_cookie_no=req.cookies['session_token']
        userid=psessions[session_cookie_no].user_id // id of the producer
        user_name=psessions[session_cookie_no].name 
        pfp_row=await get_producer_pfp_name(userid,db)
        rows=await getUserInfo(db,user_id)
        rows=rows[0]
        var userinfo=new Userinfo(rows.name,rows.email,rows.phone_number,rows.address,rows.job_profile,rows.previous_jobs,rows.pay_grade)
        res.render('userprofileForProducer', {userinfo:userinfo,profile_image:pfp,name:user_name})
    }
    
})

app.get("/createjob",async(req,res)=>{
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
    producerSession = psessions[sessionToken]
    if (!producerSession) {
        console.log("check3-fail")
        res.redirect('/')
        return
    }
    var session_cookie_no=req.cookies['session_token']
    user_name=psessions[session_cookie_no].name
    userid=psessions[session_cookie_no].user_id
    pfp_row=await get_producer_pfp_name(userid,db)
    pfp=pfp_row[0].profile_image
    if(req.query){
        if(req.query.response==0){
            res.render('createjob',{profile_image:pfp,name:user_name,message:"Successfully Created Posting"})
        }
        else if(req.query.response==1){
            res.render('createjob',{profile_image:pfp,name:user_name,message:"Failed to Create Posting"})
        }
    }
    
    res.render('createjob',{profile_image:pfp,name:user_name})
})

app.post("/newJobPosting",async(req,res)=>{
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
    producerSession = psessions[sessionToken]
    if (!producerSession) {
        console.log("check3-fail")
        res.redirect('/')
        return
    }
    var session_cookie_no=req.cookies['session_token']
    user_name=psessions[session_cookie_no].name
    userid=psessions[session_cookie_no].user_id
    const {jobname,jobdes,jobskills,jobdetails,jobprofiles,time,pay}=req.body
    var response = await newJob(db,user_id,jobname,jobdes,jobskills,jobdetails,jobprofiles,time,pay)
    if(response[0]=='Success'){
        res.redirect('/createjob?response=0')
    }
    else(res.redirect('/createjob?response=1'))
})

app.get("/logout",(req,res)=>{
    const sessionToken = req.cookies['session_token']
    delete sessions[sessionToken]
    delete psessions[sessionToken]
    res.redirect('/')
})

app.get("/accept",async(req,res)=>{
    var userid=req.query.userid
    var response=await acceptUserApplication(db,userid)
    console.log(response)
    res.redirect("/producerhome")
})

app.get("/decline",async(req,res)=>{
    var userid=req.query.userid
    var response=await declineUserApplication(db,userid)
    res.redirect("/producerhome")
})

app.get("/jobinfo",async(req,res)=>{
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
    producerSession = psessions[sessionToken]
    userSessions=sessions[sessionToken]

    if (!producerSession && !userSession) {
        console.log("check3-fail")
        res.redirect('/')
        return
    }
    var session_cookie_no=req.cookies['session_token']

    if(!userSessions){
        user_name=psessions[session_cookie_no].name
        userid=psessions[session_cookie_no].user_id
        pfp_row=await get_producer_pfp_name(userid,db)
        pfp=pfp_row[0].profile_image
    }

    if(!producerSession){
        user_name=sessions[session_cookie_no].name
        userid=sessions[session_cookie_no].user_id
        pfp_row=await get_user_pfp_name(userid,db)
        pfp=pfp_row[0].profile_image
    }
   
    var jobid=req.query.id
    var row=await getJobInformation(db,jobid)
    var jobinfo=new JobInfo(row[0].jobid,row[0].producerid,row[0].jobname,row[0].jobdes,row[0].skills,row[0].profiles,row[0].details,row[0].time,row[0].pay)

    var producer_row=await getproducerinfo(db,row[0].producerid)
    producer_row=producer_row[0]

    res.render("jobdesc",{jobinfo:jobinfo,userinfo:producer_row})
})

app.listen(5000, ()=> {
    console.log("server started on port 5000")
})



