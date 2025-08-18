# 🚀 AI Pipeline Setup Guide

This guide will help you get the Gemini AI processing pipeline working to analyze interview transcripts and extract user stories.

## 🔑 **Step 1: Get Your Gemini API Key**

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

## ⚙️ **Step 2: Configure Environment**

1. **Update `config/local.env`:**
```env
# Replace with your actual values
GEMINI_API_KEY=your-actual-gemini-api-key-here
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account.json
GCS_BUCKET=your-storage-bucket-name
```

2. **Set Google Cloud credentials:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account.json"
```

## 🧪 **Step 3: Test the AI Pipeline**

Run the test script to verify everything is working:

```bash
python test-ai-pipeline.py
```

**Expected Output:**
```
🧪 Testing AI Processing Pipeline
==================================================
✅ Gemini API key found

📝 Sample Interview Content:
------------------------------
Interview with Sarah Johnson, Workflow Manager...

🔧 Testing Document Processing...
✅ Processed 1 documents
   - File: interview_sarah_johnson.txt
   - Paragraphs: 8
   - Speakers: 4

🤖 Testing AI Extraction...
   Processing paragraph 1: Interview with Sarah Johnson, Workflow Manager...
   ✅ Extracted story: As a workflow manager, I need a better approval process...

📊 Extraction Results:
   - Total paragraphs processed: 3
   - Stories extracted: 2

🎯 Sample Extracted Stories:
   Story 1:
   - ID: US-1
   - Story: As a workflow manager, I need a better approval process...
   - Category: workflow
   - Priority: high
   - Method: ai
```

## 🚨 **Troubleshooting**

### **"Gemini API key not found"**
- Check that `GEMINI_API_KEY` is set in `config/local.env`
- Verify the key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)

### **"Google Cloud credentials not found"**
- Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Verify your service account has proper permissions

### **"AI extraction failed"**
- Check your internet connection
- Verify Gemini API quota hasn't been exceeded
- Check the API key permissions

## 🔄 **How It Works**

1. **File Upload**: Interview transcripts are uploaded to Google Cloud Storage
2. **Document Processing**: Files are parsed and split into paragraphs
3. **AI Analysis**: Gemini reads each paragraph and extracts user stories
4. **Story Structuring**: Stories are formatted according to your construct template
5. **Output Generation**: Results are compiled into CSV format

## 📊 **What Gemini Extracts**

From interview transcripts, Gemini will identify:
- **User Roles**: Who needs the capability
- **Capabilities**: What they need to do
- **Benefits**: Why they need it
- **Categories**: Workflow, DAM, or Integration
- **Priorities**: High, Medium, or Low
- **Requirements**: Specific acceptance criteria

## 🎯 **Example Output**

**Input (Interview Transcript):**
> "We need a better approval process for document submissions. Right now, everything gets stuck in email threads and we lose track of what's been approved and what hasn't."

**Output (User Story):**
> "As a workflow manager, I need a centralized approval system so that I can track document approval status and maintain audit trails."

## 🚀 **Next Steps**

Once the test passes:
1. **Start the full application**: `./start-local.sh`
2. **Upload real interview transcripts**
3. **Watch Gemini process them in real-time**
4. **Download structured user stories**

## 💡 **Tips for Better Results**

- **Clear Transcripts**: Well-formatted interview transcripts work best
- **Specific Questions**: Ask interviewees about specific pain points
- **Role Clarity**: Ensure interviewees identify their roles clearly
- **Benefit Focus**: Ask "why" questions to understand benefits

---

## 🎯 **IMPROVING GEMINI'S CATEGORIZATION**

### **Why This Matters**
Better categorization means:
- More accurate user story classification
- Consistent terminology across projects
- Better reporting and analysis
- Improved AI learning over time

### **🎨 Enhanced Categorization System**

#### **1. Workflow Category**
**Keywords to look for:**
- Process management, approvals, routing
- Notifications, escalations, automation
- Business rules, decision points
- Status tracking, state management

**Example Training Data:**
```
Input: "We need a workflow that automatically routes documents to the right approvers"
Category: workflow
Reason: Process automation and routing
```

#### **2. DAM (Digital Asset Management) Category**
**Keywords to look for:**
- Digital assets, files, media
- Metadata, tagging, categorization
- Version control, access permissions
- Asset organization, search

**Example Training Data:**
```
Input: "We need to organize our marketing assets with proper metadata and version control"
Category: dam
Reason: Asset management and organization
```

#### **3. Integration Category**
**Keywords to look for:**
- System connections, APIs
- Data sharing, synchronization
- Third-party integrations
- Import/export functionality

**Example Training Data:**
```
Input: "The system needs to connect with our CRM to sync customer data"
Category: integration
Reason: System connectivity and data sync
```

#### **4. Security Category**
**Keywords to look for:**
- Authentication, authorization
- Compliance, audit trails
- Data protection, privacy
- Access control, permissions

**Example Training Data:**
```
Input: "We need role-based access control to ensure compliance with security policies"
Category: security
Reason: Access control and compliance
```

### **🔧 How to Improve Categorization**

#### **1. Provide Better Examples**
In your interview transcripts, use clear, specific language:
- ❌ "We need something better"
- ✅ "We need a centralized approval workflow for document submissions"

#### **2. Use Consistent Terminology**
- **Workflow**: Use "process", "workflow", "approval", "routing"
- **DAM**: Use "asset", "metadata", "version", "organization"
- **Integration**: Use "connect", "sync", "API", "integration"
- **Security**: Use "access", "permission", "compliance", "audit"

#### **3. Structure Your Questions**
Ask interviewees specific questions:
- "What specific process are you trying to improve?"
- "What type of assets are you managing?"
- "Which systems need to connect?"
- "What security requirements do you have?"

#### **4. Provide Context**
Give Gemini more context in your transcripts:
- Mention the interviewee's role clearly
- Describe the current pain points specifically
- Explain the desired outcomes
- Provide examples of similar situations

### **📋 Example Interview Structure**

#### **Good Interview Format:**
```
Interviewer: "What's your role and what processes are you trying to improve?"

Sarah (Workflow Manager): "I'm a workflow manager responsible for document approvals. 
Currently, we're using email threads for approvals, which causes delays and lost 
tracking. We need a centralized system that can route documents to the right 
approvers, send reminders, and maintain audit trails."

Interviewer: "What specific capabilities do you need?"

Sarah: "I need the system to automatically route documents based on content type, 
send notifications when approvals are overdue, and provide a dashboard showing 
all pending approvals with clear status indicators."
```

#### **Poor Interview Format:**
```
Interviewer: "What do you need?"

Sarah: "We need something better than what we have now. The current system 
doesn't work well and we need improvements."
```

### **🚀 Advanced Categorization Techniques**

#### **1. Use Construct Templates**
Define specific output schemas that guide categorization:
```json
{
  "output_schema": [
    "User Story ID",
    "User Story", 
    "Category",
    "Subcategory",
    "Priority",
    "Business Value"
  ],
  "categories": {
    "workflow": ["approval", "routing", "notification", "automation"],
    "dam": ["asset_management", "metadata", "version_control", "access"],
    "integration": ["api", "sync", "import", "export"],
    "security": ["authentication", "authorization", "compliance", "audit"]
  }
}
```

#### **2. Provide Industry-Specific Examples**
If you're in healthcare, finance, or other regulated industries:
- Include compliance requirements
- Mention specific regulations
- Use industry-standard terminology

#### **3. Use Priority Indicators**
Help Gemini understand importance:
- **High**: "critical", "essential", "must have", "compliance requirement"
- **Medium**: "important", "should have", "efficiency improvement"
- **Low**: "nice to have", "future enhancement", "optimization"

### **📊 Monitoring and Improvement**

#### **1. Review AI Output**
After processing, review the categorization:
- Are stories in the right categories?
- Is terminology consistent?
- Are priorities appropriate?

#### **2. Provide Feedback**
If categorization is wrong:
- Note the incorrect categorization
- Identify why it was wrong
- Update your interview questions
- Provide better examples

#### **3. Iterate and Improve**
- Update your construct templates
- Refine your interview questions
- Add more specific examples
- Use consistent terminology

### **🎯 Best Practices Summary**

1. **Be Specific**: Use clear, actionable language
2. **Provide Examples**: Give concrete use cases
3. **Use Consistent Terms**: Stick to standard terminology
4. **Structure Interviews**: Ask targeted questions
5. **Give Context**: Explain roles and situations clearly
6. **Review Output**: Check AI categorization accuracy
7. **Iterate**: Continuously improve based on results

---

**🎉 You're now ready to process real interview transcripts with AI-powered user story extraction and improved categorization!**
