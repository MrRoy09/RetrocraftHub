let text1="Join our community and find your calling";
let array_text=text1.split("");
let looptimer;

function text_printer(){
    if(array_text.length>0){
        document.getElementById("Appearing-text").innerHTML+=array_text.shift();
    }
    else{
        clearTimeout(looptimer);
        return false;
    }
    looptimer=setTimeout('text_printer()',40)
}

function toggle_display1(){
    const login= document.getElementsByClassName('login-form-wrapper')[0];
    const signup=document.getElementsByClassName('signup-form-wrapper')[0];
    if(login.getAttribute("class")=='login-form-wrapper show'){
        login.setAttribute("class","login-form-wrapper hide")
        signup.setAttribute("class","signup-form-wrapper show")
        const timeout=setTimeout(change_display,300,0)
    }
    else if(login.getAttribute("class")=='login-form-wrapper hide'){
        login.setAttribute("class","login-form-wrapper show")
        signup.setAttribute("class","signup-form-wrapper hide")
        const timeout=setTimeout(change_display,300,1)
    }
    
}

function change_display(toggle){
    const login= document.getElementsByClassName('login-form-wrapper')[0];
    const signup=document.getElementsByClassName('signup-form-wrapper')[0];
    if(toggle==0){
        login.style.display='none';
        signup.style.display='block';
    }
    else if (toggle==1){
        login.style.display='block';
        signup.style.display='none';
    }
    
    
}


text_printer()
