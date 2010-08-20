(function(document, chars, sessionStorage){

    // once I am happy, hard code radius and width
    var wheel = $("#w"), wheelCtx = wheel[0].getContext("2d"),
        currentBox = $("#c"), currentCtx =currentBox[0].getContext("2d"),
        hexNode = $("#x")[0], inputBoxes = [],
        radius = 82, i = 0, width = 16, inner = radius-(width/2), color,
        wheelDown = false, tringaleDown = false,
        ma = Math, pi = ma.PI, round = ma.round, abs = ma.abs, max = ma.max, min = ma.min, floor = ma.floor, sin = ma.sin, cos = ma.cos, tan = ma.tan, sqrt = ma.sqrt, pow = ma.pow, atan = ma.atan2,

        diffColor = [[0,-15], [15,-15], [15,0], [15,15], [0,15], [-15, 15], [-15, 0], [-15,-15]],

        currentColor = [255, 0, 0], newColor = currentColor,
        hex3match = /(.)(.)(.)/, hex3replace = "$1$1$2$2$3$3",
        hexChars = "0123456789ABCDEF", inputBox = $("#i"), tmp, j,
        inputTag = "<input/>", tdTag = "<td/>", trTag = "<tr/>",

        RGBmax = 255, HSVmax = 100,
        inputs = [["Hue", 360], ["Saturation", HSVmax], ["Value", HSVmax],
                  ["Red", RGBmax], ["Green", RGBmax], ["Blue", RGBmax]],
        
primaryColors = decode("N5N50S0S5N0"), colorPaletteItem = {}, paletteColors = decode("B;MQS:B@;KK5<KG7BA0QM@QS3CE;H=98KMCI31H?4HLGOD26D:>B5SO@?PG4C?9DE;DQF6B;0DG9PS?C>:C=FBDG>O;1BF4I>;NK5D65LH4LH81HAAJL4=?@6>@6IA1H81CSFH>AJDABCG6NA3JM=6EAHQ5==;7N3EN:9NA;IL5<C1<PA6O@0JF3NSMN7GJJ;CP58IG2CM8<SMJJ5CD@7O2>QGFOG5KQ4CJ9=P?7N28B?:NL:HR5EQ:<P;6<@3IM3CSGIC5<KG>K=7IA@NF3JQ3<>:LO87H12IF4NF@HK9>P4@R46641<E4JS@CJ:6C80RB0");

    function getHexColor(value, index) {
        return "#" + value.substr(index*3, 3).replace(hex3match, hex3replace);
    }

    function decode(text) {
        var i = 0, j = 0, hex = [], result = "";
        for(i in chars) {
            for (j in chars) {
                hex.push(chars[i]+chars[j]);
            }
        }
        for(i in text) {
            result += hex[(text.charCodeAt(i)-48)];
        }
        return result;
    }

    function toHex(d) {
        return ("0" + ((d < 16) ? "" : toHex((d-d % 16)/16)) + hexChars.charAt(d % 16)).slice(-2);
    }

    function getHex(r,g,b) {
        return "#" + toHex(r)+toHex(g)+toHex(b);
    }

    function hex2dec(hex) {
       return hexChars.indexOf(hex.toUpperCase());
    }
    /*function hex2dec(hex) {
        tmp = hex.charCodeAt(0);
        return tmp < 58 ? tmp-48 : tmp < 71 ? tmp-55 : tmp-87;
    }*/
    function getRGB(hex) {
        hex = hex.replace("#", "").toUpperCase();
        if(hex.length == 3) {
            hex = hex.replace(hex3match, hex3replace);
        }
        if(hex.length == 6) {
            return  [hex2dec(hex[0]) * 16 + hex2dec(hex[1]),
                     hex2dec(hex[2]) * 16 + hex2dec(hex[3]),
                     hex2dec(hex[4]) * 16 + hex2dec(hex[5])];
        }
        return null;
    }

    function minMax(value, minValue, maxValue) {
        return (value > maxValue) ? maxValue : ((value < minValue) ? minValue : value); 
    }

    // the javascript mod is wrong for negative numbers
    function mod(x, n) {
        return ((x%n)+n)%n;
    }


    function getHue(r,g,b) {
        var M = max(r, g, b),
            C = M - min(r, g, b);   
        return round(60 * ((C == 0) ? 0 : ((M == r) ? mod((g-b)/C, 6) : ((M == g) ? 2 + (b-r)/C : 4 + (r-g)/C))));
    }

    function getValue(r, g, b) {
        return round(HSVmax * max(r, g, b) / RGBmax);
    }
    
    function getLightness(r, g, b) {
        return round(HSVmax * 0.5 * (max(r, g, b) + min(r, g, b)) / RGBmax) ;
    }
    
    function getSaturation(r, g, b) {
        var M = max(r, g, b),
            C = M - min(r, g, b);
        return round(HSVmax * (C ? C / M : 0));
    }

    function solveRGB(r, g, b) {
        return [getHue(r,g,b), getSaturation(r, g, b), getValue(r, g, b)];
    }

    function solveHSV(h, s, v) {
        var C = v/HSVmax * s/HSVmax,
            H = mod(h/60, 6),
            X = C * (1 - abs(mod(H, 2) - 1)),
            val = [[C,X,0],[X,C,0],[0,C,X],[0,X,C],[X,0,C],[C,0,X]][floor(H)];
        return val.map(function(x) {return floor((x + v/HSVmax - C)*RGBmax);});
    }

    function textBoxChange(event) {
        var target = event.target, val = target.value,
            index = "HSVRGB".indexOf(target.id);
        if(index < 3) {
            tmp = solveRGB.apply(null, currentColor);
            tmp[index] = mod(val, inputs[index][1]);
            tmp = solveHSV.apply(null, tmp);
        } else {
            tmp = currentColor;
            tmp[index%3] = mod(val, inputs[index][1]);
        }
        return tmp;
    }

    (function(){
        var div, label, radio, input;
        for(i in inputs) {
            div = $("<div/>");
            radio = $(inputTag, {
                "type": "radio", 
                "name": "n",
                "checked": i == 0, 
                click: function() { updateColor.apply(null, currentColor); }
            });
            div.append(radio);
            label = $("<label/>", {text: inputs[i][0]});
            input = $(inputTag, {
                    "type": "number",
                    "min": 0,
                    "max": inputs[i][1],
                    "id": inputs[i][0][0]});
            input.keydown(function(event) {
                var code = event.keyCode;
                if(goodKey(code) || (48 <= code && code <= 57)) {
                    return true;
                }
                return false;
            });
            input.change(function(event) {
                updateColor.apply(null, textBoxChange(event));
            });
            input.keyup(function(event) {
                if(event.keyCode == 9)
                    return false;
                var target = event.target, val = target.value, rgb;
                if(parseInt(val)) {
                    rgb = textBoxChange(event);
                    rgb.push(target.id);
                    updateColor.apply(null, rgb);
                }
                return true;      
            });
            label.append(input);
            inputBoxes.push(input);
            div.append(label);
            inputBox.append(div);
        }
    })();

    for(i = 0; i < 6; i++) {
        tmp = $(trTag);
        for(j = 0; j < 36; j++) {
             color = getHexColor(paletteColors, j+i*36);
             colorPaletteItem[color] = [i, j];
             $(tdTag, {
                "class": color, 
                "style": "background:" + color,
                click: function (event) {
                    updateColor.apply(null, getRGB(event.currentTarget.className));
                }
             }).appendTo(tmp);
        }
        $("#p").append(tmp);
    }
    function goodKey(code) {
        return code == 8 || code == 46 || (37 <= code && code <= 40) || code == 13 || code == 9;
    }

    $(hexNode).keydown(function(event) {
        var code = event.keyCode;
        if(goodKey(code) || (48 <= code && code <= 57) || (65 <= code && code <= 70)) {
            return true;
        }
        return false;
    });
    $(hexNode).keyup(function(event) {
        var rgb = getRGB(event.target.value);
        if(rgb) {
            rgb.push("x");
            updateColor.apply(null, rgb);
        }
    });
    tmp = $(trTag);
    for(i = 0; i < 15; i++) {
        $(tdTag, {click: function() { updateColor.apply(null, getRGB(this.value)); }}).appendTo(tmp);
    }
    $("#sc").append(tmp);

    function loadSaved() {
        var values = getSessionVals(), key, tds = $("#sc td");
        for(i = 0; i < values.length; i++) {
            if(i < 15) {
                $(tds[i]).css("background", values[i][1]);
                tds[i].value = values[i][1];
            } else {
                delete sessionStorage[values[i][1]];
            }
        }
    }
    function getSessionVals() {
        var values = [];
        for(i = 0; i < sessionStorage.length; i++) {
            key = sessionStorage.key(i);
            values.push([parseInt(sessionStorage[key]), key]);
        }
        values.sort(function(x, y) { return y[0] - x[0] });
        return values;
    }
    $("#v").click(function(event) {
        var hex = getHex.apply(null, currentColor);
        delete sessionStorage[hex];
        sessionStorage[hex] = sessionStorage.length ? getSessionVals()[0][0]+1 : 0;
        loadSaved();
    });
    loadSaved();
    function createGradient(ctx, x1, y1, x2, y2, g1, g2) {
        var gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, g1);
        gradient.addColorStop(1, g2);
        return gradient;
    }
    function angleDistance(event, center) {
        return angleDistanceHelper(event, center, wheel.position());
    }
    function angleDistanceHelper(event, center, pos) {
        var x = event.pageX-pos.left-center,
            y = event.pageY-pos.top-center,
            angle = mod(atan(-y, x)/pi*180, 360),
            distance = sqrt(x*x+y*y);
        return [angle, distance];
    }
    function setWheelCurrent(angle) {
        wheelDown = true;
        tmp = solveRGB.apply(null, currentColor);
        tmp[0] = angle;
        setWheel.apply(null, tmp);
        setCurrent.apply(null, currentColor.concat(solveHSV.apply(null, tmp)));
    }
    function setWheelTriangle(angle, distance) {
        var rotate = solveRGB.apply(null, currentColor)[0];
            x = distance * cos((angle-rotate)*pi/180),
            y = distance * sin((angle-rotate)*pi/180),
            sat_dist = inner-1-(inner*cos(pi*2/3)),
            sat = (distance * cos((angle-rotate-120)*pi/180))-(inner*cos(pi*2/3)),
            val_max = (sat_dist-sat)*tan(pi/6),
            vlu = ((val_max*2)-(val_max+(distance * sin((angle-rotate-120)*pi/180))))/(val_max*2),
            satu = (sat_dist-sat)/sat_dist;
        return [rotate, minMax(round(100*vlu), 0, 100), minMax(round(100*satu), 0, 100), 0 <= vlu && vlu <= 1 && 0 <= satu && satu <= 1];
    }
    wheel.mousedown(function (event) {
        var items = angleDistance(event, 104),
            angle = items[0], distance = items[1];
        if(inner+1 < distance && distance < inner+width){
            wheelDown = true;
            setWheelCurrent(angle);
        } else if(distance < inner) {
            tmp = setWheelTriangle(angle, distance);     
            if(tmp[3]) {
                tringaleDown = true;
                setWheel.apply(null, tmp);
                setCurrent.apply(null, currentColor.concat(solveHSV.apply(null, tmp)));
            }
        }          
    });
    $(document).mousemove(function (event) {
        var items = angleDistance(event, 104),
            angle = items[0],
            distance = items[1];
        if(wheelDown == true) {
            setWheelCurrent(angle);
        } else if(tringaleDown == true) {
            tmp = setWheelTriangle(angle, distance);
            setCurrent.apply(null, currentColor.concat(solveHSV.apply(null, tmp)));
            setWheel.apply(null, tmp);
        }
    });
    $(document).mouseup(function (event) {
        var items = angleDistance(event, 104),
            angle = items[0],
            distance = items[1]; 
        if(wheelDown == true) {       
            wheelDown = false;
            tmp = solveRGB.apply(null, currentColor);
            tmp[0] = angle;
            updateColor.apply(null, solveHSV.apply(null, tmp));
        } else if(tringaleDown == true) {
            tringaleDown = false;
            updateColor.apply(null, solveHSV.apply(null, setWheelTriangle(angle, distance)));
        }
    });

    function setWheel(h, s, v) {
        var topX = inner*cos(pi*2/3), topY = inner*sin(pi*2/3),
            bottomX = inner*cos(pi*4/3), bottomY = inner*sin(pi*4/3),
            horizontal = inner-topX,
            vertical = topY-bottomY, size = inner-bottomX, tsize = sqrt(size*size+topY*topY);

        wheelCtx.save();
        wheelCtx.lineWidth = width;
        wheelCtx.clearRect(0, 0, 196, 196);
        wheelCtx.translate(radius+width+0.5, radius+width+0.5);
        for(i = 0;i < 6;) {
            wheelCtx.strokeStyle = createGradient(wheelCtx, radius, 0, radius*0.5, radius*sin(-pi / 3), 
                    getHexColor(primaryColors, i), getHexColor(primaryColors, ++i));

            wheelCtx.beginPath();
            wheelCtx.arc(0, 0, radius, 0.01, -pi / 3, 1);
            wheelCtx.stroke();
            wheelCtx.rotate(-pi / 3);
        }
        wheelCtx.rotate(-pi * h / 180);
        for(i = 0; i < 2; i++) {
            wheelCtx.fillStyle = ( !i ? createGradient(wheelCtx, 0, topY, 0, bottomY, "#fff", "#000") 
                    : createGradient(wheelCtx, topX, 0, inner, 0, "hsla("+h+",100%,50%,0)", "hsl("+h+",100%,50%)"));

            wheelCtx.beginPath();
            wheelCtx.moveTo(inner, 0);
            wheelCtx.lineTo(topX, topY);
            wheelCtx.lineTo(bottomX, bottomY);
            wheelCtx.fill();            
        }
        wheelCtx.lineWidth = 1;
        wheelCtx.strokeStyle = "#000";
        wheelCtx.beginPath();
        wheelCtx.moveTo(inner, 0);
        wheelCtx.lineTo(inner+width, 0);
        wheelCtx.stroke();

        wheelCtx.lineWidth = 2;
        wheelCtx.beginPath();
        var distance = size*v/100, across = -distance*tan(pi/6)*(s-50)/100*2;
        wheelCtx.arc(topX+(cos(pi/3)*(distance))-(cos(pi/6)*across),
                     -topY+(sin(pi/3)*(distance))+(sin(pi/6)*across),4,0,pi *2 ,true);
        wheelCtx.closePath();
        wheelCtx.stroke();

        wheelCtx.restore();
    }
    currentBox.mouseup(function(event) {
        var items = angleDistanceHelper(event, 65, currentBox.position()),
            angle = items[0],
            distance = items[1], diff;
        if(40 < distance && distance < 60) {
            diff = diffColor[parseInt(((angle + 45/2)/45)%8)];
            tmp = solveRGB.apply(null, currentColor);
            tmp[1] = minMax(tmp[1] + diff[0], 0, 100);
            tmp[2] = minMax(tmp[2] + diff[1], 0, 100);
            updateColor.apply(null, solveHSV.apply(null, tmp));
        }
    });
    function setCurrent(r1, g1, b1, r2, g2, b2) {
        var h = getHue(r1,g1,b1), s = getSaturation(r1, g1, b1), v = getValue(r1, g1, b1);

        currentCtx.save();
        currentCtx.clearRect(0, 0, 120, 120);
        currentCtx.translate(60, 60);

        for(i in diffColor) {
            currentCtx.fillStyle = getHex.apply(null, solveHSV(h, minMax(s+diffColor[i][0], 0, 100), minMax(v+diffColor[i][1], 0, 100)));
            currentCtx.beginPath();
            currentCtx.arc(10, 0, 50, pi / 8, -pi / 8, 1);
            currentCtx.lineTo(10, 0);
            currentCtx.closePath();
            currentCtx.fill();
            currentCtx.rotate(-pi / 4, 60, 60);
        }

        currentCtx.fillStyle = getHex(r2, g2, b2);
        currentCtx.beginPath();
        currentCtx.arc(0, 0, 40, pi / 2, -pi / 2, 1);
        currentCtx.closePath();
        currentCtx.fill();

        currentCtx.fillStyle = getHex(r1, g1, b1);
        currentCtx.beginPath();
        currentCtx.arc(0, 0, 40, -pi / 2, pi / 2, 1);
        currentCtx.closePath();
        currentCtx.fill();

        currentCtx.restore();
    }

    function setPalette(hex) {
        var item = $("#sp"), pos = colorPaletteItem[hex];
        if(pos) {
            item.css({background: hex, left: pos[1]*12.70-2,
                      top: pos[0]*10+13, display: "block"});
        } else {
            item.css("display", "none");
        }
    }
    
    function updateColor(r, g, b, input) {
        currentColor = [r, g, b], newColor = currentColor;
        var currentHsv = solveRGB(r, g, b), 
            nextHsv = solveRGB.apply(null, newColor),
            boxValues = currentHsv.concat(currentColor);
        setPalette(getHex(r, g, b));
        setWheel.apply(null, currentHsv);
        setCurrent.apply(null, currentColor.concat(newColor));
        if(input != "x") {
            hexNode.value = getHex(r, g, b);
        }
        for(i in inputBoxes) {
            if(input != inputBoxes[i][0].id) {
                inputBoxes[i].val(boxValues[i]);
            }
        }
    }

    
    function s(i) {
        setTimeout(function() { s(i+1) }, 10);
        updateColor.apply(null, solveHSV(i%360, 100, 50));        
    }
    //s(0);
    //updateColor.apply(null, solveHSV(0, 100, 40));
    updateColor(255, 0, 0);
})(document, "0369CF", sessionStorage);
