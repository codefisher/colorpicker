"""
Functions for converting from to too different color spaces.

Code is converted to python from http://www.easyrgb.com/index.php?X=MATH
"""

from struct import unpack

def rgb_to_hex(r, g, b):
    return "#{0:02x}{1:02x}{2:02x}".format(r, g, b)

def hex_to_rgb(code):
    return unpack('BBB',code.replace('#', '').decode('hex'))

def hsv_to_rgb(h, s, v):
    """
    Converts HSV to RGB.  h, s and v are in the range 0...1
    """
    if s == 0:
        return [v * 255, v * 255, v * 255]
    var_h = h * 6
    if var_h == 6:
        var_h = 0
    var_i = int(var_h)
    var_1 = v * (1 - s)
    var_2 = v * (1 - s * (var_h - var_i))
    var_3 = v * (1 - s * (1 - (var_h - var_i)))

    if var_i == 0:
        var_r = v
        var_g = var_3
        var_b = var_1
    elif var_i == 1:
        var_r = var_2
        var_g = v
        var_b = var_1
    elif var_i == 2:
        var_r = var_1
        var_g = v
        var_b = var_3
    elif var_i == 3:
        var_r = var_1
        var_g = var_2
        var_b = v
    elif var_i == 4:
        var_r = var_3
        var_g = var_1
        var_b = v
    else:
        var_r = v
        var_g = var_1
        var_b = var_2
    return (var_r * 255, var_g * 255, var_b * 255)

def cmyk_to_cmy(c, y, m, k):
    C = (c * (1 - k) + k)
    M = (m * (1 - k) + k)
    Y = (y * (1 - k) + k)

    return (C, M, Y)

def cmyk_to_rgb(c, y, m, k):
    C, M, Y = cmyk_to_cmy(c, y, m, k)

    R = (1 - C) * 255
    G = (1 - M) * 255
    B = (1 - Y) * 255

    return [R, G, B]


def lab_to_xyz(L, a, b):
    var_Y = (L + 16) / 116
    var_X = a / 500 + var_Y
    var_Z = var_Y - b / 200

    if pow(var_Y, 3) > 0.008856:
        var_Y = pow(var_Y, 3)
    else:
        var_Y = (var_Y - 16 / 116) / 7.787
    if pow(var_X, 3) > 0.008856:
        var_X = pow(var_X, 3)
    else:
        var_X = (var_X - 16 / 116) / 7.787
    if pow(var_Z, 3) > 0.008856:
        var_Z = pow(var_Z, 3)
    else:
        var_Z = (var_Z - 16 / 116) / 7.787

    ref_X = 95.047
    ref_Y = 100.000
    ref_Z = 108.883

    X = ref_X * var_X
    Y = ref_Y * var_Y
    Z = ref_Z * var_Z

    return (X, Y, Z)


def lab_to_rgb(L, a, b):
    X, Y, Z = lab_to_xyz(L, a, b)

    var_X = X / 100
    var_Y = Y / 100
    var_Z = Z / 100

    var_R = var_X * 3.2406 + var_Y * -1.5372 + var_Z * -0.4986
    var_G = var_X * -0.9689 + var_Y * 1.8758 + var_Z * 0.0415
    var_B = var_X * 0.0557 + var_Y * -0.2040 + var_Z * 1.0570

    if var_R > 0.0031308:
        var_R = 1.055 * pow(var_R, 1 / 2.4) - 0.055
    else:
        var_R = 12.92 * var_R
    if var_G > 0.0031308:
        var_G = 1.055 * pow(var_G, 1 / 2.4) - 0.055
    else:
        var_G = 12.92 * var_G
    if var_B > 0.0031308:
        var_B = 1.055 * pow(var_B, 1 / 2.4) - 0.055
    else:
        var_B = 12.92 * var_B

    R = var_R * 255
    G = var_G * 255
    B = var_B * 255

    return (R, G, B)
