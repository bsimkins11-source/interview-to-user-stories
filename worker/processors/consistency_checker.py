import hashlib
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

class ConsistencyChecker:
    """Ensures deterministic and consistent processing of interview transcripts"""
    
    def __init__(self, cache_dir: str = "consistency_cache"):
        self.cache_dir = cache_dir
        self.ensure_cache_dir()
        
    def ensure_cache_dir(self):
        """Create cache directory if it doesn't exist"""
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir)
    
    def generate_input_hash(self, documents: List[Dict[str, Any]], construct: Dict[str, Any]) -> str:
        """Generate a deterministic hash of the input data"""
        # Sort documents by filename for consistent hashing
        sorted_docs = sorted(documents, key=lambda x: x['filename'])
        
        # Create a deterministic representation of the input
        input_data = {
            'construct': construct,
            'documents': [
                {
                    'filename': doc['filename'],
                    'file_type': doc['file_type'],
                    'content_hash': hashlib.md5(doc['content']).hexdigest(),
                    'size': len(doc['content'])
                }
                for doc in sorted_docs
            ]
        }
        
        # Convert to sorted JSON string for consistent hashing
        input_string = json.dumps(input_data, sort_keys=True, separators=(',', ':'))
        return hashlib.md5(input_string.encode()).hexdigest()
    
    def check_consistency(self, input_hash: str, output_stories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Check if the current output matches previous runs with the same input"""
        cache_file = os.path.join(self.cache_dir, f"{input_hash}.json")
        
        if os.path.exists(cache_file):
            # Load previous output
            with open(cache_file, 'r') as f:
                cached_data = json.load(f)
            
            # Generate hash of current output
            current_output_hash = self._generate_output_hash(output_stories)
            
            # Compare with cached output
            if cached_data['output_hash'] == current_output_hash:
                return {
                    'is_consistent': True,
                    'message': 'Output matches previous run exactly',
                    'previous_run': cached_data['timestamp'],
                    'consistency_score': 1.0,
                    'cached_hash': cached_data['output_hash'],
                    'current_hash': current_output_hash
                }
            else:
                # Calculate consistency score
                consistency_score = self._calculate_consistency_score(
                    cached_data['stories'], 
                    output_stories
                )
                
                return {
                    'is_consistent': False,
                    'message': 'Output differs from previous run',
                    'previous_run': cached_data['timestamp'],
                    'consistency_score': consistency_score,
                    'cached_hash': cached_data['output_hash'],
                    'current_hash': current_output_hash,
                    'differences': self._identify_differences(
                        cached_data['stories'], 
                        output_stories
                    )
                }
        else:
            # First run with this input
            return {
                'is_consistent': True,
                'message': 'First run with this input - no previous data to compare',
                'consistency_score': 1.0,
                'current_hash': self._generate_output_hash(output_stories)
            }
    
    def cache_output(self, input_hash: str, output_stories: List[Dict[str, Any]], metadata: Dict[str, Any] = None):
        """Cache the output for future consistency checking"""
        cache_file = os.path.join(self.cache_dir, f"{input_hash}.json")
        
        cache_data = {
            'timestamp': datetime.now().isoformat(),
            'output_hash': self._generate_output_hash(output_stories),
            'stories': output_stories,
            'metadata': metadata or {},
            'story_count': len(output_stories)
        }
        
        with open(cache_file, 'w') as f:
            json.dump(cache_data, f, indent=2, sort_keys=True)
    
    def _generate_output_hash(self, stories: List[Dict[str, Any]]) -> str:
        """Generate a deterministic hash of the output stories"""
        # Sort stories by ID for consistent hashing
        sorted_stories = sorted(stories, key=lambda x: x.get('User Story ID', ''))
        
        # Create a deterministic representation
        story_data = []
        for story in sorted_stories:
            story_data.append({
                'id': story.get('User Story ID', ''),
                'story': story.get('User Story', ''),
                'category': story.get('Category', ''),
                'priority': story.get('Priority', ''),
                'score': story.get('Match Score', 0.0),
                'tags': sorted(story.get('Tags', [])),
                'content_hash': story.get('Content Hash', '')
            })
        
        # Convert to sorted JSON string
        output_string = json.dumps(story_data, sort_keys=True, separators=(',', ':'))
        return hashlib.md5(output_string.encode()).hexdigest()
    
    def _calculate_consistency_score(self, cached_stories: List[Dict[str, Any]], current_stories: List[Dict[str, Any]]) -> float:
        """Calculate a consistency score between cached and current outputs"""
        if not cached_stories or not current_stories:
            return 0.0
        
        # Create sets of story IDs
        cached_ids = {story.get('User Story ID', '') for story in cached_stories}
        current_ids = {story.get('User Story ID', '') for story in current_stories}
        
        # Calculate overlap
        common_ids = cached_ids.intersection(current_ids)
        total_ids = cached_ids.union(current_ids)
        
        if not total_ids:
            return 0.0
        
        # Base score from ID overlap
        id_score = len(common_ids) / len(total_ids)
        
        # Calculate content similarity for common stories
        content_similarity = 0.0
        if common_ids:
            similarities = []
            for story_id in common_ids:
                cached_story = next((s for s in cached_stories if s.get('User Story ID') == story_id), None)
                current_story = next((s for s in current_stories if s.get('User Story ID') == story_id), None)
                
                if cached_story and current_story:
                    similarity = self._calculate_story_similarity(cached_story, current_story)
                    similarities.append(similarity)
            
            if similarities:
                content_similarity = sum(similarities) / len(similarities)
        
        # Weighted final score
        final_score = (id_score * 0.6) + (content_similarity * 0.4)
        return round(final_score, 3)
    
    def _calculate_story_similarity(self, story1: Dict[str, Any], story2: Dict[str, Any]) -> float:
        """Calculate similarity between two stories"""
        # Compare key fields
        fields_to_compare = ['User Story', 'Category', 'Priority', 'Match Score']
        
        similarities = []
        for field in fields_to_compare:
            val1 = story1.get(field, '')
            val2 = story2.get(field, '')
            
            if val1 == val2:
                similarities.append(1.0)
            elif isinstance(val1, (int, float)) and isinstance(val2, (int, float)):
                # Numeric similarity
                if val1 == 0 and val2 == 0:
                    similarities.append(1.0)
                else:
                    max_val = max(abs(val1), abs(val2))
                    if max_val == 0:
                        similarities.append(1.0)
                    else:
                        diff = abs(val1 - val2)
                        similarities.append(max(0, 1 - (diff / max_val)))
            else:
                # Text similarity using simple ratio
                if val1 and val2:
                    similarity = self._text_similarity(str(val1), str(val2))
                    similarities.append(similarity)
                else:
                    similarities.append(0.0)
        
        return sum(similarities) / len(similarities) if similarities else 0.0
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity using character-level comparison"""
        if not text1 or not text2:
            return 0.0
        
        # Convert to lowercase for comparison
        text1_lower = text1.lower()
        text2_lower = text2.lower()
        
        if text1_lower == text2_lower:
            return 1.0
        
        # Calculate character-level similarity
        len1, len2 = len(text1_lower), len(text2_lower)
        max_len = max(len1, len2)
        
        if max_len == 0:
            return 1.0
        
        # Count matching characters
        matches = 0
        for i in range(min(len1, len2)):
            if text1_lower[i] == text2_lower[i]:
                matches += 1
        
        return matches / max_len
    
    def _identify_differences(self, cached_stories: List[Dict[str, Any]], current_stories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Identify specific differences between cached and current outputs"""
        cached_ids = {story.get('User Story ID', '') for story in cached_stories}
        current_ids = {story.get('User Story ID', '') for story in current_stories}
        
        added_ids = current_ids - cached_ids
        removed_ids = cached_ids - current_ids
        common_ids = cached_ids.intersection(current_ids)
        
        differences = {
            'added_stories': len(added_ids),
            'removed_stories': len(removed_ids),
            'common_stories': len(common_ids),
            'total_changes': len(added_ids) + len(removed_ids)
        }
        
        # Identify stories with significant changes
        changed_stories = []
        for story_id in common_ids:
            cached_story = next((s for s in cached_stories if s.get('User Story ID') == story_id), None)
            current_story = next((s for s in current_stories if s.get('User Story ID') == story_id), None)
            
            if cached_story and current_story:
                similarity = self._calculate_story_similarity(cached_story, current_story)
                if similarity < 0.9:  # Significant change threshold
                    changed_stories.append({
                        'story_id': story_id,
                        'similarity': similarity,
                        'cached': cached_story,
                        'current': current_story
                    })
        
        differences['changed_stories'] = changed_stories
        differences['change_details'] = {
            'added': list(added_ids),
            'removed': list(removed_ids),
            'significantly_changed': len(changed_stories)
        }
        
        return differences
    
    def get_consistency_report(self, input_hash: str, output_stories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a comprehensive consistency report"""
        consistency_result = self.check_consistency(input_hash, output_stories)
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'input_hash': input_hash,
            'consistency_check': consistency_result,
            'output_summary': {
                'total_stories': len(output_stories),
                'categories': {},
                'priorities': {},
                'score_distribution': {
                    'high': len([s for s in output_stories if s.get('Match Score', 0) >= 0.8]),
                    'medium': len([s for s in output_stories if 0.5 <= s.get('Match Score', 0) < 0.8]),
                    'low': len([s for s in output_stories if s.get('Match Score', 0) < 0.5])
                }
            },
            'recommendations': []
        }
        
        # Add category and priority distributions
        for story in output_stories:
            category = story.get('Category', 'Unknown')
            priority = story.get('Priority', 'Unknown')
            
            report['output_summary']['categories'][category] = report['output_summary']['categories'].get(category, 0) + 1
            report['output_summary']['priorities'][priority] = report['output_summary']['priorities'].get(priority, 0) + 1
        
        # Add recommendations based on consistency results
        if not consistency_result['is_consistent']:
            if consistency_result['consistency_score'] < 0.5:
                report['recommendations'].append("CRITICAL: Significant inconsistency detected. Review processing pipeline.")
            elif consistency_result['consistency_score'] < 0.8:
                report['recommendations'].append("WARNING: Moderate inconsistency detected. Check for recent changes.")
            else:
                report['recommendations'].append("INFO: Minor inconsistencies detected. Output is generally consistent.")
        else:
            report['recommendations'].append("SUCCESS: Output is fully consistent with previous runs.")
        
        # Cache the output for future comparisons
        self.cache_output(input_hash, output_stories, {'consistency_report': report})
        
        return report
    
    def cleanup_old_cache(self, max_age_days: int = 30):
        """Clean up old cache files to prevent disk space issues"""
        current_time = datetime.now()
        
        for filename in os.listdir(self.cache_dir):
            if filename.endswith('.json'):
                file_path = os.path.join(self.cache_dir, filename)
                file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                
                if (current_time - file_time).days > max_age_days:
                    os.remove(file_path)
                    print(f"Removed old cache file: {filename}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get statistics about the consistency cache"""
        cache_files = [f for f in os.listdir(self.cache_dir) if f.endswith('.json')]
        
        total_size = 0
        oldest_file = None
        newest_file = None
        
        for filename in cache_files:
            file_path = os.path.join(self.cache_dir, filename)
            file_size = os.path.getsize(file_path)
            file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
            
            total_size += file_size
            
            if oldest_file is None or file_time < oldest_file:
                oldest_file = file_time
            
            if newest_file is None or file_time > newest_file:
                newest_file = file_time
        
        return {
            'total_cache_files': len(cache_files),
            'total_cache_size_bytes': total_size,
            'total_cache_size_mb': round(total_size / (1024 * 1024), 2),
            'oldest_cache_entry': oldest_file.isoformat() if oldest_file else None,
            'newest_cache_entry': newest_file.isoformat() if newest_file else None,
            'cache_directory': self.cache_dir
        }
