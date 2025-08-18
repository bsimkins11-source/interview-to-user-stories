import os
import re
from typing import List, Dict, Any
import docx
import PyPDF2
import markdown
from io import BytesIO

class DocumentProcessor:
    """Processes different document formats and extracts structured text"""
    
    def __init__(self):
        self.supported_formats = ['.txt', '.docx', '.md', '.pdf']
    
    async def process_documents(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process multiple documents and return normalized text"""
        processed_docs = []
        
        for doc in documents:
            try:
                # The content is already extracted as text from the storage service
                content = doc.get('content', '')
                file_type = doc.get('file_type', 'txt')
                
                if content:
                    processed_docs.append({
                        'filename': doc['filename'],
                        'file_type': file_type,
                        'content': content,
                        'paragraphs': self._extract_paragraphs(content),
                        'speaker_labels': self._extract_speaker_labels(content),
                        'workflow_analysis': self._identify_workflow_content(content)
                    })
            except Exception as e:
                print(f"Error processing {doc['filename']}: {str(e)}")
                continue
        
        return processed_docs
    
    async def _process_single_document(self, doc: Dict[str, Any]) -> str:
        """Process a single document based on its file type"""
        content = doc['content']
        file_type = doc['file_type'].lower()
        
        if file_type == '.txt':
            return self._process_txt(content)
        elif file_type == '.docx':
            return self._process_docx(content)
        elif file_type == '.md':
            return self._process_markdown(content)
        elif file_type == '.pdf':
            return self._process_pdf(content)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    def _process_txt(self, content: bytes) -> str:
        """Process plain text files"""
        try:
            # Try different encodings
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    return content.decode(encoding)
                except UnicodeDecodeError:
                    continue
            # Fallback to utf-8 with errors='ignore'
            return content.decode('utf-8', errors='ignore')
        except Exception as e:
            print(f"Error processing TXT file: {str(e)}")
            return ""
    
    def _process_docx(self, content: bytes) -> str:
        """Process Word documents"""
        try:
            doc = docx.Document(BytesIO(content))
            text_parts = []
            
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text)
            
            return '\n\n'.join(text_parts)
        except Exception as e:
            print(f"Error processing DOCX file: {str(e)}")
            return ""
    
    def _process_markdown(self, content: bytes) -> str:
        """Process Markdown files"""
        try:
            text = content.decode('utf-8')
            # Convert markdown to plain text
            html = markdown.markdown(text)
            # Remove HTML tags
            clean_text = re.sub(r'<[^>]+>', '', html)
            return clean_text
        except Exception as e:
            print(f"Error processing Markdown file: {str(e)}")
            return ""
    
    def _process_pdf(self, content: bytes) -> str:
        """Process PDF files"""
        try:
            pdf_file = BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text_parts = []
            
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text.strip():
                    text_parts.append(text)
            
            return '\n\n'.join(text_parts)
        except Exception as e:
            print(f"Error processing PDF file: {str(e)}")
            return ""
    
    def _extract_paragraphs(self, text: str) -> List[str]:
        """Extract paragraphs from processed text"""
        # Split by double newlines or common paragraph separators
        paragraphs = re.split(r'\n\s*\n', text)
        # Clean and filter paragraphs
        cleaned_paragraphs = []
        for para in paragraphs:
            para = para.strip()
            if para and len(para) > 10:  # Filter out very short paragraphs
                cleaned_paragraphs.append(para)
        return cleaned_paragraphs
    
    def _extract_speaker_labels(self, text: str) -> List[Dict[str, str]]:
        """Extract speaker labels and their content"""
        speaker_patterns = [
            r'^([A-Z][a-z]+):\s*(.+)$',  # Speaker: content
            r'^([A-Z][A-Z\s]+):\s*(.+)$',  # SPEAKER: content
            r'^([A-Z][a-z]+\s+[A-Z][a-z]+):\s*(.+)$',  # Full Name: content
        ]
        
        speakers = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            for pattern in speaker_patterns:
                match = re.match(pattern, line)
                if match:
                    speaker = match.group(1).strip()
                    content = match.group(2).strip()
                    if content and len(content) > 5:
                        speakers.append({
                            'speaker': speaker,
                            'content': content,
                            'type': 'interview_response'
                        })
                    break
        
        return speakers
    
    def _identify_workflow_content(self, text: str) -> Dict[str, Any]:
        """Identify workflow-related content in the text"""
        workflow_keywords = [
            'workflow', 'process', 'approval', 'review', 'sign-off',
            'routing', 'escalation', 'notification', 'automation',
            'business rules', 'decision points', 'status', 'state'
        ]
        
        dam_keywords = [
            'digital asset', 'asset management', 'metadata', 'tagging',
            'version control', 'access control', 'permissions', 'search',
            'categorization', 'workflow integration'
        ]
        
        workflow_matches = []
        dam_matches = []
        
        paragraphs = self._extract_paragraphs(text)
        
        for i, para in enumerate(paragraphs):
            para_lower = para.lower()
            
            # Check for workflow content
            if any(keyword in para_lower for keyword in workflow_keywords):
                workflow_matches.append({
                    'paragraph_index': i,
                    'content': para,
                    'keywords': [kw for kw in workflow_keywords if kw in para_lower]
                })
            
            # Check for DAM content
            if any(keyword in para_lower for keyword in dam_keywords):
                dam_matches.append({
                    'paragraph_index': i,
                    'content': para,
                    'keywords': [kw for kw in dam_keywords if kw in para_lower]
                })
        
        return {
            'workflow_content': workflow_matches,
            'dam_content': dam_matches,
            'total_paragraphs': len(paragraphs),
            'workflow_ratio': len(workflow_matches) / len(paragraphs) if paragraphs else 0,
            'dam_ratio': len(dam_matches) / len(paragraphs) if paragraphs else 0
        }
    
    def get_processing_summary(self, documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a summary of processed documents"""
        total_files = len(documents)
        total_paragraphs = sum(len(doc.get('paragraphs', [])) for doc in documents)
        total_speakers = sum(len(doc.get('speaker_labels', [])) for doc in documents)
        
        file_types = {}
        for doc in documents:
            file_type = doc.get('file_type', 'unknown')
            file_types[file_type] = file_types.get(file_type, 0) + 1
        
        return {
            'total_files': total_files,
            'total_paragraphs': total_paragraphs,
            'total_speakers': total_speakers,
            'file_type_distribution': file_types,
            'processing_status': 'completed'
        }
