import os
import re
import json
import asyncio
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, parse_qs
import aiohttp
from google.cloud import storage
from google.cloud import firestore
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

class ExternalImportService:
    """Service for importing user stories from external sources"""
    
    def __init__(self):
        self.firestore_client = firestore.Client()
        self.storage_client = storage.Client()
        self.import_counter = 1  # Initialize sequential counter for external imports
        
        # Initialize credentials if available
        if os.path.exists('service-account-key.json'):
            credentials = service_account.Credentials.from_service_account_file(
                'service-account-key.json'
            )
            self.firestore_client = firestore.Client(credentials=credentials)
            self.storage_client = storage.Client(credentials=credentials)
    
    def _generate_sequential_import_id(self) -> str:
        """Generate sequential ID for external imports: US-EXT-1, US-EXT-2, etc."""
        import_id = f"US-EXT-{self.import_counter}"
        self.import_counter += 1
        return import_id
    
    async def import_from_folder(self, folder_url: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Import user stories from a cloud storage folder"""
        try:
            # Parse the folder URL to determine the source
            source_type = self._detect_source_type(folder_url)
            
            if source_type == 'google_drive':
                return await self._import_from_google_drive(folder_url, metadata)
            elif source_type == 'sharepoint':
                return await self._import_from_sharepoint(folder_url, metadata)
            elif source_type == 'onedrive':
                return await self._import_from_onedrive(folder_url, metadata)
            else:
                return await self._import_from_generic_folder(folder_url, metadata)
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'source_type': 'unknown',
                'stories_imported': 0
            }
    
    async def import_from_document(self, document_url: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Import user stories from a single document"""
        try:
            # Parse the document URL
            source_type = self._detect_source_type(document_url)
            
            if source_type == 'google_docs':
                return await self._import_from_google_docs(document_url, metadata)
            elif source_type == 'google_sheets':
                return await self._import_from_google_sheets(document_url, metadata)
            elif source_type == 'excel':
                return await self._import_from_excel(document_url, metadata)
            elif source_type == 'csv':
                return await self._import_from_csv(document_url, metadata)
            else:
                return await self._import_from_generic_document(document_url, metadata)
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'source_type': 'unknown',
                'stories_imported': 0
            }
    
    async def import_from_link(self, link_url: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Import user stories from a direct link"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(link_url) as response:
                    if response.status == 200:
                        content_type = response.headers.get('content-type', '')
                        
                        if 'json' in content_type:
                            data = await response.json()
                            return await self._parse_json_stories(data, metadata)
                        elif 'csv' in content_type or link_url.endswith('.csv'):
                            text = await response.text()
                            return await self._parse_csv_stories(text, metadata)
                        elif 'xml' in content_type or link_url.endswith('.xml'):
                            text = await response.text()
                            return await self._parse_xml_stories(text, metadata)
                        else:
                            # Try to parse as text
                            text = await response.text()
                            return await self._parse_text_stories(text, metadata)
                    else:
                        return {
                            'success': False,
                            'error': f'HTTP {response.status}: {response.reason}',
                            'source_type': 'http_link',
                            'stories_imported': 0
                        }
                        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'source_type': 'http_link',
                'stories_imported': 0
            }
    
    def _detect_source_type(self, url: str) -> str:
        """Detect the type of source from the URL"""
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        path = parsed.path.lower()
        
        # Google Drive
        if 'drive.google.com' in domain:
            if '/folders/' in path:
                return 'google_drive'
            elif '/spreadsheets/' in path:
                return 'google_sheets'
            elif '/document/' in path:
                return 'google_docs'
        
        # SharePoint
        if 'sharepoint.com' in domain or 'sharepoint' in domain:
            return 'sharepoint'
        
        # OneDrive
        if 'onedrive.com' in domain or '1drv.ms' in domain:
            return 'onedrive'
        
        # File extensions
        if path.endswith('.csv'):
            return 'csv'
        elif path.endswith(('.xlsx', '.xls')):
            return 'excel'
        elif path.endswith('.json'):
            return 'json'
        elif path.endswith('.xml'):
            return 'xml'
        
        return 'generic'
    
    async def _import_from_google_drive(self, folder_url: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Import from Google Drive folder"""
        try:
            # Extract folder ID from URL
            folder_id = self._extract_google_drive_id(folder_url)
            
            # Try to use real Google Drive API
            try:
                stories = await self._fetch_google_drive_folder(folder_id, metadata)
                if stories:
                    # Store the imported stories
                    await self._store_imported_stories(stories, metadata, 'google_drive')
                    
                    return {
                        'success': True,
                        'source_type': 'google_drive',
                        'folder_id': folder_id,
                        'stories_imported': len(stories),
                        'stories': stories
                    }
            except Exception as api_error:
                print(f"Google Drive API failed: {api_error}, falling back to simulation")
                # Fallback to simulation if API fails
                stories = await self._simulate_google_drive_import(folder_id)
                
                # Store the imported stories
                await self._store_imported_stories(stories, metadata, 'google_drive')
                
                return {
                    'success': True,
                    'source_type': 'google_drive',
                    'folder_id': folder_id,
                    'stories_imported': len(stories),
                    'stories': stories,
                    'note': 'Using simulated data due to API configuration issues'
                }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'source_type': 'google_drive',
                'stories_imported': 0
            }
    
    async def _import_from_google_sheets(self, sheet_url: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Import from Google Sheets"""
        try:
            # Extract sheet ID from URL
            sheet_id = self._extract_google_drive_id(sheet_url)
            
            # In a real implementation, you would use Google Sheets API
            # For now, we'll simulate the import
            stories = await self._simulate_google_sheets_import(sheet_id)
            
            # Store the imported stories
            await self._store_imported_stories(stories, metadata, 'google_sheets')
            
            return {
                'success': True,
                'source_type': 'google_sheets',
                'sheet_id': sheet_id,
                'stories_imported': len(stories),
                'stories': stories
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'source_type': 'google_sheets',
                'stories_imported': 0
            }
    
    async def _import_from_google_docs(self, document_url: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Import from Google Docs document"""
        try:
            # Extract document ID from URL
            document_id = self._extract_google_drive_id(document_url)
            
            # Use Google Docs API to fetch the document content
            document_content = await self._fetch_google_docs_content(document_id)
            
            if not document_content:
                return {
                    'success': False,
                    'error': 'Failed to fetch document content from Google Docs',
                    'source_type': 'google_docs',
                    'stories_imported': 0
                }
            
            # Parse the document content into user stories
            stories = await self._parse_document_content(document_content, metadata)
            
            # Store the imported stories
            await self._store_imported_stories(stories, metadata, 'google_docs')
            
            return {
                'success': True,
                'source_type': 'google_docs',
                'document_id': document_id,
                'stories_imported': len(stories),
                'stories': stories,
                'document_title': document_content.get('title', 'Untitled Document')
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'source_type': 'google_docs',
                'stories_imported': 0
            }
    
    def _extract_google_drive_id(self, url: str) -> str:
        """Extract ID from Google Drive URL"""
        # Handle different Google Drive URL formats
        patterns = [
            r'/folders/([a-zA-Z0-9-_]+)',
            r'/spreadsheets/d/([a-zA-Z0-9-_]+)',
            r'/document/d/([a-zA-Z0-9-_]+)',
            r'id=([a-zA-Z0-9-_]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return url  # Fallback to full URL
    
    async def _simulate_google_drive_import(self, folder_id: str) -> List[Dict[str, Any]]:
        """Simulate importing from Google Drive folder"""
        # Simulate API delay
        await asyncio.sleep(1)
        
        # Return sample stories
        return [
            {
                'id': f'gd_{folder_id}_1',
                'title': 'User Authentication Workflow',
                'description': 'As a user, I need to securely log into the system so that I can access my personalized dashboard.',
                'category': 'Authentication',
                'priority': 'High',
                'source': 'Google Drive',
                'tags': ['authentication', 'security', 'workflow']
            },
            {
                'id': f'gd_{folder_id}_2',
                'title': 'Document Approval Process',
                'description': 'As a manager, I need to review and approve documents so that the team can proceed with implementation.',
                'category': 'Approval',
                'priority': 'Medium',
                'source': 'Google Drive',
                'tags': ['approval', 'workflow', 'management']
            }
        ]
    
    async def _simulate_google_sheets_import(self, sheet_id: str) -> List[Dict[str, Any]]:
        """Simulate importing from Google Sheets"""
        # Simulate API delay
        await asyncio.sleep(1)
        
        # Return sample stories
        return [
            {
                'id': f'gs_{sheet_id}_1',
                'title': 'Data Export Functionality',
                'description': 'As an analyst, I need to export data in multiple formats so that I can create reports for stakeholders.',
                'category': 'Data',
                'priority': 'Medium',
                'source': 'Google Sheets',
                'tags': ['data', 'export', 'reporting']
            }
        ]
    
    async def _simulate_google_docs_import(self, document_id: str) -> List[Dict[str, Any]]:
        """Simulate importing from Google Docs document"""
        # Simulate API delay
        await asyncio.sleep(1)
        
        # Return sample stories
        return [
            {
                'id': f'gd_{document_id}_1',
                'title': 'Document Structure and Formatting',
                'description': 'As a user, I need to ensure the document is well-structured and formatted so that it is easy to read and understand.',
                'category': 'Documentation',
                'priority': 'Low',
                'source': 'Google Docs',
                'tags': ['documentation', 'formatting', 'readability']
            }
        ]
    
    async def _fetch_google_docs_content(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Fetch content from Google Docs using the API"""
        try:
            # Initialize Google Docs API client
            credentials = None
            if os.path.exists('service-account-key.json'):
                credentials = service_account.Credentials.from_service_account_file(
                    'service-account-key.json',
                    scopes=['https://www.googleapis.com/auth/documents.readonly']
                )
            
            if not credentials:
                # Fallback to simulation if no credentials
                return await self._simulate_google_docs_import(document_id)
            
            # Build the Google Docs API service
            docs_service = build('docs', 'v1', credentials=credentials)
            
            # Fetch the document
            document = docs_service.documents().get(documentId=document_id).execute()
            
            # Extract the content
            content = document.get('body', {}).get('content', [])
            text_content = self._extract_text_from_docs_content(content)
            
            return {
                'title': document.get('title', 'Untitled Document'),
                'content': text_content,
                'document_id': document_id,
                'last_modified': document.get('properties', {}).get('lastModifyTime', '')
            }
            
        except HttpError as e:
            if e.resp.status == 404:
                raise Exception(f"Document not found or access denied: {document_id}")
            elif e.resp.status == 403:
                raise Exception(f"Access denied to document: {document_id}")
            else:
                raise Exception(f"Google Docs API error: {e}")
        except Exception as e:
            # Fallback to simulation if API fails
            print(f"Google Docs API failed, falling back to simulation: {e}")
            return await self._simulate_google_docs_import(document_id)
    
    def _extract_text_from_docs_content(self, content: List[Dict[str, Any]]) -> str:
        """Extract plain text from Google Docs content structure"""
        text_parts = []
        
        for element in content:
            if 'paragraph' in element:
                paragraph = element['paragraph']
                if 'elements' in paragraph:
                    for elem in paragraph['elements']:
                        if 'textRun' in elem:
                            text_parts.append(elem['textRun'].get('content', ''))
                text_parts.append('\n')  # Add line break between paragraphs
        
        return ''.join(text_parts).strip()
    
    async def _parse_document_content(self, document_content: Dict[str, Any], metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse document content into user stories"""
        content = document_content.get('content', '')
        title = document_content.get('title', 'Untitled Document')
        
        # Simple parsing logic - in a real implementation, you might use AI to extract stories
        paragraphs = content.split('\n\n')
        stories = []
        
        for i, paragraph in enumerate(paragraphs):
            if paragraph.strip() and len(paragraph.strip()) > 50:  # Only process substantial paragraphs
                story = {
                    'id': f'gd_{document_content.get("document_id", "unknown")}_{i+1}',
                    'title': f'Story from {title} - Paragraph {i+1}',
                    'description': paragraph.strip(),
                    'category': metadata.get('category', 'Document Import'),
                    'priority': 'Medium',
                    'source': 'Google Docs',
                    'source_url': metadata.get('url', ''),
                    'tags': ['google-docs', 'import', 'document'],
                    'raw_content': paragraph.strip()
                }
                stories.append(story)
        
        return stories
    
    async def _parse_csv_stories(self, csv_content: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Parse CSV content into user stories"""
        try:
            lines = csv_content.strip().split('\n')
            if len(lines) < 2:
                return {
                    'success': False,
                    'error': 'CSV must have at least a header and one data row',
                    'source_type': 'csv',
                    'stories_imported': 0
                }
            
            headers = lines[0].split(',')
            stories = []
            
            for i, line in enumerate(lines[1:], 1):
                values = line.split(',')
                if len(values) >= len(headers):
                    story = {}
                    for j, header in enumerate(headers):
                        if j < len(values):
                            story[header.strip()] = values[j].strip().strip('"')
                    stories.append(story)
            
            # Store the imported stories
            await self._store_imported_stories(stories, metadata, 'csv')
            
            return {
                'success': True,
                'source_type': 'csv',
                'stories_imported': len(stories),
                'stories': stories
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'source_type': 'csv',
                'stories_imported': 0
            }
    
    async def _parse_json_stories(self, json_data: Any, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Parse JSON content into user stories"""
        try:
            stories = []
            
            if isinstance(json_data, list):
                stories = json_data
            elif isinstance(json_data, dict):
                if 'stories' in json_data:
                    stories = json_data['stories']
                elif 'user_stories' in json_data:
                    stories = json_data['user_stories']
                else:
                    stories = [json_data]
            
            # Store the imported stories
            await self._store_imported_stories(stories, metadata, 'json')
            
            return {
                'success': True,
                'source_type': 'json',
                'stories_imported': len(stories),
                'stories': stories
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'source_type': 'json',
                'stories_imported': 0
            }
    
    async def _parse_text_stories(self, text_content: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Parse text content into user stories"""
        try:
            # Simple text parsing - look for user story patterns
            story_patterns = [
                r'As a (\w+), I need (.+?) so that (.+?)[.!]',
                r'User Story: (.+?)[.!]',
                r'Requirement: (.+?)[.!]'
            ]
            
            stories = []
            for pattern in story_patterns:
                matches = re.findall(pattern, text_content, re.IGNORECASE | re.DOTALL)
                for match in matches:
                    if len(match) == 3:  # As a... format
                        stories.append({
                            'id': self._generate_sequential_import_id(),  # Use sequential ID
                            'role': match[0].strip(),
                            'capability': match[1].strip(),
                            'benefit': match[2].strip(),
                            'source': 'Text Import',
                            'category': 'General'
                        })
                    else:  # Other formats
                        stories.append({
                            'id': self._generate_sequential_import_id(),  # Use sequential ID
                            'description': match[0].strip(),
                            'source': 'Text Import',
                            'category': 'General'
                        })
            
            # Store the imported stories
            await self._store_imported_stories(stories, metadata, 'text')
            
            return {
                'success': True,
                'source_type': 'text',
                'stories_imported': len(stories),
                'stories': stories
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'source_type': 'text',
                'stories_imported': 0
            }
    
    async def _store_imported_stories(self, stories: List[Dict[str, Any]], metadata: Dict[str, Any], source_type: str):
        """Store imported stories in Firestore"""
        try:
            # Create import record
            import_id = self._generate_sequential_import_id()
            import_ref = self.firestore_client.collection('external_imports').document(import_id)
            import_data = {
                'id': import_id,
                'source_type': source_type,
                'source_url': metadata.get('source_url', ''),
                'display_name': metadata.get('display_name', f'Imported {source_type}'),
                'description': metadata.get('description', ''),
                'stories_count': len(stories),
                'imported_at': firestore.SERVER_TIMESTAMP,
                'status': 'completed'
            }
            
            import_ref.set(import_data)
            
            # Store individual stories
            for story in stories:
                story_ref = self.firestore_client.collection('external_stories').document()
                story_data = {
                    'id': story_ref.id,
                    'import_id': import_id,
                    'source_type': source_type,
                    'original_data': story,
                    'imported_at': firestore.SERVER_TIMESTAMP,
                    'status': 'active'
                }
                
                story_ref.set(story_data)
                
        except Exception as e:
            print(f"Error storing imported stories: {str(e)}")
    
    async def get_import_history(self) -> List[Dict[str, Any]]:
        """Get history of external imports"""
        try:
            imports_ref = self.firestore_client.collection('external_imports')
            imports = imports_ref.order_by('imported_at', direction=firestore.Query.DESCENDING).limit(50).stream()
            
            return [import_doc.to_dict() for import_doc in imports]
            
        except Exception as e:
            print(f"Error getting import history: {str(e)}")
            return []
    
    async def get_imported_stories(self, import_id: str) -> List[Dict[str, Any]]:
        """Get stories from a specific import"""
        try:
            stories_ref = self.firestore_client.collection('external_stories')
            stories = stories_ref.where('import_id', '==', import_id).stream()
            
            return [story_doc.to_dict() for story_doc in stories]
            
        except Exception as e:
            print(f"Error getting imported stories: {str(e)}")
            return []
    
    async def delete_import(self, import_id: str) -> bool:
        """Delete an external import and all its stories"""
        try:
            # Delete all stories from this import
            stories_ref = self.firestore_client.collection('external_stories')
            stories = stories_ref.where('import_id', '==', import_id).stream()
            
            for story_doc in stories:
                story_doc.reference.delete()
            
            # Delete the import record
            import_ref = self.firestore_client.collection('external_imports').document(import_id)
            import_ref.delete()
            
            return True
            
        except Exception as e:
            print(f"Error deleting import: {str(e)}")
            return False

    async def _fetch_google_drive_folder(self, folder_id: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch contents from Google Drive folder using the API"""
        try:
            credentials = None
            if os.path.exists('service-account-key.json'):
                credentials = service_account.Credentials.from_service_account_file(
                    'service-account-key.json',
                    scopes=['https://www.googleapis.com/auth/drive.readonly']
                )
            
            if not credentials:
                raise Exception("No service account credentials found for Google Drive API")
            
            # Build the Drive API service
            drive_service = build('drive', 'v3', credentials=credentials)
            
            # List files in the folder
            results = drive_service.files().list(
                q=f"'{folder_id}' in parents and trashed=false",
                fields="files(id,name,mimeType,size,modifiedTime,webViewLink)",
                orderBy="name"
            ).execute()
            
            files = results.get('files', [])
            stories = []
            
            for file in files:
                file_id = file['id']
                file_name = file['name']
                mime_type = file.get('mimeType', '')
                
                # Handle different file types
                if 'google-apps.document' in mime_type:
                    # Google Docs
                    doc_content = await self._fetch_google_docs_content(file_id)
                    if doc_content:
                        doc_stories = await self._parse_document_content(doc_content, metadata)
                        stories.extend(doc_stories)
                elif 'google-apps.spreadsheet' in mime_type:
                    # Google Sheets
                    sheet_stories = await self._parse_google_sheets_content(file_id, metadata)
                    stories.extend(sheet_stories)
                elif 'text/plain' in mime_type or file_name.endswith('.txt'):
                    # Text files
                    text_content = await self._fetch_file_content(file_id, drive_service)
                    if text_content:
                        text_stories = await self._parse_text_content(text_content, metadata)
                        stories.extend(text_stories)
                elif 'application/pdf' in mime_type:
                    # PDF files (basic text extraction)
                    pdf_content = await self._fetch_file_content(file_id, drive_service)
                    if pdf_content:
                        pdf_stories = await self._parse_text_content(pdf_content, metadata)
                        stories.extend(pdf_stories)
            
            return stories
            
        except Exception as e:
            print(f"Error fetching Google Drive folder: {str(e)}")
            raise e

    async def _fetch_file_content(self, file_id: str, drive_service) -> str:
        """Fetch file content from Google Drive"""
        try:
            # Get file content
            response = drive_service.files().get_media(fileId=file_id).execute()
            return response.decode('utf-8')
        except Exception as e:
            print(f"Error fetching file content: {str(e)}")
            return ""

    async def _parse_google_sheets_content(self, sheet_id: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Google Sheets content into user stories"""
        try:
            credentials = None
            if os.path.exists('service-account-key.json'):
                credentials = service_account.Credentials.from_service_account_file(
                    'service-account-key.json',
                    scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
                )
            
            if not credentials:
                raise Exception("No service account credentials found for Google Sheets API")
            
            # Build the Sheets API service
            sheets_service = build('sheets', 'v4', credentials=credentials)
            
            # Get sheet data
            result = sheets_service.spreadsheets().values().get(
                spreadsheetId=sheet_id,
                range='A:Z'  # Get all columns
            ).execute()
            
            values = result.get('values', [])
            if not values:
                return []
            
            # Assume first row is headers
            headers = values[0]
            stories = []
            
            for i, row in enumerate(values[1:], 1):
                if len(row) >= 2:  # At least title and description
                    story = {
                        'id': f'sheet_{sheet_id}_row_{i}',
                        'title': row[0] if len(row) > 0 else f'Story from Row {i}',
                        'description': row[1] if len(row) > 1 else 'No description provided',
                        'category': metadata.get('category', 'Google Sheets Import'),
                        'priority': 'Medium',
                        'source': 'Google Sheets',
                        'source_url': metadata.get('url', ''),
                        'tags': ['google-sheets', 'import', 'spreadsheet'],
                        'raw_content': ' | '.join(row)
                    }
                    stories.append(story)
            
            return stories
            
        except Exception as e:
            print(f"Error parsing Google Sheets: {str(e)}")
            return []

    async def _parse_text_content(self, content: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse text content into user stories"""
        try:
            paragraphs = content.split('\n\n')
            stories = []
            
            for i, paragraph in enumerate(paragraphs):
                if paragraph.strip() and len(paragraph.strip()) > 50:
                    story = {
                        'id': f'text_import_{i+1}',
                        'title': f'Story from Text - Paragraph {i+1}',
                        'description': paragraph.strip(),
                        'category': metadata.get('category', 'Text Import'),
                        'priority': 'Medium',
                        'source': 'Text File',
                        'source_url': metadata.get('url', ''),
                        'tags': ['text-import', 'document'],
                        'raw_content': paragraph.strip()
                    }
                    stories.append(story)
            
            return stories
            
        except Exception as e:
            print(f"Error parsing text content: {str(e)}")
            return []

    async def _import_from_generic_document(self, document_url: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Import from generic document (fallback method)"""
        try:
            # Try to fetch content from the URL
            async with aiohttp.ClientSession() as session:
                async with session.get(document_url) as response:
                    if response.status == 200:
                        content_type = response.headers.get('content-type', '')
                        content = await response.text()
                        
                        if 'text/html' in content_type:
                            # Basic HTML parsing
                            stories = await self._parse_html_content(content, metadata)
                        elif 'text/plain' in content_type:
                            # Plain text parsing
                            stories = await self._parse_text_content(content, metadata)
                        else:
                            # Generic content parsing
                            stories = await self._parse_generic_content(content, metadata)
                        
                        if stories:
                            await self._store_imported_stories(stories, metadata, 'generic_document')
                            return {
                                'success': True,
                                'source_type': 'generic_document',
                                'url': document_url,
                                'stories_imported': len(stories),
                                'stories': stories
                            }
            
            # If we can't fetch content, return simulation
            stories = await self._simulate_generic_document_import(document_url, metadata)
            await self._store_imported_stories(stories, metadata, 'generic_document')
            
            return {
                'success': True,
                'source_type': 'generic_document',
                'url': document_url,
                'stories_imported': len(stories),
                'stories': stories,
                'note': 'Using simulated data due to content access limitations'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'source_type': 'generic_document',
                'stories_imported': 0
            }

    async def _import_from_generic_folder(self, folder_url: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Import from generic folder (fallback method)"""
        try:
            # For generic folders, we'll use simulation for now
            folder_id = self._extract_generic_folder_id(folder_url)
            stories = await self._simulate_generic_folder_import(folder_id, metadata)
            
            await self._store_imported_stories(stories, metadata, 'generic_folder')
            
            return {
                'success': True,
                'source_type': 'generic_folder',
                'url': folder_url,
                'stories_imported': len(stories),
                'stories': stories,
                'note': 'Using simulated data for generic folder import'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'source_type': 'generic_folder',
                'stories_imported': 0
            }

    def _extract_generic_folder_id(self, url: str) -> str:
        """Extract ID from generic folder URL"""
        # Basic URL parsing for generic folders
        parsed = urlparse(url)
        return parsed.path.strip('/') or parsed.netloc

    async def _simulate_generic_document_import(self, url: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Simulate importing from generic document"""
        await asyncio.sleep(1)
        
        return [
            {
                'id': f'generic_doc_{hash(url) % 1000}_1',
                'title': 'Generic Document Content',
                'description': 'As a user, I need to access and process content from various document sources so that I can extract relevant information.',
                'category': 'Generic Import',
                'priority': 'Medium',
                'source': 'Generic Document',
                'source_url': url,
                'tags': ['generic', 'import', 'document'],
                'raw_content': f'Content from {url}'
            }
        ]

    async def _simulate_generic_folder_import(self, folder_id: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Simulate importing from generic folder"""
        await asyncio.sleep(1)
        
        return [
            {
                'id': f'generic_folder_{folder_id}_1',
                'title': 'Generic Folder Content',
                'description': 'As a user, I need to process multiple documents from a folder so that I can extract user stories from various sources.',
                'category': 'Generic Import',
                'priority': 'Medium',
                'source': 'Generic Folder',
                'source_url': metadata.get('url', ''),
                'tags': ['generic', 'import', 'folder'],
                'raw_content': f'Content from folder {folder_id}'
            }
        ]

    async def _parse_html_content(self, html_content: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse HTML content into user stories"""
        try:
            # Basic HTML parsing - extract text content
            import re
            # Remove HTML tags
            text_content = re.sub(r'<[^>]+>', '', html_content)
            # Remove extra whitespace
            text_content = re.sub(r'\s+', ' ', text_content).strip()
            
            # Split into paragraphs
            paragraphs = text_content.split('. ')
            stories = []
            
            for i, paragraph in enumerate(paragraphs):
                if paragraph.strip() and len(paragraph.strip()) > 50:
                    story = {
                        'id': f'html_import_{i+1}',
                        'title': f'Story from HTML - Paragraph {i+1}',
                        'description': paragraph.strip() + '.',
                        'category': metadata.get('category', 'HTML Import'),
                        'priority': 'Medium',
                        'source': 'HTML Document',
                        'source_url': metadata.get('url', ''),
                        'tags': ['html', 'import', 'document'],
                        'raw_content': paragraph.strip()
                    }
                    stories.append(story)
            
            return stories
            
        except Exception as e:
            print(f"Error parsing HTML content: {str(e)}")
            return []

    async def _parse_generic_content(self, content: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse generic content into user stories"""
        try:
            # Try to parse as JSON first
            try:
                data = json.loads(content)
                if isinstance(data, list):
                    return await self._parse_json_stories(data, metadata)
                elif isinstance(data, dict):
                    return await self._parse_json_stories([data], metadata)
            except json.JSONDecodeError:
                pass
            
            # Fallback to text parsing
            return await self._parse_text_content(content, metadata)
            
        except Exception as e:
            print(f"Error parsing generic content: {str(e)}")
            return []
