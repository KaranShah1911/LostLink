"""Generates use_case.svg, the UML use case diagram of LostLink.

Run:  python3 use_case.py
Layout is computed here (not by an automatic layout tool) so that every label, actor and
connector has a fixed, readable position.
"""
from xml.sax.saxutils import escape

W, H = 1200, 860
FONT = 'Liberation Sans, Arial, Helvetica, sans-serif'
NAVY, GREY, FILL = '#1F3A5F', '#4A5568', '#F4F6F9'
FS = 17  # use case label size (SVG units)


def text_width(s, size=FS):
    # Average glyph width of Liberation Sans is about 0.53 of the font size.
    return len(s) * size * 0.53


def ellipse(cx, cy, label):
    rx = text_width(label) / 2 + 26
    ry = 22
    return (rx, ry), (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx:.0f}" ry="{ry}" fill="{FILL}" stroke="{NAVY}" stroke-width="1.4"/>'
                      f'<text x="{cx}" y="{cy + 5.5}" font-size="{FS}" text-anchor="middle">{escape(label)}</text>')


def actor(x, y, name):
    # Stick figure: head centre (x, y); total height about 90.
    return (f'<g stroke="{NAVY}" stroke-width="2" fill="none">'
            f'<circle cx="{x}" cy="{y}" r="13" fill="white"/>'
            f'<line x1="{x}" y1="{y + 13}" x2="{x}" y2="{y + 50}"/>'
            f'<line x1="{x - 22}" y1="{y + 26}" x2="{x + 22}" y2="{y + 26}"/>'
            f'<line x1="{x}" y1="{y + 50}" x2="{x - 18}" y2="{y + 78}"/>'
            f'<line x1="{x}" y1="{y + 50}" x2="{x + 18}" y2="{y + 78}"/></g>'
            f'<text x="{x}" y="{y + 100}" font-size="17" font-weight="bold" text-anchor="middle" fill="{NAVY}">{escape(name)}</text>')


parts = []
# System boundary
BX0, BY0, BX1, BY1 = 160, 20, 1040, 690
parts.append(f'<rect x="{BX0}" y="{BY0}" width="{BX1 - BX0}" height="{BY1 - BY0}" rx="6" fill="white" stroke="{GREY}" stroke-width="1.5"/>')
parts.append(f'<text x="{(BX0 + BX1) / 2}" y="{BY0 + 30}" font-size="18" font-weight="bold" text-anchor="middle" fill="{NAVY}">LostLink mobile application</text>')

student_cases = [
    'Register account',
    'View home dashboard',
    'Browse and search items',
    'Filter and sort listings',
    'Report lost item',
    'Report found item',
    'Submit ownership claim',
    'Track claim progress',
    'Approve / reject claims',
    'Manage own reports',
    'View notifications',
]
admin_cases = [
    'View dashboard statistics',
    'View and filter all reports',
    'Remove inappropriate report',
    'Inspect claims (read-only)',
]
shared_cases = ['Log in / Log out', 'View item details', 'Manage profile & theme', 'Read help guides']

# Actors
SX, SY = 75, 255      # Student (left, outside boundary)
AX, AY = 1125, 485    # Administrator (right), hands level with its use cases
RX, RY = 600, 735     # Registered user (below boundary)
parts.append(actor(SX, SY, 'Student'))
parts.append(actor(AX, AY, 'Administrator'))
parts.append(actor(RX, RY, 'Registered user'))

lines, shapes = [], []
pos = {}
# Student-only column
for i, label in enumerate(student_cases):
    cx, cy = 390, 85 + i * 50
    (rx, ry), svg = ellipse(cx, cy, label)
    pos[label] = (cx, cy, rx, ry)
    shapes.append(svg)
    lines.append(f'<line x1="{SX + 24}" y1="{SY + 30}" x2="{cx - rx}" y2="{cy}" stroke="{GREY}" stroke-width="1.2"/>')

# <<include>> photo use case, between the two report use cases
inc_label = 'Attach photo (camera / gallery)'
icx, icy = 735, 335
(irx, iry), svg = ellipse(icx, icy, inc_label)
shapes.append(svg)
for label in ('Report lost item', 'Report found item'):
    cx, cy, rx, ry = pos[label]
    x1, y1, x2, y2 = cx + rx, cy, icx - irx, icy
    lines.append(f'<line x1="{x1:.0f}" y1="{y1}" x2="{x2:.0f}" y2="{y2}" stroke="{GREY}" stroke-width="1.2" stroke-dasharray="6 4" marker-end="url(#open)"/>')
# Label placed above the include ellipse, clear of both dashed arrows.
lines.append(f'<text x="{icx}" y="{icy - 32}" font-size="14" text-anchor="middle" fill="{GREY}">«include»</text>')

# Admin-only column
for i, label in enumerate(admin_cases):
    cx, cy = 870, 440 + i * 50
    (rx, ry), svg = ellipse(cx, cy, label)
    shapes.append(svg)
    lines.append(f'<line x1="{AX - 24}" y1="{AY + 30}" x2="{cx + rx:.0f}" y2="{cy}" stroke="{GREY}" stroke-width="1.2"/>')

# Shared row (associated with the abstract "Registered user" actor)
xs = [270, 465, 690, 925]
for cx, label in zip(xs, shared_cases):
    cy = 638
    (rx, ry), svg = ellipse(cx, cy, label)
    shapes.append(svg)
    lines.append(f'<line x1="{RX}" y1="{RY - 14}" x2="{cx}" y2="{cy + ry}" stroke="{GREY}" stroke-width="1.2"/>')

# Generalisation: Student and Administrator are kinds of Registered user (hollow triangle)
gy = RY + 40
lines.append(f'<polyline points="{SX},{SY + 112} {SX},{gy} {RX - 30},{gy}" fill="none" stroke="{GREY}" stroke-width="1.3" marker-end="url(#gen)"/>')
lines.append(f'<polyline points="{AX},{AY + 112} {AX},{gy} {RX + 30},{gy}" fill="none" stroke="{GREY}" stroke-width="1.3" marker-end="url(#gen)"/>')

defs = (f'<defs>'
        f'<marker id="open" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10" fill="none" stroke="{GREY}" stroke-width="1.5"/></marker>'
        f'<marker id="gen" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="14" markerHeight="14" orient="auto-start-reverse">'
        f'<path d="M0,0 L12,6 L0,12 Z" fill="white" stroke="{GREY}" stroke-width="1.3"/></marker></defs>')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
       f'font-family="{FONT}" fill="#1A202C">{defs}' + ''.join(parts[:2]) + ''.join(lines) + ''.join(parts[2:]) + ''.join(shapes) + '</svg>')
open('use_case.svg', 'w').write(svg)
print('use_case.svg written')
