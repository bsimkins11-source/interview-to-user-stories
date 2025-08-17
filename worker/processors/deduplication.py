import re
from typing import List, Dict, Any, Tuple
from difflib import SequenceMatcher
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class DeduplicationEngine:
    """Deduplication engine using Jaccard similarity and semantic analysis"""
    
    def __init__(self, similarity_threshold: float = 0.7):
        self.similarity_threshold = similarity_threshold
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            max_features=1000
        )
    
    async def deduplicate_and_score(self, stories: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate stories and assign confidence scores"""
        if not stories:
            return []
        
        # Clean and normalize stories
        cleaned_stories = self._clean_stories(stories)
        
        # Find duplicates
        duplicate_groups = self._find_duplicates(cleaned_stories)
        
        # Merge duplicates
        merged_stories = self._merge_duplicates(cleaned_stories, duplicate_groups)
        
        # Calculate final scores
        scored_stories = self._calculate_final_scores(merged_stories)
        
        # Sort by score
        scored_stories.sort(key=lambda x: x.get('Match Score', 0), reverse=True)
        
        return scored_stories
    
    def _clean_stories(self, stories: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean and normalize story text"""
        cleaned = []
        
        for story in stories:
            cleaned_story = story.copy()
            
            # Clean user story text
            if 'User Story' in cleaned_story:
                cleaned_story['clean_text'] = self._normalize_text(cleaned_story['User Story'])
            
            # Clean capability text
            if 'Capability' in cleaned_story:
                cleaned_story['clean_capability'] = self._normalize_text(cleaned_story['Capability'])
            
            # Clean snippet text
            if 'Snippet' in cleaned_story:
                cleaned_story['clean_snippet'] = self._normalize_text(cleaned_story['Snippet'])
            
            cleaned.append(cleaned_story)
        
        return cleaned
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for comparison"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove punctuation
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove common filler words
        filler_words = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
        words = text.split()
        words = [word for word in words if word not in filler_words]
        
        return ' '.join(words)
    
    def _find_duplicates(self, stories: List[Dict[str, Any]]) -> List[List[int]]:
        """Find groups of duplicate stories"""
        duplicate_groups = []
        processed = set()
        
        for i, story in enumerate(stories):
            if i in processed:
                continue
            
            current_group = [i]
            processed.add(i)
            
            for j, other_story in enumerate(stories[i+1:], i+1):
                if j in processed:
                    continue
                
                if self._are_stories_similar(story, other_story):
                    current_group.append(j)
                    processed.add(j)
            
            if len(current_group) > 1:
                duplicate_groups.append(current_group)
        
        return duplicate_groups
    
    def _are_stories_similar(self, story1: Dict[str, Any], story2: Dict[str, Any]) -> bool:
        """Check if two stories are similar"""
        # Calculate multiple similarity scores
        text_similarity = self._calculate_text_similarity(story1, story2)
        capability_similarity = self._calculate_capability_similarity(story1, story2)
        semantic_similarity = self._calculate_semantic_similarity(story1, story2)
        
        # Weighted average of similarities
        weighted_similarity = (
            text_similarity * 0.4 +
            capability_similarity * 0.4 +
            semantic_similarity * 0.2
        )
        
        return weighted_similarity >= self.similarity_threshold
    
    def _calculate_text_similarity(self, story1: Dict[str, Any], story2: Dict[str, Any]) -> float:
        """Calculate text similarity using Jaccard distance"""
        text1 = story1.get('clean_text', '')
        text2 = story2.get('clean_text', '')
        
        if not text1 or not text2:
            return 0.0
        
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    def _calculate_capability_similarity(self, story1: Dict[str, Any], story2: Dict[str, Any]) -> float:
        """Calculate capability similarity"""
        cap1 = story1.get('clean_capability', '')
        cap2 = story2.get('clean_capability', '')
        
        if not cap1 or not cap2:
            return 0.0
        
        return SequenceMatcher(None, cap1, cap2).ratio()
    
    def _calculate_semantic_similarity(self, story1: Dict[str, Any], story2: Dict[str, Any]) -> float:
        """Calculate semantic similarity using TF-IDF and cosine similarity"""
        try:
            # Combine relevant text fields
            text1 = f"{story1.get('clean_text', '')} {story1.get('clean_capability', '')}"
            text2 = f"{story2.get('clean_text', '')} {story2.get('clean_capability', '')}"
            
            if not text1.strip() or not text2.strip():
                return 0.0
            
            # Vectorize texts
            texts = [text1, text2]
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            
            # Calculate cosine similarity
            similarity_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            
            return float(similarity_matrix[0][0])
        except Exception as e:
            print(f"Error calculating semantic similarity: {str(e)}")
            return 0.0
    
    def _merge_duplicates(self, stories: List[Dict[str, Any]], duplicate_groups: List[List[int]]) -> List[Dict[str, Any]]:
        """Merge duplicate stories into single, enhanced stories"""
        merged_stories = []
        merged_indices = set()
        
        # Process duplicate groups
        for group in duplicate_groups:
            if len(group) == 1:
                continue
            
            # Merge stories in the group
            merged_story = self._merge_story_group([stories[i] for i in group])
            merged_stories.append(merged_story)
            
            # Mark indices as merged
            merged_indices.update(group)
        
        # Add non-duplicate stories
        for i, story in enumerate(stories):
            if i not in merged_indices:
                merged_stories.append(story)
        
        return merged_stories
    
    def _merge_story_group(self, story_group: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Merge a group of duplicate stories"""
        if not story_group:
            return {}
        
        # Use the first story as base
        merged = story_group[0].copy()
        
        # Merge text fields
        merged['User Story'] = self._merge_text_fields([s.get('User Story', '') for s in story_group])
        merged['Capability'] = self._merge_text_fields([s.get('Capability', '') for s in story_group])
        merged['Snippet'] = self._merge_text_fields([s.get('Snippet', '') for s in story_group])
        
        # Merge tags
        all_tags = []
        for story in story_group:
            if 'Tags' in story:
                all_tags.extend(story['Tags'])
        merged['Tags'] = list(set(all_tags))  # Remove duplicates
        
        # Merge requirements and acceptance criteria
        all_requirements = []
        all_criteria = []
        for story in story_group:
            if 'requirements' in story:
                all_requirements.extend(story['requirements'])
            if 'acceptance_criteria' in story:
                all_criteria.extend(story['acceptance_criteria'])
        
        merged['requirements'] = list(set(all_requirements))
        merged['acceptance_criteria'] = list(set(all_criteria))
        
        # Update source information
        merged['source_files'] = [s.get('Source', '') for s in story_group if s.get('Source')]
        merged['duplicate_count'] = len(story_group)
        
        # Calculate average confidence
        confidences = [s.get('Match Score', 0.5) for s in story_group]
        merged['Match Score'] = sum(confidences) / len(confidences)
        
        return merged
    
    def _merge_text_fields(self, texts: List[str]) -> str:
        """Merge multiple text fields intelligently"""
        if not texts:
            return ""
        
        # Remove empty texts
        texts = [t for t in texts if t and t.strip()]
        
        if not texts:
            return ""
        
        if len(texts) == 1:
            return texts[0]
        
        # Find the longest, most complete text
        longest_text = max(texts, key=len)
        
        # Add unique information from other texts
        merged_text = longest_text
        
        for text in texts:
            if text != longest_text:
                # Add unique sentences
                sentences = text.split('.')
                for sentence in sentences:
                    sentence = sentence.strip()
                    if sentence and sentence not in merged_text:
                        merged_text += f". {sentence}"
        
        return merged_text
    
    def _calculate_final_scores(self, stories: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate final confidence scores for stories"""
        scored_stories = []
        
        for story in stories:
            scored_story = story.copy()
            
            # Base score from extraction
            base_score = story.get('Match Score', 0.5)
            
            # Quality adjustments
            quality_score = self._calculate_quality_score(story)
            
            # Completeness adjustments
            completeness_score = self._calculate_completeness_score(story)
            
            # Final weighted score
            final_score = (
                base_score * 0.5 +
                quality_score * 0.3 +
                completeness_score * 0.2
            )
            
            scored_story['Match Score'] = round(final_score, 3)
            scored_stories.append(scored_story)
        
        return scored_stories
    
    def _calculate_quality_score(self, story: Dict[str, Any]) -> float:
        """Calculate quality score based on story characteristics"""
        score = 0.5  # Base score
        
        # Check for proper user story format
        user_story = story.get('User Story', '')
        if 'as a' in user_story.lower() and 'i need' in user_story.lower() and 'so that' in user_story.lower():
            score += 0.2
        
        # Check for detailed capability
        capability = story.get('Capability', '')
        if len(capability) > 20:
            score += 0.1
        
        # Check for clear benefit
        benefit_match = re.search(r'so that (.+)', user_story.lower())
        if benefit_match and len(benefit_match.group(1)) > 10:
            score += 0.1
        
        # Check for tags
        if story.get('Tags') and len(story['Tags']) > 1:
            score += 0.1
        
        return min(score, 1.0)
    
    def _calculate_completeness_score(self, story: Dict[str, Any]) -> float:
        """Calculate completeness score"""
        score = 0.5  # Base score
        
        # Check required fields
        required_fields = ['User Story', 'Capability', 'Category', 'Priority']
        for field in required_fields:
            if story.get(field):
                score += 0.1
        
        # Check optional fields
        optional_fields = ['Snippet', 'Tags', 'requirements', 'acceptance_criteria']
        for field in optional_fields:
            if story.get(field):
                score += 0.05
        
        return min(score, 1.0)
    
    def get_deduplication_summary(self, original_count: int, final_count: int, duplicate_groups: List[List[int]]) -> Dict[str, Any]:
        """Generate deduplication summary"""
        total_duplicates = sum(len(group) - 1 for group in duplicate_groups)
        
        return {
            'original_stories': original_count,
            'final_stories': final_count,
            'duplicates_removed': total_duplicates,
            'duplicate_groups': len(duplicate_groups),
            'reduction_percentage': round((total_duplicates / original_count) * 100, 2) if original_count > 0 else 0,
            'status': 'deduplication_completed'
        }
