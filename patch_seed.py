seed_route = """
@api.route('/admin/seed-courses', methods=['POST', 'GET'])
def seed_courses():
    try:
        from app.models.course import Course
        from app.models.user import User
        from app import db
        import json
        
        # Check if we already have more than 1 course to avoid duplicates
        if Course.query.count() > 2:
            return jsonify({'message': 'Courses already seeded!'})
            
        instructor = User.query.filter_by(role='instructor').first()
        if not instructor:
            instructor_id = 1
        else:
            instructor_id = instructor.id
            
        HARDCODED_COURSES = [
            {'title': 'Carnatic Classical Singing', 'category': 'Culture', 'level': 'Beginner & Intermediate', 'duration': 'Flexible', 'summary': 'Individual mentoring · Open for all age groups', 'description': 'Learn the foundations and finer techniques of Carnatic classical vocal music through one-on-one mentoring, progressing from beginner to intermediate levels at your own pace.', 'lessons': ['Swara & Sruti fundamentals', 'Varnams', 'Geethams', 'Kritis — beginner ragas', 'Kritis — intermediate ragas', 'Manodharma basics']},
            {'title': 'Pattachitra Painting', 'category': 'Culture', 'level': 'Beginner & Intermediate', 'duration': 'Flexible', 'summary': 'Group mentoring · Minimum age 9 years', 'description': 'Explore the traditional Odia scroll-painting art form of Pattachitra in a group setting, covering natural pigments, motifs, and mythological storytelling through art.', 'lessons': ['Materials & natural pigments', 'Line work & borders', 'Traditional motifs', 'Mythological compositions', 'Intermediate scroll work']},
            {'title': 'Drawing Class', 'category': 'Culture', 'level': 'Basics to Advanced', 'duration': 'Flexible', 'summary': 'Comprehensive course including exam preparation', 'description': 'A comprehensive drawing course covering everything from the basics to advanced technique, including structured preparation for elementary and intermediate drawing examinations.', 'lessons': ['Basic strokes & shading', 'Geometrical & object drawing', 'Memory drawing', 'Nature drawing', 'Elementary exam prep', 'Intermediate exam prep']},
            {'title': 'Kathak Dance', 'category': 'Culture', 'level': 'Beginner', 'duration': 'Flexible', 'summary': 'Open for all age groups', 'description': 'An introduction to Kathak, the classical dance form of North India, covering footwork, hand gestures, expressions, and foundational compositions.', 'lessons': ['Basic stance & footwork (Tatkar)', 'Hastak & hand gestures', 'Chakkars', 'Simple compositions', 'Abhinaya basics']},
            {'title': 'Bharatiya Ganitam: Lilavati', 'category': 'Wisdom', 'level': 'All levels', 'duration': 'Flexible', 'summary': 'Mathematical concepts from Bhaskaracharya Lilavati grantha', 'description': 'Part of the Bharatiya Ganitam series, this course teaches classical Indian mathematical concepts drawn directly from Bhaskaracharya Lilavati grantha.', 'lessons': ['Introduction to Lilavati', 'Number systems & operations', 'Arithmetic problems in verse', 'Geometry from Lilavati', 'Applied problem solving']},
            {'title': 'Hindustani Classical Singing', 'category': 'Culture', 'level': 'All levels', 'duration': 'Flexible', 'summary': 'Structured vocal training in the Hindustani tradition', 'description': 'Structured training in Hindustani classical vocal music, covering ragas, taals, and the discipline of riyaz.', 'lessons': ['Swara & alankar', 'Introduction to raga', 'Taal & laya', 'Khyal basics', 'Bandish practice']},
            {'title': 'Bansuri Classes', 'category': 'Culture', 'level': 'All levels', 'duration': 'Flexible', 'summary': 'Learn the Indian bamboo flute', 'description': 'Learn to play the Bansuri, the traditional Indian bamboo flute, from basic breath control and fingering to melodic phrases.', 'lessons': ['Holding & breath control', 'Basic fingering', 'Sur sadhana', 'Simple melodies', 'Raga-based phrases']},
            {'title': 'Casio Classes', 'category': 'Culture', 'level': 'All levels', 'duration': 'Flexible', 'summary': 'Keyboard (Casio) lessons for beginners onward', 'description': 'Learn to play the keyboard (Casio), covering note reading, hand coordination, and playing popular and classical pieces.', 'lessons': ['Keyboard basics & posture', 'Note reading', 'Scales & chords', 'Simple songs', 'Two-hand coordination']}
        ]
        
        added = 0
        for c in HARDCODED_COURSES:
            if Course.query.filter_by(title=c['title']).first():
                continue
                
            course = Course(
                title=c['title'],
                category=c.get('category', 'Culture'),
                level=c.get('level', 'Foundation'),
                duration=c.get('duration', 'Flexible'),
                summary=c.get('summary', ''),
                description=c.get('description', ''),
                lessons=json.dumps(c.get('lessons', [])),
                accent='indigo',
                instructor_id=instructor_id,
                status='approved'
            )
            db.session.add(course)
            added += 1
            
        db.session.commit()
        return jsonify({'message': f'Successfully seeded {added} courses!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
"""

with open('backend/app/routes.py', 'r', encoding='utf-8') as f:
    routes = f.read()

# Insert at the end
routes += '\n' + seed_route

with open('backend/app/routes.py', 'w', encoding='utf-8') as f:
    f.write(routes)
print('Success!')
