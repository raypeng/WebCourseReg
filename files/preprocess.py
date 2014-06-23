# -*- coding: utf-8 -*-
import urllib2
import json
import re
from itertools import product
from operator import add

INDEX = 'https://w5.ab.ust.hk/wcq/cgi-bin/1330/'

def replace_dict(s, d):
    for key, val in d.iteritems():
        s = s.replace(key, str(val))
    return s

    
def map_time(s):
    ''' input ~ 'TuTh 09:00AM - 10:20AM'
    '''
    day_map = {'Mo': 1, 'Tu': 2, 'We': 3, 'Th': 4, 'Fr': 5, 'Sa': 6, 'Su': 7}
    time_replace = {'12:20': '12:30', '12:50': '01:00',
                    '01:20': '01:30', '01:50': '02:00',
                    '02:20': '02:30', '02:50': '03:00',
                    '03:20': '03:30', '03:50': '04:00',
                    '04:20': '04:30', '04:50': '05:00',
                    '05:20': '05:30', '05:50': '06:00',
                    '06:20': '06:30', '06:50': '07:00',
                    '07:20': '07:30', '07:50': '08:00',
                    '08:20': '08:30', '08:50': '09:00',
                    '09:20': '09:30', '09:50': '10:00',
                    '10:20': '10:30', '10:50': '11:00',
                    '11:20': '11:30', '11:50AM': '12:00PM'}
    time_map = {'09:00AM': 1,  '09:30AM': 2,  '10:00AM': 3,  '10:30AM': 4, 
                '11:00AM': 5,  '11:30AM': 6,  '12:00PM': 7,  '12:30PM': 8, 
                '01:00PM': 9,  '01:30PM': 10, '02:00PM': 11, '02:30PM': 12,
                '03:00PM': 13, '03:30PM': 14, '04:00PM': 15, '04:30PM': 16, 
                '05:00PM': 17, '05:30PM': 18, '06:00PM': 19, '06:30PM': 20, 
                '07:00PM': 21, '07:30PM': 22, '08:00PM': 23, '08:30PM': 24,
                '09:00PM': 25, '09:30PM': 26, '10:00PM': 27, '10:30PM': 28,
                '11:00PM': 29, '11:30PM': 30}
    day, time = tuple(s.split(' ', 1))
    day_list = [int(char) for char in replace_dict(day, day_map)]
    time_str = replace_dict(replace_dict(time, time_replace), time_map)
    lower, upper = tuple(map(int, time_str.split(' - ')))
    time = [map(lambda x: x + 100 * d, range(lower, upper)) for d in day_list]
    return [tt for t in time for tt in t]

    
def parse_datetime(dt_dict):
    ''' input ~ {'L3 (1012)': some html raw text containing sessions}
    '''
    for k in dt_dict:
        dt_dict[k] = re.findall(r'\w+ [\d: -PM]{17}', dt_dict[k])
    dt, lec, tut, lab = {}, {}, {}, {}
    for k, v in dt_dict.iteritems():
        dt[k.split(' ')[0]] = reduce(add, map(map_time, v), [])
    for k, v in dt.iteritems():
        if 'LA' in k:
            lab[k] = v
        elif 'T' in k:
            tut[k] = v
        elif 'L' in k:
            lec[k] = v
    return {'lec': lec, 'tut': tut, 'lab': lab}
           

def parse_str(s):
    ''' output ~ {'code': 'PHYS 1112', 'title': 'General Physics I 
                   with Calculus', 'tut': {'T2D': [302, 303], 'T1A': 
                   [211, 212], 'T1C': [214, 215], 'T1B': [211, 212], 
                   'T1D': [214, 215], 'T2B': [508, 509], 'T2C': [302, 
                   303], 'T3C': [311, 312], 'T3B': [219, 220], 'T3A': 
                   [219, 220], 'T3D': [311, 312], 'T2A': [508, 509]}, 
                   'lab': {}, 'credit': 3.0, 'lec': {'L1': [201, 202,
                   203, 401, 402, 403], 'L3': [316, 317, 318, 516, 
                   517, 518], 'L2': [310, 311, 312, 510, 511, 512]}, 
                   'matching': 1}
    '''
    intro = re.search(r'(?<=<h2>)(?P<code>.*?) - (?P<title>.*) ' \
               + r'\((?P<credits>[\d+.]*\d+) unit[s]*\)(?=</h2>)', s)
    info = intro.groupdict()
    info['credits'] = float(info['credits'])
    info['title'] = info['title'].replace("'", ' ')
    if '<div class="matching">' in s:
        info['matching'] = 1
    else:
        info['matching'] = 0
    titles = re.findall(r'[\w ]{0,8}\(\d{4}\)', s)
    times = re.split(r'[\w ]{0,8}\(\d{4}\)', s)[1:]
    dt = dict(zip(titles, times))
    datetime = parse_datetime(dt)
    return dict(info.items() + datetime.items())


def parse_url(INDEX_URL):
    response = urllib2.urlopen(INDEX_URL)
    html = response.read()
    depts_match = re.search(r'(?<=<div class="depts">).*(?=</div>)', html)
    depts = re.findall(r'(?<=">)\w{4}(?=</a>)', depts_match.group())
    catalog = {}
    for dept in depts:
        print 'reading course titles', dept
        dept_url = INDEX_URL + 'subject/' + dept
        response = urllib2.urlopen(dept_url)
        html = response.read()
        data = html.split('<script type="text/javascript">')[1]
        courses = data.split('<div class="course">')[1:]
        for course in courses:
            info = parse_str(course)
            info = {info['code'][:4]: {info['code']: info}}
            for k, v in info.items():
                if k in catalog:
                    catalog[k].update(v)
                else:
                    catalog.update(info)
    return catalog


def is_match(s):
    ''' input ~ 'L1T1A' -> True or 'L1T2B' -> False
    '''
    nums = re.findall(r'\d+', s)
    return len(set(map(int, nums))) == 1


def get_sessions(course_info):
    sessions = {}
    c = course_info.copy()
    if not c['lec']:
        c['lec'] = {'': [-1]}
    if not c['tut']:
        c['tut'] = {'': [-1]}
    if not c['lab']:
        c['lab'] = {'': [-1]}
    for (lec, tut, lab) in product(c['lec'], c['tut'], c['lab']):
        key = ''.join([lec, tut, lab])
        val = sorted([e for e in c['lec'][lec] + c['tut'][tut] + c['lab'][lab]
               if e > 0])
        if len(val) == len(set(val)):
            sessions[key] = val
    if course_info['matching'] == 0:
        course_info.update({'sessions': sessions})
        return course_info
    else:
        s = {}
        for k, v in sessions.iteritems():
            if is_match(k):
                s[k] = v
        course_info.update({'sessions': s})
        return course_info
                    
            
def get_json(INDEX_URL):
    catalog = parse_url(INDEX_URL)
    for title in catalog:
        for course in catalog[title]:
            catalog[title][course] = get_sessions(catalog[title][course])
    return catalog


def save_json(catalog, outfile):
    with open(outfile, 'w') as f:
        json.dump(catalog, f, encoding='utf-8')


def load_json(infile):
    with open(infile, 'r') as f:
        return json.load(f, encoding='utf-8')


def json2js(infile, outfile):
    with open(infile, 'r') as inf:
        with open(outfile, 'w') as outf:
            s = inf.read()
            s = "var json_text = '" + s + \
                "';\nvar json_dict = JSON.parse(json_text);"
            outf.write(s)

            
catalog = get_json(INDEX)
save_json(catalog, 'new.json')
json2js('new.json', '../js/data.js')
