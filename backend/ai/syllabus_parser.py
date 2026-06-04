import re
import pdfplumber
from datetime import datetime, timedelta
from collections import defaultdict


class SyllabusParser:
    def __init__(self):
        try:
            import spacy
            self.nlp = spacy.load('en_core_web_sm')
        except (ImportError, OSError):
            self.nlp = None

        self.date_patterns = [
            r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})',
            r'(\w+ \d{1,2},? \d{4})',
            r'(\d{1,2} \w+ \d{4})',
            r'Week \d+[:-]\s*(.+)',
        ]

        self.exam_keywords = [
            'exam', 'midterm', 'final', 'test', 'quiz', 'assessment',
            'evaluation', 'viva', 'practical', 'lab', 'assignment'
        ]

        self.topic_keywords = [
            'chapter', 'unit', 'module', 'topic', 'lesson', 'section',
            'part', 'syllabus', 'coverage', 'contents'
        ]

    def parse(self, file_path):
        text = self._extract_text(file_path)

        result = {
            'raw_text': text[:5000],
            'exams': self._extract_exams(text),
            'topics': self._extract_topics(text),
            'schedule': self._extract_schedule(text),
            'chapters': self._extract_chapters(text),
            'weightage': self._extract_weightage(text),
        }

        return result

    def _extract_text(self, file_path):
        text = ''
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + '\n'
        except Exception as e:
            text = f"Error extracting text: {str(e)}"
        return text

    def _extract_exams(self, text):
        exams = []
        lines = text.split('\n')

        for i, line in enumerate(lines):
            line_lower = line.lower()
            for keyword in self.exam_keywords:
                if keyword in line_lower:
                    exam_info = {
                        'title': line.strip(),
                        'type': self._classify_exam_type(keyword),
                        'context': ' '.join(lines[max(0, i-2):i+3]).strip(),
                    }

                    date_match = self._find_date(line + ' ' + lines[i+1] if i+1 < len(lines) else line)
                    if date_match:
                        exam_info['date'] = date_match

                    marks_match = re.search(r'(\d+)\s*(?:marks?|points?|total)', line_lower)
                    if marks_match:
                        exam_info['total_marks'] = int(marks_match.group(1))

                    exams.append(exam_info)
                    break

        return exams

    def _extract_topics(self, text):
        topics = []
        lines = text.split('\n')

        for i, line in enumerate(lines):
            line_lower = line.lower()
            for keyword in self.topic_keywords:
                if keyword in line_lower:
                    topic_info = {
                        'title': line.strip(),
                        'context': ' '.join(lines[i:min(i+5, len(lines))]).strip(),
                    }

                    chapter_match = re.search(r'(?:chapter|unit|module)\s*(\d+)', line_lower)
                    if chapter_match:
                        topic_info['number'] = int(chapter_match.group(1))

                    topics.append(topic_info)
                    break

        return topics

    def _extract_chapters(self, text):
        chapters = []
        chapter_pattern = re.compile(
            r'(?:chapter|unit|module|part)\s*(\d+)[\s:.-]+(.+?)(?:\n|$)',
            re.IGNORECASE
        )

        for match in chapter_pattern.finditer(text):
            chapters.append({
                'number': int(match.group(1)),
                'title': match.group(2).strip(),
            })

        return sorted(chapters, key=lambda x: x['number'])

    def _extract_schedule(self, text):
        schedule = []
        week_pattern = re.compile(
            r'week\s*(\d+)[\s:-]+(.+?)(?:\n|$)',
            re.IGNORECASE
        )

        for match in week_pattern.finditer(text):
            schedule.append({
                'week': int(match.group(1)),
                'topics': match.group(2).strip(),
            })

        return schedule

    def _extract_weightage(self, text):
        weightage = []
        weight_pattern = re.compile(
            r'(.+?)(?:\s*[-:]\s*)?(\d+)%',
            re.IGNORECASE
        )

        for match in weight_pattern.finditer(text):
            title = match.group(1).strip()
            if any(kw in title.lower() for kw in self.exam_keywords + self.topic_keywords):
                weightage.append({
                    'topic': title,
                    'percentage': int(match.group(2)),
                })

        return weightage

    def _find_date(self, text):
        for pattern in self.date_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        return None

    def _classify_exam_type(self, keyword):
        type_map = {
            'midterm': 'midterm',
            'final': 'final',
            'quiz': 'quiz',
            'test': 'quiz',
            'exam': 'midterm',
            'viva': 'viva',
            'practical': 'practical',
            'lab': 'practical',
            'assignment': 'assignment',
            'assessment': 'midterm',
            'evaluation': 'midterm',
        }
        return type_map.get(keyword, 'quiz')

    def analyze_difficulty(self, topics):
        if not self.nlp:
            return [{'topic': t, 'difficulty': 'medium'} for t in topics]

        results = []
        difficult_indicators = ['advanced', 'complex', 'difficult', 'hard', 'challenging']
        easy_indicators = ['basic', 'introduction', 'introductory', 'simple', 'fundamental']

        for topic in topics:
            doc = self.nlp(topic.lower())
            difficulty = 'medium'

            for token in doc:
                if token.text in difficult_indicators:
                    difficulty = 'hard'
                    break
                elif token.text in easy_indicators:
                    difficulty = 'easy'
                    break

            results.append({
                'topic': topic,
                'difficulty': difficulty,
            })

        return results
