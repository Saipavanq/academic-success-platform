from collections import Counter
import re

try:
    from transformers import pipeline
    HAS_TRANSFORMERS = True
except ImportError:
    pipeline = None
    HAS_TRANSFORMERS = False


class TopicClassifier:
    def __init__(self):
        self.classifier = None
        self._load_model()

    def _load_model(self):
        if not HAS_TRANSFORMERS:
            self.classifier = None
            return
        try:
            self.classifier = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli"
            )
        except Exception:
            self.classifier = None

    def classify_topics(self, topics, categories=None):
        if not self.classifier or not topics:
            return self._fallback_classify(topics, categories)

        if categories is None:
            categories = [
                'theoretical', 'practical', 'mathematical',
                'conceptual', 'applied', 'analytical'
            ]

        results = []
        for topic in topics:
            try:
                result = self.classifier(
                    topic,
                    categories,
                    multi_label=False
                )
                results.append({
                    'topic': topic,
                    'category': result['labels'][0],
                    'confidence': round(result['scores'][0], 3),
                })
            except Exception:
                results.append({
                    'topic': topic,
                    'category': 'conceptual',
                    'confidence': 0.5,
                })

        return results

    def _fallback_classify(self, topics, categories):
        keyword_map = {
            'theoretical': ['theory', 'concept', 'principle', 'law', 'theorem'],
            'practical': ['lab', 'practical', 'experiment', 'implementation'],
            'mathematical': ['equation', 'formula', 'calculation', 'proof', 'math'],
            'conceptual': ['introduction', 'overview', 'basic', 'fundamental'],
            'applied': ['application', 'real-world', 'case study', 'example'],
            'analytical': ['analysis', 'compare', 'evaluate', 'critique'],
        }

        results = []
        for topic in topics:
            topic_lower = topic.lower()
            scores = {}

            for category, keywords in keyword_map.items():
                score = sum(1 for kw in keywords if kw in topic_lower)
                scores[category] = score

            best_category = max(scores, key=scores.get) if any(scores.values()) else 'conceptual'
            confidence = 0.6 if scores[best_category] > 0 else 0.4

            results.append({
                'topic': topic,
                'category': best_category,
                'confidence': confidence,
            })

        return results

    def suggest_study_methods(self, topic_category):
        methods = {
            'theoretical': [
                'Read textbook chapters',
                'Create concept maps',
                'Write summary notes',
                'Discuss with peers'
            ],
            'practical': [
                'Practice problems',
                'Hands-on exercises',
                'Lab experiments',
                'Project work'
            ],
            'mathematical': [
                'Solve practice problems',
                'Derive formulas',
                'Work through examples',
                'Create formula sheet'
            ],
            'conceptual': [
                'Watch video lectures',
                'Create flashcards',
                'Teach someone else',
                'Draw diagrams'
            ],
            'applied': [
                'Case study analysis',
                'Real-world examples',
                'Build projects',
                'Industry research'
            ],
            'analytical': [
                'Compare and contrast',
                'Create analysis charts',
                'Write critical essays',
                'Debate topics'
            ],
        }
        return methods.get(topic_category, ['General study'])
