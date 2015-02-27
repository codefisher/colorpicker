    var wheel = $("#w"), wheelCtx = getContext(wheel),
        currentBox = $("#c"), currentCtx = getContext(currentBox),
        barCanvas = $("#k"), barCanvasCtx = getContext(barCanvas),
        panelCanvas = $("#j"), panelCanvasCtx = getContext(panelCanvas),
        hexNode = $("#x")[0], inputBoxes = [],
        radius = 82, i = 0, width = 16, inner = radius-(width/2), color,
        wheelDown = false, tringaleDown = false, barDown = false, panelDown = false,
        RGBmax = 255, HSVmax = 100, hueMax = 360,
        canvasSize = 196,
        ma = Math, pi = ma.PI, round = ma.round, abs = ma.abs, max = ma.max, min = ma.min, floor = ma.floor, sin = ma.sin, cos = ma.cos, tan = ma.tan, sqrt = ma.sqrt, pow = ma.pow, atan = ma.atan2,
        black = "#000", white = "#fff", td,
        diffColor = [[0,-15], [15,-15], [15,0], [15,15], [0,15], [-15, 15], [-15, 0], [-15,-15]],
        bkground = "background",
        currentColor = [RGBmax, 0, 0], newColor = currentColor,
        hex3match = /(.)(.)(.)/, hex3replace = "$1$1$2$2$3$3",
        hexChars = "0123456789ABCDEF", inputBox = $("#i"), tmp, j,
        inputTag = "<input/>", tdTag = "<td/>", trTag = "<tr/>",
        startView = 0,
        chars = "0369CF",
        inputs = [["Hue", hueMax], ["Saturation", HSVmax], ["Value", HSVmax],
                  ["Red", RGBmax], ["Green", RGBmax], ["Blue", RGBmax]],
        radioIds = "YJKOQF",
        
        primaryColorsArray = [], colorPaletteItem = {}, paletteColors = decode("B;MQS:B@;KK5<KG7BA0QM@QS3CE;H=98KMCI31H?4HLGOD26D:>B5SO@?PG4C?9DE;DQF6B;0DG9PS?C>:C=FBDG>O;1BF4I>;NK5D65LH4LH81HAAJL4=?@6>@6IA1H81CSFH>AJDABCG6NA3JM=6EAHQ5==;7N3EN:9NA;IL5<C1<PA6O@0JF3NSMN7GJJ;CP58IG2CM8<SMJJ5CD@7O2>QGFOG5KQ4CJ9=P?7N28B?:NL:HR5EQ:<P;6<@3IM3CSGIC5<KG>K=7IA@NF3JQ3<>:LO87H12IF4NF@HK9>P4@R46641<E4JS@CJ:6C80RB0");
    
    for(i = 0; i < 7; i++) {
        primaryColorsArray.push(getHexColor(decode("N5N50S0S5N0"), i));
    }

    function getContext(item) {
        return item[0].getContext("2d");
    }

    function getHexColor(value, index) {
        return "#" + value.substr(index*3, 3).replace(hex3match, hex3replace);
    }
    
    function decode(text) {
        var i = 0, j = 0, hex = [], result = "", other;
        for(i = 0; i < 6; i++) {
            other = chars;
            for (j = 0; j < 6;) {
                hex.push(chars[i]+chars[j++]);
            }
        }
        for(i = 0; i < text.length; i++) {
            result += hex[(text.charCodeAt(i)-48)];
        }
        return result;
    }

    function getHex(r,g,b) {
        function toHex(d) {
            return ("0" + ((d < 16) ? "" : toHex((d-d % 16)/16)) + hexChars.charAt(d % 16)).slice(-2);
        }
        return "#" + toHex(r)+toHex(g)+toHex(b);
    }

    function getRGB(hex) {
        function hex2dec(hex) {
           return hexChars.indexOf(hex.toUpperCase());
        }
        hex = hex.replace("#", "");

        hex = (hex.length == 3) ? hex.replace(hex3match, hex3replace) : hex;
        if(hex.length == 6) {
            var result = [];
            for(i = 0; i < 3;) {
                result.push(hex2dec(hex[i*2]) * 16 + hex2dec(hex[i++*2+1]));
            }
            return result;
        }
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
        return (HSVmax * 0.5 * (max(r, g, b) + min(r, g, b)) / RGBmax) ;
    }
    
    function getSaturation(r, g, b) {
        var M = max(r, g, b),
            C = M - min(r, g, b);
        return round(HSVmax * (C ? C / M : 0));
    }

    function solveRGB(r, g, b) {
        return [getHue(r,g,b), getSaturation(r, g, b), getValue(r, g, b)];
    }

    function doApply(func, args) {
        return func.apply(null, args);
    }

    function solveHSV(h, s, v) {
        var C = v/HSVmax * s/HSVmax,
            H = mod(h/60, 6),
            X = C * (1 - abs(mod(H, 2) - 1)),
            val = [[C,X,0],[X,C,0],[0,C,X],[0,X,C],[X,0,C],[C,0,X]][floor(H)];
        return val.map(function(x) {return floor((x + v/HSVmax - C)*RGBmax);});
    }

    function textBoxChange(target) {
        var val = target.value,
            index = "HSVRGB".indexOf(target.id), tmp;
        if(index < 3) {
            tmp = doApply(solveRGB, currentColor);
            tmp[index] = val % (inputs[index][1]+1);
            tmp = doApply(solveHSV, tmp);
        } else {
            tmp = currentColor;
            tmp[index%3] = val % (inputs[index][1]+1);
        }
        return tmp;
    }

    var tmp = document.createElement("input");
    tmp.setAttribute("type", "color");
    
    var div, label, radio, input,
        func = function(event) { doApply(updateColor, textBoxChange(this)); };
    for(i in inputs) {
        div = $("<div/>");
        radio = $(inputTag, {
            "type": "radio", 
            "name": "n",
            "id": radioIds[i],
            "checked": i == startView, 
            click: function() { doApply(updateColor, currentColor); }
        });
        div.append(radio);
        label = $("<label/>", {text: inputs[i][0]});
        input = $(inputTag, {
                "type": (tmp.type !== "text") ? "number" : "text",
                "min": 0,
                "size":3,
                "max": inputs[i][1],
                "id": inputs[i][0][0]});
        input.keydown(function(event) {
            var code = event.keyCode;
            return goodKey(code) || (48 <= code && code <= 57);
        });
        input.change(func);
        input.click(func);
        input.keyup(function(event) {
            if(event.keyCode == 9)
                return false;
            var target = this, val = target.value, rgb;
            if(parseInt(val)) {
                rgb = textBoxChange(target);
                rgb.push(target.id);
                doApply(updateColor, rgb);
            }
            return true;      
        });
        label.append(input);
        inputBoxes.push(input);
        div.append(label);
        inputBox.append(div);
    }    

    for(i = 0; i < 6*36; i++) {
        if(i % 36 == 0) {
            tmp = $(trTag);
            $("#p").append(tmp);
        }
        color = getHexColor(paletteColors, i);
        td = $(tdTag, {
            click: function (event) {
                doApply(updateColor, getRGB(this.value));
            }
        });
        td[0].value = color;       
        td.css(bkground, color);
        colorPaletteItem[color] = td;
        td.appendTo(tmp); 
    }

    function goodKey(code) {
        return code == 8 || code == 46 || (37 <= code && code <= 40) || code == 13 || code == 9;
    }

    $(hexNode).keydown(function(event) {
        var code = event.keyCode;
        return goodKey(code) || (48 <= code && code <= 57) || (65 <= code && code <= 70);
    });
    $(hexNode).keyup(function(event) {
        var rgb = getRGB(this.value);
        if(rgb) {
            rgb.push("x");
            doApply(updateColor, rgb);
        }
    });
    tmp = $(trTag);
    for(i = 0; i < 17; i++) {
        $(tdTag, {click: function(event) {
            if(this.value) doApply(updateColor, getRGB(this.value)); 
        }}).appendTo(tmp);
    }
    $("#sc").append(tmp);

    function loadSaved() {
        var values = getSessionVals(), key, tds = $("#sc td"), value;
        for(i = 0; i < values.length; i++) {
            value = values[i][1];
            if(i < 17) {
                $(tds[i]).css(bkground, value);
                tds[i].value = value;
            } else {
                delete sessionStorage[value];
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
        var hex = doApply(getHex, currentColor);
        delete sessionStorage[hex];
        sessionStorage[hex] = sessionStorage.length ? getSessionVals()[0][0]+1 : 0;
        loadSaved();
    });
    loadSaved();
    function createGradient(ctx, x1, y1, x2, y2, grad) {
        var gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        for(j in grad) {
            gradient.addColorStop(j/(grad.length-1), grad[j]);
        }
        return gradient;
    }
    function getXY(event, elem, offset) {
        var el = elem[0];
        return [event.pageX-el.offsetLeft-offset, event.pageY-el.offsetTop-offset];
    }
    function angleDistance(event, center, elm) {
        var xy = getXY(event, elm, center), x = xy[0], y = xy[1];
            angle = mod(atan(-y, x)/pi*180, hueMax),
            distance = sqrt(x*x+y*y);
        return [angle, distance];
    }
    function setWheelCurrent(angle) {
        var tmp;
        wheelDown = true;
        tmp = doApply(solveRGB, currentColor);
        tmp[0] = angle;
        doApply(setWheel, tmp);
        doSetCurrent(doApply(solveHSV, tmp));
    }
    function setWheelTriangle(angle, distance) {
        var rotate = doApply(solveRGB, currentColor)[0],
            x = distance * cos((angle-rotate)*pi/180),
            y = distance * sin((angle-rotate)*pi/180),
            sat_dist = inner-1-(inner*cos(pi*2/3)),
            sat = (distance * cos((angle-rotate-120)*pi/180))-(inner*cos(pi*2/3)),
            val_max = (sat_dist-sat)*tan(pi/6),
            vlu = ((val_max*2)-(val_max+(distance * sin((angle-rotate-120)*pi/180))))/(val_max*2),
            satu = (sat_dist-sat)/sat_dist;
        return [rotate, minMax(round(HSVmax*vlu), 0, HSVmax), minMax(round(HSVmax*satu), 0, HSVmax), 0 <= vlu && vlu <= 1 && 0 <= satu && satu <= 1];
    }
    wheel.mousedown(function (event) {
        var items = angleDistance(event, 104, wheel), tmp,
            angle = items[0], distance = items[1];
        if(inner+1 < distance && distance < inner+width){
            wheelDown = true;
            setWheelCurrent(angle);
        } else if(distance < inner) {
            tmp = setWheelTriangle(angle, distance);     
            if(tmp[3]) {
                tringaleDown = true;
                doApply(setWheel, tmp);
                doSetCurrent(doApply(solveHSV, tmp));
            }
        }          
    });
    $(document).mousemove(function (event) {
        var items = angleDistance(event, 104, wheel),
            angle = items[0], tmp,
            distance = items[1];
        if(wheelDown) {
            setWheelCurrent(angle);
        } else if(tringaleDown) {
            tmp = setWheelTriangle(angle, distance);
            doSetCurrent(doApply(solveHSV, tmp));
            doApply(setWheel, tmp);
        } else if(barDown) {
            var tmp = getBarColor(event);
            doSetCurrent(tmp);
            doApply(drawPanel, tmp);
        } else if(panelDown) {
            var tmp = getPanelColor(event);
            doSetCurrent(tmp);
            doApply(drawPanel, tmp);
        }
    });
    $(document).mouseup(function (event) {
        var items = angleDistance(event, 104, wheel),
            angle = items[0], tmp,
            distance = items[1]; 
        if(wheelDown) {       
            wheelDown = false;
            tmp = doApply(solveRGB, currentColor);
            tmp[0] = angle;
            doApply(updateColor, doApply(solveHSV, tmp));
        } else if(tringaleDown) {
            tringaleDown = false;
            doApply(updateColor, doApply(solveHSV, setWheelTriangle(angle, distance)));
        } else if(barDown) {
            doApply(updateColor, getBarColor(event));
            barDown = false;
        } else if(panelDown) {
            doApply(updateColor, getPanelColor(event));
            panelDown = false;
        } 
    });

    function setWheel(h, s, v) {
        var topX = inner*cos(pi*2/3), topY = inner*sin(pi*2/3),
            bottomX = inner*cos(pi*4/3), bottomY = inner*sin(pi*4/3),
            horizontal = inner-topX,
            vertical = topY-bottomY, size = inner-bottomX, tsize = sqrt(size*size+topY*topY);

        wheelCtx.save();
        wheelCtx.lineWidth = width;
        wheelCtx.clearRect(0, 0, canvasSize, canvasSize);
        wheelCtx.translate(radius+width, radius+width);
        for(i = 0;i < 6; i++) {
            wheelCtx.strokeStyle = createGradient(wheelCtx, radius, 0, radius*0.5, radius*sin(-pi / 3), 
                    [primaryColorsArray[i], primaryColorsArray[i+1]]);

            wheelCtx.beginPath();
            wheelCtx.arc(0, 0, radius, 0.01, -pi / 3, 1);
            wheelCtx.stroke();
            wheelCtx.rotate(-pi / 3);
        }
        wheelCtx.rotate(-pi * h / 180);
        for(i = 0; i < 2; i++) {
            wheelCtx.fillStyle = ( !i ? createGradient(wheelCtx, 0, topY, 0, bottomY, [white, black]) 
                    : createGradient(wheelCtx, topX, 0, inner, 0, ["hsla("+h+",100%,50%,0)", "hsl("+h+",100%,50%)"]));

            wheelCtx.beginPath();
            wheelCtx.moveTo(inner, 0);
            wheelCtx.lineTo(topX, topY);
            wheelCtx.lineTo(bottomX, bottomY);
            wheelCtx.fill();            
        }
        wheelCtx.lineWidth = 1;
        wheelCtx.strokeStyle = black;
        wheelCtx.beginPath();
        wheelCtx.moveTo(inner, 0);
        wheelCtx.lineTo(inner+width, 0);
        wheelCtx.stroke();

        wheelCtx.strokeStyle = doApply(getLightness, solveHSV(h, s, v)) > 25 ? black : white;
        wheelCtx.lineWidth = 2;
        wheelCtx.beginPath();
        var distance = size*v/HSVmax, across = -distance*tan(pi/6)*(s-50)/HSVmax*2;
        wheelCtx.arc(topX+(cos(pi/3)*(distance))-(cos(pi/6)*across),
                     -topY+(sin(pi/3)*(distance))+(sin(pi/6)*across),4,0,pi *2 ,true);
        wheelCtx.stroke();
        wheelCtx.restore();
    }
    
    currentBox.mouseup(function(event) {
        var items = angleDistance(event, 65, currentBox),
            angle = items[0], tmp,
            distance = items[1], diff; 
        if(40 < distance && distance < 60) {
            diff = diffColor[parseInt(((angle + 45/2)/45)%8)];
            tmp = doApply(solveRGB, currentColor);
            for(i=0; i < 2;) {
                tmp[i+1] = minMax(diff[i]+tmp[++i], 0, HSVmax);
            }
            doApply(updateColor, doApply(solveHSV, tmp));
        }
    });
    function doSetCurrent(c2) {
        doApply(setCurrent, currentColor.concat(c2));
    }
    currentCtx.translate(60, 60);
    function setCurrent(r1, g1, b1, r2, g2, b2) {
        var h = getHue(r1,g1,b1), s = getSaturation(r1, g1, b1), v = getValue(r1, g1, b1),
            size = 40;

        currentCtx.clearRect(-60, -60, 120, 120);        

        for(i in diffColor) { 
            currentCtx.fillStyle = doApply(getHex, solveHSV(h, minMax(s+diffColor[i][0], 0, HSVmax), minMax(v+diffColor[i][1], 0, HSVmax)));
            currentCtx.beginPath();
            currentCtx.arc(10, 0, size+10, pi / 8, -pi / 8, 1);
            currentCtx.lineTo(10, 0);
            currentCtx.closePath();
            currentCtx.fill();
            currentCtx.rotate(-pi / 4, 60, 60);
        }

        for(i = 0; i < 2; i++) {
            currentCtx.fillStyle = i ? getHex(r1, g1, b1) : getHex(r2, g2, b2);
            currentCtx.beginPath();
            currentCtx.arc(0, 0, size, (i ? -1 : 1) * pi / 2, (i ? 1 : -1) * pi / 2, 1);
            currentCtx.closePath();
            currentCtx.fill();
        }
    }

    function setPalette(hex) {
        var item = $("#sp"), pos = colorPaletteItem[hex], xy;
        if(pos) {
            xy = pos.position();
            item.css({background: hex, left: xy.left-3,
                      width: 16, height:16,
                      top: xy.top-3, display: "block"});
        } else {
            item.css("display", "none");
        }
    }
    for(i in radioIds) {
        
    }
    function getPanelView() {
        for(i = 0; i < 6; i++) {
            if($("#"+radioIds[i])[0].checked)
                return i;
        }
    }
    function drawPanel(r, g, b) {
        var grad0, grad2, gard4,
            x, y, z, view = getPanelView(), facz, facy, facx, vc,
            hsv = solveRGB(r, g, b), h = hsv[0], s = hsv[1], v = hsv[2];

        if(view == 0) {
            x = v; y = s; z = hueMax-h; facz = hueMax; facy = HSVmax; facx = HSVmax;
            grad0 = primaryColorsArray;
            grad2 = [doApply(getHex, solveHSV(h, HSVmax, HSVmax)), white];
            grad4 = [black, "rgba(0,0,0,0)"];
        } else if(view == 1 || view == 2) {
            x = v; y = hueMax-h; z = s; facz = HSVmax; facy = hueMax; facx = HSVmax;
            grad0 = [white, black];
            grad2 = primaryColorsArray;
            grad4 = [black, "rgba(255,255,255,"+(HSVmax-s)/HSVmax+")"];
            if(view == 2) {
                x = s; z = v;
                vc = parseInt(v/HSVmax*RGBmax);
                grad4 = [getHex(vc, vc, vc), "rgba("+vc+","+vc+","+vc+","+(HSVmax-v)/HSVmax+")"];
            }
        } else if(view == 3) {
            x = b; y = g; z = r;
            grad0 = [primaryColorsArray[0], black];
            grad2 = [getHex(r, RGBmax, 0), getHex(r, RGBmax, RGBmax)];
            grad4 = [getHex(r, 0, 0), getHex(r, 0, RGBmax)];
        } else if(view == 4) {
            x = r; y = b; z = g;
            grad0 = [primaryColorsArray[2], black];
            grad2 = [getHex(RGBmax, g, 0), getHex(RGBmax, g, RGBmax)];
            grad4 = [getHex(0, g, 0), getHex(0, g, RGBmax)];
        } else if(view == 5) {
            x = g; y = r; z = b; 
            grad0 = [primaryColorsArray[4], black];
            grad2 = [getHex(RGBmax, 0, b), getHex(RGBmax, RGBmax, b)];
            grad4 = [getHex(0, 0, b), getHex(0, RGBmax, b)];
        }
        if(view > 2) {
            facz = RGBmax; facy = RGBmax; facx = RGBmax;
        }

        function doFill(panel, x2, y2, y3, x4, y4, grad) {
            panel.fillStyle = createGradient(panel, 0, 0, x2, y2, grad);
            panel.fillRect(0, y3, x4, y4);
        }
        doFill(barCanvasCtx, 0, canvasSize, 0, 16, canvasSize, grad0);
        barCanvasCtx.fillStyle = "#ddd";
        barCanvasCtx.fillRect(0, parseInt(195-z/facz*195), 16, 1);

        if(view > 2) {
            doFill(panelCanvasCtx, canvasSize, 0, 0, canvasSize, canvasSize, grad2);
            for(i = 0; i < canvasSize; i++) {
                panelCanvasCtx.globalAlpha = i/canvasSize;
                doFill(panelCanvasCtx, canvasSize, 0, i, canvasSize, 1, grad4);
            }
        } else {
            doFill(panelCanvasCtx, 0, canvasSize, 0, canvasSize, canvasSize, grad2);
            doFill(panelCanvasCtx, canvasSize, 0, 0, canvasSize, canvasSize, grad4);
        }
        panelCanvasCtx.fillStyle = "#555";
        panelCanvasCtx.fillRect(0, parseInt(195-y/facy*195), canvasSize, 1);
        panelCanvasCtx.fillRect(parseInt(x/facx*195), 0, 1, canvasSize);
    
    }
    function getBarColor(event) {        
        var xy = getXY(event, barCanvas, 6),
            y = minMax(1-(xy[1]/canvasSize), 0, 1),
            hsv = doApply(solveRGB, currentColor),
            tmp = currentColor.slice(0, 3), view = getPanelView();
        if(view < 3) {
            hsv[view] = (view == 0) ? (1-y)*hueMax : y*HSVmax;
            tmp = doApply(solveHSV, hsv);
        } else {
            tmp[view-3] = parseInt(RGBmax*y);
        }
        return tmp;
    }
    function getPanelColor(event) {
        var xy = getXY(event, panelCanvas, 6),
            x = minMax((xy[0]/canvasSize), 0, 1),
            y = minMax(1-(xy[1]/canvasSize), 0, 1),
            Xindex, Yindex, tmp, view = getPanelView(),
            hsv = doApply(solveRGB, currentColor);
        if(view == 1) {
            Xindex = 2; Yindex = 0;
        } else if(view%3 == 0) {
            Xindex = 2; Yindex = 1;
        } else if(view == 4) {
            Xindex = 0; Yindex = 2;
        } else if(view%3 == 2) {
            Xindex = 1; Yindex = 0;
        }
        if(view < 3) {
            hsv[Xindex] = x*HSVmax;
            hsv[Yindex] = (Yindex ? y*HSVmax : (1-y)*hueMax);
            tmp = doApply(solveHSV, hsv);
        } else {
            tmp = currentColor.slice(0, 3);
            tmp[Xindex] = parseInt(x*RGBmax);
            tmp[Yindex] = parseInt(y*RGBmax);
        }
        return tmp;
    }
    barCanvas.mousedown(function(event) {
        var tmp = getBarColor(event);
        doSetCurrent(tmp);
        doApply(drawPanel, tmp);
        barDown = true;
    });

    panelCanvas.mousedown(function(event) {
        var tmp = getPanelColor(event);
        doSetCurrent(tmp);
        doApply(drawPanel, tmp);
        panelDown = true;
    });

    function updateColor(r, g, b, input) {
        currentColor = [r, g, b], newColor = currentColor;
        var currentHsv = solveRGB(r, g, b), 
            nextHsv = doApply(solveRGB, newColor),
            boxValues = currentHsv.concat(currentColor);
        setPalette(getHex(r, g, b));
        doApply(setWheel, currentHsv);
        doSetCurrent(newColor);
        if(input != "x") {
            hexNode.value = getHex(r, g, b);
        }
        for(i in inputBoxes) {
            if(input != inputBoxes[i][0].id) {
                inputBoxes[i].val(boxValues[i]);
            }
        }
        doApply(drawPanel, currentColor);
    }    
    doApply(updateColor, currentColor);

