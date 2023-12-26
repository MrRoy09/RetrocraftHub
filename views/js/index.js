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
text_printer()