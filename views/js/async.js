
var http=new XMLHttpRequest()

class Notification{
    constructor(notification_id,message,time){
        this.notification_id=notification_id
        this.message=message
        this.time=time
    }
}

var notification_icon=document.getElementById("notification-icon")
console.log(notification_icon)
notification_icon.onclick=show_notifs
viewed=false;
var notifications=[]

function clearNotifications(){
    if(viewed){
        notifications.length=0
        var notif_area=document.getElementById("overlay")
        while(notif_area.firstChild){
            notif_area.removeChild(notif_area.firstChild)
        }
        return
    }
    else{
        return
    }
}

function show_notifs(){
    var notif_area=document.getElementById("overlay")
    console.log(notif_area.style.display)
    if(notif_area.style.display=="block"){
        notif_area.style.display="none"
        return
    }
    else{
        document.getElementById("overlay").style.display="block"
        return
    }
}
        
function notifs(){
    //var str=document.getElementById("username").innerHTML
    //console.log(str)
    http.open("GET","/getnotifications",true);
    http.send()
    http.onreadystatechange=function(){
        if(this.readyState==4){
            var result = JSON.parse(http.response)
            if(result.length>notifications.length){
                var l=notifications.length
                for (var i=notifications.length;i<result.length;i++){
                    notifications.push(new Notification(result[i].notification_id,result[i].message,result[i].time))
                }
                for(var i=l;i<notifications.length;i++){
                    const para = document.createElement("p")
                    para.style.display="inline"
                    para.className=notifications[i].notification_id
                    para.innerHTML = notifications[i].message
                    const a=document.createElement("button")
                    a.className=notifications[i].notification_id
                    a.innerHTML="k"
                    a.onclick=removeNotification
                    a.style.display="inline"
                    a.style.marginLeft="10px"
                    a.href="/removeNotification?id="+notifications[i].notification_id
                    document.getElementById("overlay").appendChild(para);
                    document.getElementById("overlay").appendChild(a)
                }
            }
            
        }
    }
    setTimeout(notifs,5000);
}

function removeNotification(){
    request_id=this.className
    var notification=document.getElementsByClassName(this.className)
    document.getElementById("overlay").removeChild(notification[0])
    document.getElementById("overlay").removeChild(notification[0])
    for (var i=0;i<notifications.length;i++){
        if(notifications[i].notification_id==request_id){
            notifications.splice(i,1)
            http.open("GET",'/deleteusernotification?id='+request_id,true)
            http.send()
        }
    }
}

notifs()