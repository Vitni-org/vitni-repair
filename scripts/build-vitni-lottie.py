#!/usr/bin/env python3
"""Build Vitni's shape-based Lottie from the master SVG without extra dependencies."""

import copy
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SVG_NS = '{http://www.w3.org/2000/svg}'
ET.register_namespace('', 'http://www.w3.org/2000/svg')


def number(value):
    value = float(value)
    return round(value, 4) if value % 1 else int(value)


def tokenize_path(source):
    return re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?', source)


def svg_path_shapes(source):
    """Convert the SVG master's M/L/H/V/C/S/Q/T/Z commands to Lottie Beziers."""
    tokens = tokenize_path(source)
    paths = []
    points = []
    closed = False
    x = y = 0.0
    start = (0.0, 0.0)
    command = None
    previous_command = None
    cubic_control = None
    quadratic_control = None
    i = 0

    def finish():
        nonlocal points, closed
        if points:
            paths.append({
                'c': closed,
                'v': [[number(point[0]), number(point[1])] for point in points],
                'i': [[number(point[2]), number(point[3])] for point in points],
                'o': [[number(point[4]), number(point[5])] for point in points],
            })
        points = []
        closed = False

    def add_line(nx, ny):
        nonlocal x, y, cubic_control, quadratic_control, previous_command
        points[-1][4:] = [0.0, 0.0]
        points.append([nx, ny, 0.0, 0.0, 0.0, 0.0])
        x, y = nx, ny
        cubic_control = quadratic_control = None

    while i < len(tokens):
        if tokens[i].isalpha():
            command = tokens[i]
            i += 1
            if command.upper() == 'Z':
                closed = True
                if points and (points[-1][0], points[-1][1]) == start and len(points) > 1:
                    points.pop()
                if points:
                    points[-1][4:] = [0.0, 0.0]
                x, y = start
                previous_command = command
                cubic_control = quadratic_control = None
                finish()
                command = None
                continue
        if command is None:
            continue

        upper = command.upper()
        relative = command.islower()
        if upper == 'M':
            nx, ny = float(tokens[i]), float(tokens[i + 1]); i += 2
            if relative:
                nx += x; ny += y
            finish()
            x, y = nx, ny
            start = (x, y)
            points = [[x, y, 0.0, 0.0, 0.0, 0.0]]
            command = 'l' if relative else 'L'
            previous_command = 'M'
            cubic_control = quadratic_control = None
        elif upper == 'L':
            nx, ny = float(tokens[i]), float(tokens[i + 1]); i += 2
            if relative:
                nx += x; ny += y
            add_line(nx, ny); previous_command = upper
        elif upper == 'H':
            nx = float(tokens[i]); i += 1
            if relative:
                nx += x
            add_line(nx, y); previous_command = upper
        elif upper == 'V':
            ny = float(tokens[i]); i += 1
            if relative:
                ny += y
            add_line(x, ny); previous_command = upper
        elif upper in ('C', 'S'):
            x0, y0 = x, y
            if upper == 'C':
                x1, y1, x2, y2, nx, ny = map(float, tokens[i:i + 6]); i += 6
                if relative:
                    x1 += x0; y1 += y0; x2 += x0; y2 += y0; nx += x0; ny += y0
            else:
                if previous_command in ('C', 'S') and cubic_control:
                    x1, y1 = 2 * x0 - cubic_control[0], 2 * y0 - cubic_control[1]
                else:
                    x1, y1 = x0, y0
                x2, y2, nx, ny = map(float, tokens[i:i + 4]); i += 4
                if relative:
                    x2 += x0; y2 += y0; nx += x0; ny += y0
            points[-1][4:] = [x1 - x0, y1 - y0]
            points.append([nx, ny, x2 - nx, y2 - ny, 0.0, 0.0])
            x, y = nx, ny
            cubic_control = (x2, y2)
            quadratic_control = None
            previous_command = upper
        elif upper in ('Q', 'T'):
            x0, y0 = x, y
            if upper == 'Q':
                qx, qy, nx, ny = map(float, tokens[i:i + 4]); i += 4
                if relative:
                    qx += x0; qy += y0; nx += x0; ny += y0
            else:
                if previous_command in ('Q', 'T') and quadratic_control:
                    qx, qy = 2 * x0 - quadratic_control[0], 2 * y0 - quadratic_control[1]
                else:
                    qx, qy = x0, y0
                nx, ny = map(float, tokens[i:i + 2]); i += 2
                if relative:
                    nx += x0; ny += y0
            x1, y1 = x0 + (2 / 3) * (qx - x0), y0 + (2 / 3) * (qy - y0)
            x2, y2 = nx + (2 / 3) * (qx - nx), ny + (2 / 3) * (qy - ny)
            points[-1][4:] = [x1 - x0, y1 - y0]
            points.append([nx, ny, x2 - nx, y2 - ny, 0.0, 0.0])
            x, y = nx, ny
            quadratic_control = (qx, qy)
            cubic_control = None
            previous_command = upper
        else:
            raise ValueError(f'Unsupported SVG path command: {command}')

    finish()
    return paths


def rgb(color):
    if not color or color == 'none':
        return None
    if color.startswith('#') and len(color) == 7:
        return [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)] + [1]
    raise ValueError(f'Unsupported SVG color: {color}')


def shape_group(geometry, style, name, index):
    items = [geometry]
    fill = rgb(style.get('fill'))
    stroke = rgb(style.get('stroke'))
    if fill:
        items.append({'ty': 'fl', 'c': {'a': 0, 'k': fill}, 'o': {'a': 0, 'k': 100}, 'r': 1, 'bm': 0, 'nm': 'Flat colour'})
    if stroke:
        caps = {'butt': 1, 'round': 2, 'square': 3}
        joins = {'miter': 1, 'round': 2, 'bevel': 3}
        items.append({
            'ty': 'st', 'c': {'a': 0, 'k': stroke}, 'o': {'a': 0, 'k': 100},
            'w': {'a': 0, 'k': number(style.get('stroke-width', 1))},
            'lc': caps.get(style.get('stroke-linecap', 'butt'), 1),
            'lj': joins.get(style.get('stroke-linejoin', 'miter'), 1),
            'ml': 4, 'bm': 0, 'nm': 'Ink outline'
        })
    items.append({'ty': 'tr', 'p': {'a': 0, 'k': [0, 0]}, 'a': {'a': 0, 'k': [0, 0]}, 's': {'a': 0, 'k': [100, 100]}, 'r': {'a': 0, 'k': 0}, 'o': {'a': 0, 'k': 100}, 'sk': {'a': 0, 'k': 0}, 'sa': {'a': 0, 'k': 0}, 'nm': 'Transform'})
    return {'ty': 'gr', 'it': items, 'nm': name, 'np': len(items) - 1, 'cix': 2, 'bm': 0, 'ix': index, 'mn': 'ADBE Vector Group'}


def leaf_groups(element, style, index):
    name = element.get('id') or element.get('class') or element.tag.split('}')[-1]
    tag = element.tag.replace(SVG_NS, '')
    geometries = []
    if tag == 'path':
        geometries = [{'ty': 'sh', 'ks': {'a': 0, 'k': path}, 'nm': 'Contour'} for path in svg_path_shapes(element.get('d', ''))]
    elif tag in ('circle', 'ellipse'):
        cx, cy = float(element.get('cx', 0)), float(element.get('cy', 0))
        rx = float(element.get('r', element.get('rx', 0)))
        ry = float(element.get('r', element.get('ry', 0)))
        geometries = [{'ty': 'el', 'd': 1, 's': {'a': 0, 'k': [number(rx * 2), number(ry * 2)]}, 'p': {'a': 0, 'k': [number(cx), number(cy)]}, 'nm': 'Ellipse'}]
    elif tag == 'rect':
        x, y = float(element.get('x', 0)), float(element.get('y', 0))
        width, height = float(element.get('width', 0)), float(element.get('height', 0))
        radius = min(float(element.get('rx', 0)), width / 2, height / 2)
        geometries = [{'ty': 'rc', 'd': 1, 's': {'a': 0, 'k': [number(width), number(height)]}, 'p': {'a': 0, 'k': [number(x + width / 2), number(y + height / 2)]}, 'r': {'a': 0, 'k': number(radius)}, 'nm': 'Rounded rectangle'}]
    return [shape_group(geometry, style, name, index + offset) for offset, geometry in enumerate(geometries)]


def selected_shapes(root, mode):
    result = []

    def walk(node, inherited, ids):
        style = inherited.copy()
        for key in ('fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'):
            if key in node.attrib:
                style[key] = node.attrib[key]
        current_ids = ids + ([node.get('id')] if node.get('id') else [])
        is_face = 'vitni-face-features' in current_ids
        is_tool = 'vitni-wrench' in current_ids
        if mode == 'body' and (is_face or is_tool):
            return
        if mode == 'face' and not is_face or mode == 'tool' and not is_tool:
            for child in node:
                walk(child, style, current_ids)
            return
        tag = node.tag.replace(SVG_NS, '')
        if tag in ('path', 'rect', 'circle', 'ellipse'):
            result.extend(leaf_groups(node, style, len(result) + 1))
            return
        for child in node:
            walk(child, style, current_ids)

    walk(root, {}, [])
    return list(reversed(result))


def eased(frame, start, end):
    return {'t': frame, 's': start, 'e': end, 'o': {'x': [0.333], 'y': [0]}, 'i': {'x': [0.667], 'y': [1]}}


def arrival_position(base):
    x, y = base[:2]
    return {'a': 1, 'k': [
        eased(0, [x, y + 7, 0], [x, y - 1, 0]),
        eased(12, [x, y - 1, 0], [x, y + 1, 0]),
        eased(21, [x, y + 1, 0], [x, y, 0]),
        {'t': 30, 's': [x, y, 0], 'h': 1},
        {'t': 150, 's': [x, y, 0], 'h': 1}
    ]}


def image_free_layer(index, name, shapes, opacity=None, rotation=None, anchor=(0, 0, 0), position=(0, 0, 0)):
    return {
        'ddd': 0, 'ind': index, 'ty': 4, 'nm': name, 'sr': 1,
        'ks': {
            'o': opacity or {'a': 0, 'k': 100},
            'r': rotation or {'a': 0, 'k': 0},
            'p': arrival_position(position), 'a': {'a': 0, 'k': list(anchor[:2])}, 's': {'a': 0, 'k': [100, 100]}
        },
        'ao': 0, 'shapes': shapes, 'ip': 0, 'op': 150, 'st': 0, 'bm': 0
    }


def blink_layer(shapes):
    return {'a': 1, 'k': [
        {'t': 0, 's': [0], 'e': [0], 'h': 1},
        {'t': 48, 's': [0], 'e': [100], 'h': 1},
        {'t': 49, 's': [100], 'e': [100], 'h': 1},
        {'t': 51, 's': [100], 'e': [100], 'h': 1},
        {'t': 52, 's': [100], 'e': [0], 'h': 1},
        {'t': 53, 's': [0], 'e': [0], 'h': 1},
        {'t': 115, 's': [0], 'e': [100], 'h': 1},
        {'t': 116, 's': [100], 'e': [100], 'h': 1},
        {'t': 119, 's': [100], 'e': [100], 'h': 1},
        {'t': 120, 's': [100], 'e': [0], 'h': 1},
        {'t': 121, 's': [0], 'e': [0], 'h': 1},
        {'t': 150, 's': [0], 'h': 1}
    ]}


def open_face_layer():
    return {'a': 1, 'k': [
        {'t': 0, 's': [100], 'e': [100], 'h': 1},
        {'t': 48, 's': [100], 'e': [0], 'h': 1},
        {'t': 49, 's': [0], 'e': [0], 'h': 1},
        {'t': 51, 's': [0], 'e': [0], 'h': 1},
        {'t': 52, 's': [0], 'e': [100], 'h': 1},
        {'t': 53, 's': [100], 'e': [100], 'h': 1},
        {'t': 115, 's': [100], 'e': [0], 'h': 1},
        {'t': 116, 's': [0], 'e': [0], 'h': 1},
        {'t': 119, 's': [0], 'e': [0], 'h': 1},
        {'t': 120, 's': [0], 'e': [100], 'h': 1},
        {'t': 121, 's': [100], 'e': [100], 'h': 1},
        {'t': 150, 's': [100], 'h': 1}
    ]}


def main():
    master = ET.parse(ROOT / 'public/images/vitni.svg').getroot()
    blink_master = copy.deepcopy(master)
    eyes = next(node for node in blink_master.iter() if node.get('id') == 'vitni-eyes-open')
    eyebrow = eyes[0]
    for child in list(eyes):
        eyes.remove(child)
    eyes.append(eyebrow)
    ET.SubElement(eyes, SVG_NS + 'path', {
        'd': 'M134 108q9 8 18 0m26 0q9 8 18 0', 'fill': 'none', 'stroke': '#F7F8F3',
        'stroke-width': '4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    })

    open_face = selected_shapes(master, 'face')
    closed_face = selected_shapes(blink_master, 'face')
    wrench = selected_shapes(master, 'tool')
    body = selected_shapes(master, 'body')
    tool_rotation = {'a': 1, 'k': [
        eased(0, [0], [-4]), eased(7, [-4], [5]), eased(16, [5], [-5]),
        eased(25, [-5], [0]), {'t': 33, 's': [0], 'h': 1},
        {'t': 74, 's': [0], 'h': 1}, eased(75, [0], [-4]), eased(82, [-4], [5]),
        eased(91, [5], [-5]), eased(100, [-5], [0]), {'t': 108, 's': [0], 'h': 1},
        {'t': 150, 's': [0], 'h': 1}
    ]}
    lottie = {
        'v': '5.7.4', 'fr': 30, 'ip': 0, 'op': 150, 'w': 320, 'h': 360,
        'nm': 'Vitni · Ligne claire repair sidekick', 'ddd': 0, 'assets': [],
        'layers': [
            image_free_layer(1, 'Vitni · expressive eyes', open_face, open_face_layer(), anchor=(160, 180, 0), position=(160, 180, 0)),
            image_free_layer(2, 'Vitni · blink', closed_face, blink_layer(closed_face), anchor=(160, 180, 0), position=(160, 180, 0)),
            image_free_layer(3, 'Vitni · raised wrench', wrench, rotation=tool_rotation, anchor=(263, 172, 0), position=(263, 172, 0)),
            image_free_layer(4, 'Vitni · ligne claire body', body, anchor=(160, 180, 0), position=(160, 180, 0))
        ],
        'markers': []
    }
    target = ROOT / 'public/animations/vitni-repair-v4.json'
    target.write_text(json.dumps(lottie, separators=(',', ':')) + '\n')
    print(f'Built {target.name} from public/images/vitni.svg with {len(body)} body shapes, {len(open_face)} face shapes, and {len(wrench)} wrench shapes.')


if __name__ == '__main__':
    main()
