(function(document, chars){

    // once I am happy, hard code radius and width
    var wheelCtx = $("#w")[0].getContext("2d"),
        currentCtx = $("#c")[0].getContext("2d"),
        hexNode = $("#x")[0], inputBoxes = [],
        radius = 82, i = 0, width = 16, inner = radius-(width/2), color,

        ma = Math, pi = ma.PI, round = ma.round, abs = ma.abs, max = ma.max, min = ma.min, floor = ma.floor, sin = ma.sin, cos = ma.cos,

        currentColor = [255, 0, 0], newColor = [255, 0, 0],
        
        hexChars = "0123456789ABCDEF", inputBox = $("#i"), tmp, j,
        inputTag = "<input />", tdTag = "<td/>", trTag = "<tr/>",

        RGBmax = 255, HSVmax = 100,
        inputs = [["Hue", 360], ["Saturation", HSVmax], ["Value", HSVmax],
                  ["Red", RGBmax], ["Green", RGBmax], ["Blue", RGBmax]],
        
primaryColors = decode("N5N50S0S5N0"), colorPaletteItem = {}, paletteColors = decode("B;MQS:B@;KK5<KG7BA0QM@QS3CE;H=98KMCI31H?4HLGOD26D:>B5SO@?PG4C?9DE;DQF6B;0DG9PS?C>:C=FBDG>O;1BF4I>;NK5D65LH4LH81HAAJL4=?@6>@6IA1H81CSFH>AJDABCG6NA3JM=6EAHQ5==;7N3EN:9NA;IL5<C1<PA6O@0JF3NSMN7GJJ;CP58IG2CM8<SMJJ5CD@7O2>QGFOG5KQ4CJ9=P?7N28B?:NL:HR5EQ:<P;6<@3IM3CSGIC5<KG>K=7IA@NF3JQ3<>:LO87H12IF4NF@HK9>P4@R46641<E4JS@CJ:6C80RB0");

    function getHexColor(value, index) {
        return "#" + value.substr(index*3, 3).replace(/(.)(.)(.)/, "$1$1$2$2$3$3");
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
        hex = hex.replace("#", "");
        return  [hex2dec(hex[0]) * 16 + hex2dec(hex[1]),
                 hex2dec(hex[2]) * 16 + hex2dec(hex[3]),
                 hex2dec(hex[4]) * 16 + hex2dec(hex[5])];
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

    (function(){
        var div, label, radio, input;
        for(i in inputs) {
            div = $("<div/>");
            radio = $(inputTag, {"type": "radio", "name": "n", "checked": i == 0});
            div.append(radio);
            label = $("<label/>", {text: inputs[i][0]});
            input = $(inputTag, {
                    "type": "number",
                    "min": 0,
                    "max": inputs[i][1],
                    "id": inputs[i][0][0]});
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

    tmp = $(trTag);
    for(i = 0; i < 15; i++) {
        $(tdTag).appendTo(tmp);
    }
    $("#sc").append(tmp);

    function createGradient(ctx, x1, y1, x2, y2, g1, g2) {
        var gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, g1);
        gradient.addColorStop(1, g2);
        return gradient;
    }

    function setWheel(h, s, b) {
        var topX = inner*cos(pi*2/3), topY = inner*sin(pi*2/3),
            bottomX = inner*cos(pi*4/3), bottomY = inner*sin(pi*4/3),
            horizontal = inner-topX,
            vertical = topY-bottomY
        wheelCtx.save();
        wheelCtx.lineWidth = width;
        wheelCtx.clearRect(0, 0, 196, 196);
        wheelCtx.translate(radius+width, radius+width);
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
        wheelCtx.restore();
    }

    function setCurrent(r1, g1, b1, r2, g2, b2) {
        var h = getHue(r1,g1,b1), s = getSaturation(r1, g1, b1), l = getLightness(r1, g1, b1),
            f = 10, diff = [[0,-f], [f,-f], [f,0], [f,f], [0,f], [-f, f], [-f, 0], [-f,-f]];

        currentCtx.save();
        currentCtx.clearRect(0, 0, 120, 120);
        currentCtx.translate(60, 60);

        for(i in diff) {
            currentCtx.fillStyle = "hsl("+h+","+(s+diff[i][0])+"%,"+(l+diff[i][1])+"%)";
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

    function updateColor(r, g, b) {
        newColor = currentColor, currentColor = [r, g, b];
        var currentHsv = solveRGB(r, g, b), 
            nextHsv = solveRGB.apply(null, newColor),
            boxValues = currentColor.concat(currentHsv);

        setPalette(getHex(r, g, b));
        setWheel.apply(null, currentHsv);
        setCurrent.apply(null, currentColor.concat(newColor));
        hexNode.value = getHex(r, g, b);
        for(i in inputBoxes) {
            inputBoxes[i].val(boxValues[i]);
        }
    }

    //updateColor.apply(null, solveHSV(360, 100, 100));
    function s(i) {
        updateColor.apply(null, solveHSV(i%360, 100, 100));
        setTimeout(function() { s(i+1) }, 100);
    }
    //s(0);
    
})(document, "0369CF");
