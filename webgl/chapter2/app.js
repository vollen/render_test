var VSHADER_SOURCE=`
attribute vec4 a_point;
uniform mat4 u_ModelViewMatrix;
attribute vec4 a_Color;
varying vec4 v_Color;
void main(){
    gl_Position = u_ModelViewMatrix * a_point;
    v_Color = a_Color;
}
`;
var FSHADER_SOURCE=`
precision mediump float;
varying vec4 v_Color;
void main(){
    gl_FragColor=v_Color;
}
`;

var img_loaded = 0;
function main(){
    var canvas = document.getElementById("canvas");
    if(!canvas){
        console.log("failed to retrieve the <canvas> element");
        return false;
    }

    gl = getWebGLContext(canvas);
    if(!gl){
        console.log("failed to get the rendering context for webgl");
        return;
    }

    if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)){
        console.log("failed to initialize shaders");
        return;
    }

    var n = initVertexBuffer(gl);

    var u_ModelViewMatrix = gl.getUniformLocation(gl.program, "u_ModelViewMatrix");
    if(!u_ModelViewMatrix){
        console.log("failed to get the storage location of u_ModelViewMatrix");
        return;
    }

    gl.clearColor(0.0, 0.0,0.0, 1.0);
    var matrix = new Matrix4();

    // var u_width = gl.getUniformLocation(gl.program, "u_width");
    // gl.uniform1f(u_width, gl.drawingBufferWidth);

    // var u_height = gl.getUniformLocation(gl.program, "u_height");
    // gl.uniform1f(u_height, gl.drawingBufferHeight);

    // if(!initTextures(gl, n)){
    //     return;
    // }

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    matrix.setPerspective(30, canvas.width/ canvas.height, 1, 100);
    matrix.lookAt(0, 0, 5, 0, 0, -100, 0, 1, 0);

    matrix.translate(0.75, 0, 0);
    gl.uniformMatrix4fv(u_ModelViewMatrix, false, matrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, n);

    matrix.setPerspective(30, canvas.width/ canvas.height, 1, 100);
    matrix.lookAt(0, 0, 5, 0, 0, -100, 0, 1, 0);

    matrix.translate(-0.75, 0, 0);
    gl.uniformMatrix4fv(u_ModelViewMatrix, false, matrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, n);

    var rotate = 0;
    var tick = function(){
        // if(img_loaded >= 2){
        rotate = draw(gl, u_ModelViewMatrix, matrix, rotate, n);
        gl.drawArrays(gl.TRIANGLES, 0, n);

        // }
        window.requestAnimationFrame(tick);
    };
    // tick();

    window.onkeydown = function(ev){onKeyPressed(ev)};
    this.updateNearFar();
}

var near = 0, far = 0.5;
function onKeyPressed(ev){
    switch(ev.keyCode){
        case 37: near += 0.01; break;
        case 39: near -= 0.01; break;
        case 38: far += 0.01; break;
        case 40: far -= 0.01; break;
    }
    this.updateNearFar();
}

function updateNearFar(){
    var nf = document.getElementById("nearFar");
    nf.innerHTML = "near: " + near + ", far: " + far;
}

function draw(gl, u_matrix, matrix, rotate, n){
    rotate += 1;
    rotate %= 360;
    // matrix.setLookAt(0, 0, 0, 0, 0, 0, 0, 1, 0);
    // matrix.rotate(rotate, 0, 0, 1);
    // matrix.setOrtho(-1, 1, -1, 1, near, far);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, n);
    return rotate;
}

function initVertexBuffer(gl){
    var buffer = gl.createBuffer();
    if(!buffer){
        console.log("failed to create buffer object");
        return -1;
    }
    var n = 4;
    var data = new Float32Array([
        0.0, 1.0, -2.0, 1.0, 1.0, 0.4,
        -0.5, -1.0, -2.0, 1.0, 1.0, 0.4,
        0.5, -1.0, -2.0, 1.0, 1.0, 0.4,

        0.0, 1.0, -4.0, 0.4, 1.0, 0.4,
        -0.5, -1.0, -4.0, 0.4, 1.0, 0.4,
        0.5, -1.0, -4.0, 0.4, 1.0, 0.4,

        0.0, 1.0, 0.0, 0.4, 0.4, 1.0,
        -0.5, -1.0, 0.0, 0.4, 0.4, 1.0,
        0.5, -1.0, 0.0, 0.4, 0.4, 1.0,
    ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    var fSize = data.BYTES_PER_ELEMENT;

    var a_point = gl.getAttribLocation(gl.program, "a_point");
    gl.vertexAttribPointer(a_point, 3, gl.FLOAT, false, fSize * 6, 0);
    gl.enableVertexAttribArray(a_point);

    var a_Color = gl.getAttribLocation(gl.program, "a_Color");
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, fSize * 6, fSize * 3);
    gl.enableVertexAttribArray(a_Color);

    return 9;
}


function initTextures(gl, n){
    var texture = gl.createTexture();
    if(!texture){
        console.log("failed to create texture");
        return false;
    }
    var u_sampler = gl.getUniformLocation(gl.program, "u_sampler");
    if(!u_sampler){
        console.log("failed to get the storage of u_sampler");
        return false;
    }

    var u_sampler_1 = gl.getUniformLocation(gl.program, "u_sampler_1");

    var image = new Image();
    image.onload = function(){
        loadTexture(gl, n, u_sampler, texture, image);
    };
    image.src = "../resources/sky.jpg";
    var image1 = new Image();
    image1.onload = function(){
        loadTexture(gl, n, u_sampler_1, texture, image1);
    };
    image1.src = "../resources/circle.gif";

    // image.crossOrigin = "anonymous";
    // image.src = "http://rodger.global-linguist.com/webgl/resources/sky.jpg";
    return true;
}

function loadTexture(gl, n, u_sampler, texture, image){
    var textId, unit;
    unit = img_loaded;
    if(img_loaded === 0){
        textId = gl.TEXTURE0;
    } else {
        textId = gl.TEXTURE1;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(textId);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_sampler, unit);

    img_loaded ++;
}
