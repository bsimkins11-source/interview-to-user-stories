# Gemini AI Setup Guide

## 🚀 **Getting Started with Gemini AI Integration**

### **Step 1: Get Your Gemini API Key**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### **Step 2: Configure Environment Variables**

Create a `.env.local` file in your project root:

```bash
# Gemini AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

**Important**: Replace `your_actual_api_key_here` with the API key you copied from Google AI Studio.

### **Step 3: Restart Your Development Server**

After adding the environment variable, restart your Next.js development server:

```bash
npm run dev
```

### **Step 4: Test the Integration**

1. Navigate to any page in your app
2. Open the Gemini AI Assistant (it should be at the top of each page)
3. Ask a question about the app or current step
4. You should receive intelligent, context-aware responses

## 🔧 **Configuration Details**

### **Environment Variable**
- **Name**: `NEXT_PUBLIC_GEMINI_API_KEY`
- **Scope**: Public (accessible in browser)
- **Required**: Yes, for Gemini AI functionality

### **API Model**
- **Model**: `gemini-1.5-flash`
- **Features**: Text generation, context-aware responses
- **Rate Limits**: Based on your Google Cloud quota

## 🧠 **How It Works**

### **Context-Aware Assistance**
The Gemini AI assistant now:
- Understands your current step in the workflow
- Knows about your constructs, transcripts, and data
- Provides step-specific guidance and best practices
- Answers questions about the app's capabilities and workflow

### **Knowledge Base Integration**
The AI has access to comprehensive information about:
- Application architecture and workflow
- Technical capabilities and limitations
- Best practices and troubleshooting
- Data models and schemas
- Common use cases and scenarios

### **Intelligent Responses**
Instead of generic responses, you'll get:
- Step-specific guidance based on where you are
- Context-aware advice about your current data
- Technical explanations tailored to your situation
- Actionable recommendations for next steps

## 🚨 **Troubleshooting**

### **"API key not configured" Error**
- Check that `.env.local` file exists
- Verify the environment variable name is correct
- Restart your development server
- Check browser console for any errors

### **"Failed to generate AI response" Error**
- Verify your API key is valid
- Check your Google Cloud quota and billing
- Ensure you have internet connectivity
- Check browser console for detailed error messages

### **Slow Response Times**
- This is normal for AI generation
- Responses typically take 2-5 seconds
- Complex questions may take longer
- Check your internet connection speed

## 🔒 **Security Notes**

- The API key is public (NEXT_PUBLIC_) because it's used in the browser
- Google AI Studio provides usage monitoring and rate limiting
- API keys are tied to your Google account and project
- Monitor usage in Google AI Studio dashboard

## 📚 **Advanced Configuration**

### **Customizing the Knowledge Base**
You can modify the knowledge base in `lib/gemini.ts` to:
- Add industry-specific information
- Include company-specific workflows
- Customize response styles and tone
- Add domain-specific terminology

### **Adjusting Response Parameters**
In `lib/gemini.ts`, you can modify:
- Model selection (other Gemini models available)
- Response generation parameters
- Context window size
- Error handling behavior

## 🎯 **Example Questions to Test**

Try asking the AI assistant these questions:

- "How does the Interview ETL process work?"
- "What file formats are supported?"
- "How long does AI processing take?"
- "What should I do in the construct step?"
- "How do I get the best results from my interviews?"
- "What makes this different from other tools?"
- "Can you explain the vectorization process?"

## 🆘 **Getting Help**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your API key configuration
3. Check browser console for error messages
4. Ensure your Google Cloud project has Gemini API enabled
5. Contact support with specific error details

---

With this setup, your Gemini AI assistant will provide intelligent, context-aware help throughout the Interview ETL workflow! 🚀
