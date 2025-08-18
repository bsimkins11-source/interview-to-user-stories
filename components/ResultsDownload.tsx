"use client";

import { useState, useEffect, useMemo } from 'react';
import { Download, FileText, BarChart3, Plus, CheckCircle, TrendingUp, Users, Target, Edit3, Table } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { EditableUserStoriesTable } from './EditableUserStoriesTable';

interface ResultsDownloadProps {
  jobStatus: any;
  onNewJob: () => void;
}

export function ResultsDownload({ jobStatus, onNewJob }: ResultsDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'editable'>('preview');
  const [editableStories, setEditableStories] = useState(jobStatus?.userStories || []);

  // Sync editable stories when user stories change
  useEffect(() => {
    if (jobStatus?.userStories) {
      setEditableStories(jobStatus.userStories);
    }
  }, [jobStatus?.userStories]);

  // Calculate changes made
  const changesCount = useMemo(() => {
    if (!jobStatus?.userStories) return 0;
    return editableStories.length - jobStatus.userStories.length;
  }, [editableStories.length, jobStatus?.userStories?.length]);

  const handleDownload = async () => {
    if (!jobStatus?.csv_url) return;
    
    setIsDownloading(true);
    try {
      // Generate signed download URL if needed
      const downloadUrl = jobStatus.csv_url.startsWith('gs://') 
        ? await generateSignedDownloadUrl(jobStatus.id)
        : jobStatus.csv_url;
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `user_stories_${jobStatus.id}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      console.log('Download started successfully');
    } catch (error) {
      console.error('Download failed:', error);
      // Show user-friendly error message
      alert('Download failed. Please try again or contact support if the issue persists.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStoriesChange = (newStories: any[]) => {
    setEditableStories(newStories);
  };

  const handleDownloadEdited = (stories: any[]) => {
    // Convert stories to CSV format and download
    const csvContent = generateCSVContent(stories);
    downloadCSV(csvContent, `user_stories_${jobStatus.id}_edited.csv`);
  };

  const generateCSVContent = (stories: any[]) => {
    const headers = [
      'User Story ID', 
      'User Story', 
      'User Story Statement', 
      'Epic', 
      'Stakeholder Name', 
      'Stakeholder Role', 
      'Stakeholder Team', 
      'Category', 
      'Change Catalyst', 
      'Use Case ID', 
      'Priority', 
      'Confidence', 
      'Tags', 
      'Source', 
      'Extraction Method'
    ];
    
    const csvRows = stories.map(story => [
      story.id,
      `"${story.userStory.replace(/"/g, '""')}"`,
      `"${(story.userStoryStatement || '').replace(/"/g, '""')}"`,
      story.epic || '',
      story.stakeholderName || '',
      story.stakeholderRole || '',
      story.stakeholderTeam || '',
      story.category || '',
      `"${(story.changeCatalyst || '').replace(/"/g, '""')}"`,
      story.useCaseId || '',
      story.priority || '',
      story.confidence || 0,
      (story.tags || []).join(';'),
      story.source || '',
      story.extractionMethod || 'Manual Edit'
    ]);
    
    return [headers, ...csvRows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generateSignedDownloadUrl = async (jobId: string) => {
    try {
      // Call the backend to get a signed download URL
      const response = await fetch(`https://interview-etl-backend-289778453333.us-central1.run.app/download/${jobId}/csv`);
      if (response.ok) {
        const data = await response.json();
        return data.download_url;
      } else {
        throw new Error('Failed to get download URL');
      }
    } catch (error) {
      console.error('Error generating download URL:', error);
      // Fallback to direct download endpoint
      return `https://interview-etl-backend-289778453333.us-central1.run.app/download/${jobId}/csv/direct`;
    }
  };

  const getPriorityDistribution = () => {
    // This would come from actual data analysis
    return {
      high: 25,
      medium: 45,
      low: 30
    };
  };

  const getCategoryBreakdown = () => {
    // This would come from actual data analysis
    return [
      { category: 'Workflow', count: 35, percentage: 35 },
      { category: 'Features', count: 28, percentage: 28 },
      { category: 'Process', count: 22, percentage: 22 },
      { category: 'Integration', count: 15, percentage: 15 }
    ];
  };

  const getSampleUserStories = () => {
    // Use passed user stories data if available, otherwise fall back to sample data
    if (jobStatus?.userStories && jobStatus.userStories.length > 0) {
      return jobStatus.userStories;
    }
    
    // Fallback sample data
    return [
      {
        id: 'US-001',
        userStory: 'As a user, I want to be able to easily navigate through the application to find specific features.',
        capability: 'Navigation',
        team: 'Frontend',
        priority: 'High',
        category: 'Workflow',
        confidence: 0.95,
        tags: ['UX', 'Navigation', 'User Experience']
      },
      {
        id: 'US-002',
        userStory: 'As a developer, I want to be able to quickly search for code changes across multiple files.',
        capability: 'Code Search',
        team: 'Backend',
        priority: 'Medium',
        category: 'Features',
        confidence: 0.88,
        tags: ['Code Search', 'Search', 'Development']
      },
      {
        id: 'US-003',
        userStory: 'As a product manager, I want to be able to track the progress of feature development across different teams.',
        capability: 'Feature Tracking',
        team: 'Product',
        priority: 'Low',
        category: 'Process',
        confidence: 0.92,
        tags: ['Product Management', 'Feature Tracking', 'Progress']
      }
    ];
  };

  const priorityDistribution = getPriorityDistribution();
  const categoryBreakdown = getCategoryBreakdown();

  return (
    <div className="space-y-6">
      {/* Success Summary */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-900">
            Processing Complete! 🎉
          </CardTitle>
          <CardDescription className="text-lg text-green-700">
            Your interview transcripts have been successfully transformed into structured user stories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{jobStatus?.metrics?.total_files || 0}</div>
              <div className="text-sm text-green-700">Files Processed</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{jobStatus?.metrics?.total_stories || 0}</div>
              <div className="text-sm text-green-700">Stories Extracted</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {jobStatus?.metrics?.processing_time ? 
                  new Date(jobStatus.metrics.processing_time).toLocaleTimeString() : 
                  'N/A'
                }
              </div>
              <div className="text-sm text-green-700">Processing Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Stories Preview */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Preview Your User Stories
              </CardTitle>
              <CardDescription>
                Here's a preview of the user stories extracted from your interview transcripts.
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                variant={viewMode === 'editable' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('editable')}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
                {changesCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    +{changesCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'preview' ? (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {jobStatus?.userStories?.filter((s: any) => s.priority === 'High').length || 0}
                  </div>
                  <div className="text-xs text-slate-600">High Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {jobStatus?.userStories?.filter((s: any) => s.priority === 'Medium').length || 0}
                  </div>
                  <div className="text-xs text-slate-600">Medium Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {jobStatus?.userStories?.filter((s: any) => s.priority === 'Low').length || 0}
                  </div>
                  <div className="text-xs text-slate-600">Low Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {jobStatus?.userStories?.filter((s: any) => s.confidence >= 0.9).length || 0}
                  </div>
                  <div className="text-xs text-slate-600">High Confidence</div>
                </div>
              </div>
              
              {/* Additional Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-600">
                    {new Set(jobStatus?.userStories?.map((s: any) => s.epic) || []).size}
                  </div>
                  <div className="text-xs text-slate-600">Unique Epics</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-teal-600">
                    {new Set(jobStatus?.userStories?.map((s: any) => s.stakeholderTeam) || []).size}
                  </div>
                  <div className="text-xs text-slate-600">Stakeholder Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">
                    {new Set(jobStatus?.userStories?.map((s: any) => s.category) || []).size}
                  </div>
                  <div className="text-xs text-slate-600">Categories</div>
                </div>
              </div>
              
              {/* Sample User Stories */}
              {getSampleUserStories().map((story, index) => (
                <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {story.id}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {story.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {story.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {story.useCaseId}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">
                      Score: {story.confidence}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-slate-900 mb-1">
                        {story.userStory}
                      </div>
                      {story.userStoryStatement && (
                        <div className="text-sm text-slate-600 italic">
                          "{story.userStoryStatement}"
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">Epic:</span>
                        <div className="text-slate-600">{story.epic}</div>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Change Catalyst:</span>
                        <div className="text-slate-600">{story.changeCatalyst}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">Stakeholder:</span>
                        <div className="text-slate-600">{story.stakeholderName}</div>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Role:</span>
                        <div className="text-slate-600">{story.stakeholderRole}</div>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Team:</span>
                        <div className="text-slate-600">{story.stakeholderTeam}</div>
                      </div>
                    </div>
                    
                    {story.tags && story.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {story.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="text-center text-sm text-slate-500 pt-2">
                💡 Showing preview of {getSampleUserStories().length} stories. Switch to Edit mode to make changes.
              </div>
              
              <div className="text-center pt-4">
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                  <FileText className="w-4 h-4 mr-2" />
                  View All {jobStatus?.metrics?.total_stories || 0} Stories
                </Button>
              </div>
            </div>
          ) : (
            <EditableUserStoriesTable
              userStories={editableStories}
              onStoriesChange={handleStoriesChange}
              onDownload={handleDownloadEdited}
            />
          )}
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900 flex items-center space-x-2">
            <Download className="w-5 h-5 text-blue-600" />
            Download Your Results
          </CardTitle>
          <CardDescription>
            Get your structured data in CSV format for analysis in Excel, Google Sheets, or other tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-900">Original User Stories CSV</div>
                  <div className="text-sm text-blue-700">
                    {jobStatus?.metrics?.total_stories || 0} stories • AI-extracted content
                  </div>
                </div>
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading || !jobStatus?.csv_url}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Original
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-green-900">Edited User Stories CSV</div>
                  <div className="text-sm text-green-700">
                    {editableStories.length} stories • Customized and refined content
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    💡 Switch to Edit mode above to customize your stories before downloading
                  </div>
                </div>
                <Button
                  onClick={() => handleDownloadEdited(editableStories)}
                  disabled={editableStories.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Edited
                </Button>
              </div>
            </div>

            <div className="text-sm text-slate-600">
              💡 <strong>Original CSV:</strong> Contains the AI-extracted user stories exactly as generated
              <br />
              💡 <strong>Edited CSV:</strong> Contains your customized and refined user stories
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Insights */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Data Insights
          </CardTitle>
          <CardDescription>
            Quick overview of your extracted user stories and patterns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority Distribution */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 flex items-center space-x-2">
                <Target className="w-4 h-4 text-red-500" />
                Priority Distribution
              </h4>
              <div className="space-y-3">
                {Object.entries(priorityDistribution).map(([priority, percentage]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        priority === 'high' ? 'bg-red-500' : 
                        priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <span className="text-sm font-medium text-slate-700 capitalize">{priority}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            priority === 'high' ? 'bg-red-500' : 
                            priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-8 text-right">{percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Category Breakdown
              </h4>
              <div className="space-y-3">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{item.category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-slate-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-12 text-right">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {jobStatus?.metrics?.total_stories || 0}
                </div>
                <div className="text-sm text-slate-600">Total Stories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {jobStatus?.construct?.output_schema?.length || 0}
                </div>
                <div className="text-sm text-slate-600">Output Columns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {Object.keys(jobStatus?.construct?.defaults || {}).length}
                </div>
                <div className="text-sm text-slate-600">Default Values</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {jobStatus?.construct?.priority_rules?.length || 0}
                </div>
                <div className="text-sm text-slate-600">Priority Rules</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-xl text-purple-900">What's Next?</CardTitle>
          <CardDescription className="text-purple-700">
            Continue exploring and improving your interview data processing workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-purple-900 mb-2">Analyze Results</h4>
                <p className="text-sm text-purple-700">
                  Import your CSV into analysis tools to identify patterns and insights.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-purple-900 mb-2">Share with Team</h4>
                <p className="text-sm text-purple-700">
                  Collaborate with stakeholders using the structured data format.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-purple-900 mb-2">Process More Data</h4>
                <p className="text-sm text-purple-700">
                  Start a new job with different files or refine your construct.
                </p>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button
                onClick={onNewJob}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start New Job
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
