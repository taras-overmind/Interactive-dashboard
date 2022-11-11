let socket;
let UI = {};
let picture = {};


function initPicture() {

}

function initUI() {

}

function initSockets() {

}

function mouseDragged() {
    if (picture.prevCoord === null) {
        picture.prevCoord = {
            x: mouseX,
            y: mouseY,
        };
    }

    let data = {
        color: UI.brush.checked ? UI.brushClrPicker.value : null,
        width: widthSlider.value,
        start: {
            x: picture.prevCoord.x,
            y: picture.prevCoord.y,
        },
        end: {
            x: mouseX,
            y: mouseY,
        },
    };

    socket.emit('draw', data);

    picture.prevCoord = {
        x: mouseX,
        y: mouseY,
    };
}

function newDrawing(data) {
    if (data.color === null) {
        stroke(UI.backgroundClrPicker.value);
    } else {
        stroke(data.color);
    }

    strokeWeight(data.width);
    line(data.start.x, data.start.y, data.end.x, data.end.y);
}
function redrawLines(data) {
    data.lines.forEach((line) => {
        newDrawing(line);
    });
}

