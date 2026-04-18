import openpyxl, re

def read_sheet(path):
    wb = openpyxl.load_workbook(path)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    headers = rows[0]
    return [dict(zip(headers, r)) for r in rows[1:]
            if r[4] is not None and r[5] is not None]  # require CRN and SUBJ

def clean(s):
    if s is None: return None
    return str(s).strip().replace("'", "''")

def parse_time(t):
    if not t: return None, None
    m = re.match(r'(\d+:\d+\s*[AP]M)\s*-\s*(\d+:\d+\s*[AP]M)', str(t).strip(), re.IGNORECASE)
    if not m: return None, None
    def to24(ts):
        ts = ts.strip()
        h, rest = ts.split(':')
        mn, ampm = rest[:2], rest[2:].strip()
        h, mn = int(h), int(mn)
        if ampm.upper() == 'PM' and h != 12: h += 12
        if ampm.upper() == 'AM' and h == 12: h = 0
        return f'{h:02d}:{mn:02d}:00'
    return to24(m.group(1)), to24(m.group(2))

def parse_tas(names_str, emails_str, ta_type):
    if not names_str: return []
    names = [n.strip() for n in str(names_str).replace('\n', ',').split(',') if n.strip()]
    emails = [e.strip() for e in str(emails_str or '').replace('\n', ',').split(',') if e.strip()] if emails_str else []
    result = []
    for i, name in enumerate(names):
        m = re.match(r'^(.+?)\s*\((\d+)\)$', name)
        if m:
            n, hrs = m.group(1).strip(), int(m.group(2))
        else:
            n, hrs = name, None
        email = emails[i] if i < len(emails) else None
        if n:
            result.append({'name': n, 'email': email, 'hours': hrs, 'type': ta_type})
    return result

s26 = read_sheet('c:/project2-group3/Bellini Classes S26.xlsx')
new = read_sheet('c:/project2-group3/Bellini Classes S26_NewClassesToBeAddedWhenSystemReady.xlsx')
all_rows = s26 + new

subjects = sorted(set(r['SUBJ'] for r in all_rows if r.get('SUBJ')))
raw_rooms = sorted(set(r['MEETING ROOM'] for r in all_rows if r.get('MEETING ROOM')))
real_rooms = [r for r in raw_rooms if r not in ('TBAT TBA', 'OFFT OFF')]

instructors = {}
for r in all_rows:
    if r.get('INSTRUCTOR') and r.get('INSTRUCTOR EMAIL'):
        email = clean(r['INSTRUCTOR EMAIL'])
        if email not in instructors:
            instructors[email] = clean(r['INSTRUCTOR'])

courses = {}
for r in all_rows:
    key = (r['SUBJ'], str(r['CRSE NUMB']), r['CRSE TITLE'], r['CRSE LEVL'])
    courses[key] = True

all_tas = {}
for r in all_rows:
    for ta in parse_tas(r.get('Grad TAs'), r.get('Grad TA Emails'), 'GRAD'):
        if ta['email'] and ta['email'] not in all_tas:
            all_tas[ta['email']] = ta
    for ta in parse_tas(r.get('UGTAs'), r.get('UGTA Emails'), 'UGTA'):
        if ta['email'] and ta['email'] not in all_tas:
            all_tas[ta['email']] = ta

lines = []
lines.append('-- ============================================================')
lines.append('-- S26 Data Import: 164 sections (Bellini Classes S26 + NewClasses)')
lines.append('-- Paste into Supabase SQL Editor and run')
lines.append('-- All inserts use ON CONFLICT DO NOTHING - safe to re-run')
lines.append('-- ============================================================')
lines.append('')

# 1. Campus
lines.append('-- 1. Add Off-campus - Tampa campus')
lines.append("INSERT INTO campuses (code, name) VALUES ('OFF_TAMPA', 'Off-campus - Tampa') ON CONFLICT (code) DO NOTHING;")
lines.append('')

# 2. Subjects
lines.append('-- 2. Subjects')
vals = ', '.join(f"('{s}', '{s}')" for s in subjects)
lines.append(f'INSERT INTO subjects (code, name) VALUES {vals} ON CONFLICT (code) DO NOTHING;')
lines.append('')

# 3. Rooms
lines.append('-- 3. Rooms')
room_vals = []
for room in real_rooms:
    parts = room.split()
    building = clean(parts[0]) if parts else clean(room)
    room_num = clean(' '.join(parts[1:])) if len(parts) > 1 else ''
    room_vals.append(f"  ('{clean(room)}', '{building}', '{room_num}', false)")
lines.append('INSERT INTO rooms (room_code, building, room_number, is_online) VALUES')
lines.append(',\n'.join(room_vals))
lines.append('ON CONFLICT (room_code) DO NOTHING;')
lines.append('')

# 4. Instructors
lines.append('-- 4. Instructors')
inst_vals = []
for email, name in instructors.items():
    inst_vals.append(f"  ('{email}', '{name}')")
lines.append('INSERT INTO instructors (email, full_name) VALUES')
lines.append(',\n'.join(inst_vals))
lines.append('ON CONFLICT (email) DO NOTHING;')
lines.append('')

# 5. Courses
lines.append('-- 5. Courses')
course_vals = []
for (subj, num, title, level) in sorted(courses.keys(), key=lambda x: (x[0] or '', x[1] or '', x[2] or '', x[3] or '')):
    lvl = level if level in ('UG', 'GR', 'UGRD', 'GRAD') else 'UG'
    course_vals.append(
        f"  ((SELECT id FROM subjects WHERE code='{subj}'), '{clean(num)}', '{clean(title)}', '{lvl}'::course_level)"
    )
lines.append('INSERT INTO courses (subject_id, course_number, title, course_level) VALUES')
lines.append(',\n'.join(course_vals))
lines.append('ON CONFLICT (subject_id, course_number) DO NOTHING;')
lines.append('')

# 6. TAs
lines.append('-- 6. Teaching Assistants')
ta_vals = []
for email, ta in sorted(all_tas.items()):
    ta_type = 'GRAD' if ta['type'] == 'GRAD' else 'UGTA'
    ta_name = clean(ta["name"])
    ta_vals.append(f"  ('{clean(email)}', '{ta_name}', '{ta_type}'::ta_type)")
lines.append('INSERT INTO tas (email, full_name, ta_type) VALUES')
lines.append(',\n'.join(ta_vals))
lines.append('ON CONFLICT (email) DO NOTHING;')
lines.append('')

# 7. Sections
lines.append('-- 7. Sections (164 total)')
sec_vals = []
for r in all_rows:
    campus_code = 'TAMPA' if r['CAMPUS'] == 'Tampa' else 'OFF_TAMPA'
    subj = r['SUBJ']
    num = str(r['CRSE NUMB'])
    crn = str(r['CRN'])
    sec = clean(str(r['CRSE SECTION']))
    lvl = r['CRSE LEVL'] if r['CRSE LEVL'] in ('UG', 'GR', 'UGRD', 'GRAD') else 'UG'
    days = clean(r.get('MEETING DAYS')) or 'TBA'
    times = clean(r.get('MEETING TIMES'))
    t_start, t_end = parse_time(times)
    room = clean(r.get('MEETING ROOM'))
    enroll = r.get('ENROLLMENT') if isinstance(r.get('ENROLLMENT'), (int, float)) else 0
    email = clean(r.get('INSTRUCTOR EMAIL'))

    room_ref = f"(SELECT id FROM rooms WHERE room_code='{room}')" if room and room not in ('TBAT TBA', 'OFFT OFF') else 'NULL'
    t_start_sql = f"'{t_start}'" if t_start else 'NULL'
    t_end_sql = f"'{t_end}'" if t_end else 'NULL'
    times_sql = f"'{times}'" if times else 'NULL'
    inst_ref = f"(SELECT id FROM instructors WHERE email='{email}')" if email else 'NULL'

    sec_vals.append(
        f"  ((SELECT id FROM semesters WHERE code='S26'),"
        f" (SELECT id FROM campuses WHERE code='{campus_code}'),"
        f" (SELECT id FROM courses WHERE subject_id=(SELECT id FROM subjects WHERE code='{subj}') AND course_number='{clean(num)}'),"
        f" '{crn}', '{sec}', '{lvl}'::course_level,"
        f" '{days}', {times_sql}, {t_start_sql}, {t_end_sql},"
        f" {room_ref}, {enroll},"
        f" {inst_ref})"
    )

lines.append('INSERT INTO sections')
lines.append('  (semester_id, campus_id, course_id, crn, section_code, course_level,')
lines.append('   meeting_days, meeting_times, meeting_time_start, meeting_time_end,')
lines.append('   room_id, enrollment, instructor_id)')
lines.append('VALUES')
lines.append(',\n'.join(sec_vals))
lines.append('ON CONFLICT (semester_id, crn) DO NOTHING;')
lines.append('')

# 8. TA Assignments
lines.append('-- 8. TA Assignments')
assign_vals = []
for r in all_rows:
    crn = str(r['CRN'])
    for ta in parse_tas(r.get('Grad TAs'), r.get('Grad TA Emails'), 'GRAD'):
        if ta['email']:
            hrs = str(ta['hours']) if ta['hours'] else 'NULL'
            ta_email = clean(ta["email"])
            assign_vals.append(
                f"  ((SELECT id FROM sections WHERE crn='{crn}' AND semester_id=(SELECT id FROM semesters WHERE code='S26')),"
                f" (SELECT id FROM tas WHERE email='{ta_email}'),"
                f" {hrs})"
            )
    for ta in parse_tas(r.get('UGTAs'), r.get('UGTA Emails'), 'UGTA'):
        if ta['email']:
            hrs = str(ta['hours']) if ta['hours'] else 'NULL'
            ta_email = clean(ta["email"])
            assign_vals.append(
                f"  ((SELECT id FROM sections WHERE crn='{crn}' AND semester_id=(SELECT id FROM semesters WHERE code='S26')),"
                f" (SELECT id FROM tas WHERE email='{ta_email}'),"
                f" {hrs})"
            )

if assign_vals:
    lines.append('INSERT INTO ta_assignments (section_id, ta_id, hours) VALUES')
    lines.append(',\n'.join(assign_vals))
    lines.append('ON CONFLICT (section_id, ta_id) DO NOTHING;')

sql = '\n'.join(lines)
with open('c:/project2-group3/s26_import.sql', 'w') as f:
    f.write(sql)

print(f'Generated s26_import.sql')
print(f'  Sections:       {len(all_rows)}')
print(f'  Subjects:       {len(subjects)}')
print(f'  Rooms:          {len(real_rooms)}')
print(f'  Instructors:    {len(instructors)}')
print(f'  Courses:        {len(courses)}')
print(f'  TAs:            {len(all_tas)}')
print(f'  TA assignments: {len(assign_vals)}')
