

init ();

function init () {

    setFrame ();
    
}


function setFrame () {
    var map = document.getElementById ('map');
    map.hidden = true;

    var elem = document.createElement ("iframe");
    var frame = document.getElementById ('frame');
    elem.src = "pages/iframe.html";
    elem.style.width = 1000;
    elem.style.height = 650;
    frame.appendChild (elem);
    
}
