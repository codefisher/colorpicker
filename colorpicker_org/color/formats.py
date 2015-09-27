import io
from struct import unpack, pack
from color import hsv_to_rgb, rgb_to_hex, hex_to_rgb, cmyk_to_rgb, lab_to_rgb

def read_gpl(data):
    lines = data.split('\n')
    first_line = lines.pop(0).strip()
    if first_line != "GIMP Palette" or first_line != 'KDE RGB Palette':
        raise ValueError("Not a GIMP Palette")
    result = {
        "data": []
    }
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line[0] == '#':
            if line[0:5] == '# CZ ':
                css, _, name = line[5:].partition(' ')
                row = {
                    'css': css,
                    'name': name
                }
                result["data"].append(row)
        elif ':' in line:
            label, _, value = line.partition(':')
            result[label.lower().strip()] = value.strip()
        else:
            items = line.split()
            if len(items) < 3:
                continue
            row = {}
            row["hex"] = rgb_to_hex(int(items[0]), int(items[1]), int(items[2]))
            if len(items) > 3 and items[3].lower() != 'untitled':
                row["name"] = items[3]
            result["data"].append(row)
    return result

def write_gpl(data, fp=None):
    colors = data['data']
    if fp is None:
        fp = io.BytesIO()
    fp.write("GIMP Palette\n")
    if 'name' in data:
        fp.write('Name: {0}\n'.format(data.get('name')))
    for color in colors:
        r, g, b = hex_to_rgb(color.get('hex'))
        if 'name' in color:
            fp.write('{0} {1} {2} {3}\n'.format(r, g, b, color.get('name')))
        else:
            fp.write('{0} {1} {2}\n'.format(r, g, b))
    if hasattr(fp, 'getvalue'):
        return fp.getvalue()

def aco_decode(code, w, x, y, z):
    row = {}
    if code == 0: #RGB
        r, g, b = int(w//256), int(x//256), int(y//256)
    elif code == 1: #HSV
        r, g, b = hsv_to_rgb(w/65535, x/65535, y/65535)
    elif code == 2: #CMYK
        r, g, b = cmyk_to_rgb(w/65535, x/65535, y/65535, z/65535)
    elif code == 7: #Lab
        r, g, b = lab_to_rgb(w/100, x/100, y/100)
    elif code == 8: #Grayscale
        r, g, b = int(w/39.0625), int(w/39.0625), int(w/39.0625)
    elif code == 9: #Wide CMYK
        r, g, b = cmyk_to_rgb(w/10000, x/10000, y/10000, z/10000)
    else:
        r, g, b = 0, 0, 0
    row['hex'] = rgb_to_hex(r, g, b)
    return row

def fp_size(fp):
    start = fp.tell()
    fp.seek(0, 2)
    size = fp.tell()
    fp.seek(start)
    return size

def read_aco(data=None, fp=None):
    if fp is None:
        fp = io.BytesIO(data)
        size = len(data)
    else:
        size = fp_size(fp)
    version, nr = unpack(">HH", fp.read(4))
    if version == 1 and size > 4 + (10 * nr):
        # check if there is a version 2 file after
        fp.seek(4 + (10 * nr))
        version, nr = unpack(">HH", fp.read(4))
    result = {
        "data": []
    }
    for i in range(nr):
        entry = fp.read(10)
        code, w, x, y, z = unpack(">HHHHH", entry)
        row = aco_decode(code, float(w), float(x), float(y), float(z))
        if version == 2:
            zero, ln = unpack(">HH", fp.read(4))
            row['name'] = fp.read(2 * (ln - 1)).decode('UTF-16BE')
            fp.read(2)
        result["data"].append(row)
    return result

def write_aco(data, fp=None):
    colors = data['data']
    if fp is None:
        fp = io.BytesIO()
    fp.write(pack(">HH", 1, len(colors)))
    for color in colors:
        r, g, b = hex_to_rgb(color.get('hex'))
        fp.write(pack(">HHHHH", 0, r*255, g*255, b*255, 0))
    fp.write(pack(">HH", 2, len(colors)))
    for i, color in enumerate(colors):
        r, g, b = hex_to_rgb(color.get('hex'))
        fp.write(pack(">HHHHH", 0, r*255, g*255, b*255, 0))
        name = color.get('name', "color{0}".format(i))
        fp.write(pack(">HH", 0, len(name) + 1))
        fp.write(name.encode('UTF-16BE'))
        fp.write(pack(">H", 0))
    if hasattr(fp, 'getvalue'):
        return fp.getvalue()

def read_ase(data=None, fp=None):
    if fp is None:
        fp = io.BytesIO(data)
    result = []
    header = fp.read(4)
    if header != "ASEF":
        raise ValueError("Not an ASE file")
    version, version_minor, blocks = unpack(">HHL", fp.read(8))
    palette = {}
    for i in range(blocks):
        if not palette:
            head, head_length, title_length = unpack(">HLH", fp.read(8))
            palette = {
                'name': fp.read(2 * (title_length - 1)).decode('UTF-16BE'),
                'data': []
            }
            fp.read(2)
        else:
            block_type, length = unpack(">HL", fp.read(6))
            if block_type == 1:
                row = {}
                title_length = unpack(">H", fp.read(2))[0]
                row['name'] = fp.read(2 * (title_length - 1)).decode('UTF-16BE')
                fp.read(2)
                color_type = fp.read(4)
                if color_type == "RGB ":
                    r, g, b, end = unpack(">fffH", fp.read(14))
                    row['hex'] = rgb_to_hex(int(r*255), int(g*255), int(b*255))
                elif color_type == "LAB ":
                    l, a, b, end = unpack(">fffH", fp.read(14))
                    row['hex'] = rgb_to_hex(*lab_to_rgb(l, a, b))
                elif color_type == "GRAY":
                    g, end = unpack(">fH", fp.read(6))
                    row['hex'] = rgb_to_hex(int(g*255), int(g*255), int(g*255))
                elif color_type == "CMYK":
                    c, m, y, k, end = unpack(">ffffH", fp.read(18))
                    row['hex'] = rgb_to_hex(*cmyk_to_rgb(c, y, m, k))
                else:
                    continue
                palette['data'].append(row)
            elif block_type == 0xC002:
                result.append(palette)
                palette = {}
    return result

def write_ase(data, fp=None):
    if fp is None:
        fp = io.BytesIO()
    fp.write("ASEF")
    num_palettes = len(data)
    num_colors = sum([len(palette['data']) for palette in data])
    fp.write(pack(">HHL", 1, 0, num_colors + (num_palettes * 2)))

    for palette in data:
        fp.write(pack(">H", 0xC001))
        name = palette.get('name', '')
        fp.write(pack(">LH", 2 * (len(name) + 1) + 2, len(name) + 1))
        fp.write(name.encode('UTF-16BE'))
        fp.write(pack(">H", 0))
        for color in palette["data"]:
            name = color.get('name', '')
            fp.write(pack(">HLH", 1, 2 * (len(name) + 1) + 20, len(name) + 1))
            fp.write(name.encode('UTF-16BE'))
            fp.write(pack(">H", 0))
            fp.write("RGB ")
            r, g, b = hex_to_rgb(color.get('hex'))
            fp.write(pack(">fffH", float(r)/255, float(g)/255, float(b)/255, 2))
        fp.write(pack(">HL", 0xC002, 0))
    if hasattr(fp, 'getvalue'):
        return fp.getvalue()