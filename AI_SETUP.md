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
1. Start the full application: `./start-local.sh`
2. Upload real interview transcripts
3. Watch Gemini process them in real-time
4. Download structured user stories

## 💡 **Tips for Better Results**

- **Clear Transcripts**: Well-formatted interview transcripts work best
- **Specific Questions**: Ask interviewees about specific pain points
- **Role Clarity**: Ensure interviewees identify their roles clearly
- **Benefit Focus**: Ask "why" questions to understand benefits

---

**🎉 You're now ready to process real interview transcripts with AI-powered user story extraction!**
