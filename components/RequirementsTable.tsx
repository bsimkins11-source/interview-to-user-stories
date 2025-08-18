"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Edit2, Save, X, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Requirement {
  req_id: string;
  requirement: string;
  priority_level: 'LOW' | 'MEDIUM' | 'HIGH';
  req_details: string;
  source_story_id?: string;
}

interface RequirementsTableProps {
  requirements: Requirement[];
  onRequirementsChange: (requirements: Requirement[]) => void;
  onDownload: () => void;
}

export function RequirementsTable({ requirements, onRequirementsChange, onDownload }: RequirementsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Requirement | null>(null);
  const { toast } = useToast();

  const handleEdit = useCallback((req: Requirement) => {
    setEditingId(req.req_id);
    setEditData({ ...req });
  }, []);

  const handleSave = useCallback(() => {
    if (!editData) return;

    // Validate required fields
    if (!editData.requirement?.trim()) {
      toast({
        title: "Validation Error",
        description: "Requirement text is required.",
        variant: "destructive",
      });
      return;
    }

    if (!editData.req_details?.trim()) {
      toast({
        title: "Validation Error",
        description: "Requirement details are required.",
        variant: "destructive",
      });
      return;
    }

    // Validate priority level
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(editData.priority_level)) {
      toast({
        title: "Validation Error",
        description: "Priority level must be LOW, MEDIUM, or HIGH.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedRequirements = requirements.map(req =>
        req.req_id === editData.req_id ? editData : req
      );

      onRequirementsChange(updatedRequirements);
      setEditingId(null);
      setEditData(null);

      toast({
        title: "Requirement updated",
        description: "The requirement has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save requirement. Please try again.",
        variant: "destructive",
      });
    }
  }, [editData, requirements, onRequirementsChange, toast]);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setEditData(null);
  }, []);

  const handleDelete = useCallback((reqId: string) => {
    try {
      const updatedRequirements = requirements.filter(req => req.req_id !== reqId);
      onRequirementsChange(updatedRequirements);

      toast({
        title: "Requirement deleted",
        description: "The requirement has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete requirement. Please try again.",
        variant: "destructive",
      });
    }
  }, [requirements, onRequirementsChange, toast]);

  const handlePriorityChange = useCallback((reqId: string, newPriority: 'LOW' | 'MEDIUM' | 'HIGH') => {
    const updatedRequirements = requirements.map(req =>
      req.req_id === reqId ? { ...req, priority_level: newPriority } : req
    );
    onRequirementsChange(updatedRequirements);
  }, [requirements, onRequirementsChange]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const downloadCSV = useCallback(() => {
    if (requirements.length === 0) {
      toast({
        title: "No requirements to download",
        description: "Please generate some requirements first.",
        variant: "destructive",
      });
      return;
    }

    // Generate CSV content
    const headers = ['req_id', 'requirement', 'priority_level', 'req_details', 'source_story_id'];
    const csvContent = [
      headers.join(','),
      ...requirements.map(req => [
        req.req_id,
        `"${req.requirement.replace(/"/g, '""')}"`,
        req.priority_level,
        `"${req.req_details.replace(/"/g, '""')}"`,
        req.source_story_id || ''
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requirements-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Requirements downloaded",
      description: "CSV file has been downloaded successfully.",
    });
  }, [requirements, toast]);

  if (requirements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Requirements</span>
            <Button onClick={onDownload} disabled>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No requirements generated yet.</p>
            <p className="text-sm">Requirements will appear here after processing user stories.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Requirements ({requirements.length})</span>
          <Button onClick={downloadCSV}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requirements.map((req) => (
            <div key={req.req_id} className="border rounded-lg p-4 space-y-3">
              {/* Requirement ID and Priority Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {req.req_id}
                  </span>
                  {editingId === req.req_id ? (
                    <select
                      value={editData?.priority_level || req.priority_level}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, priority_level: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' } : null)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  ) : (
                    <Badge className={getPriorityColor(req.priority_level)}>
                      {req.priority_level}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {editingId === req.req_id ? (
                    <>
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(req)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(req.req_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Requirement Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  High-Level Requirement
                </label>
                {editingId === req.req_id ? (
                  <Input
                    value={editData?.requirement || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, requirement: e.target.value } : null)}
                    placeholder="Enter high-level requirement"
                  />
                ) : (
                  <p className="text-gray-900">{req.requirement}</p>
                )}
              </div>

              {/* Requirement Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Specification
                </label>
                {editingId === req.req_id ? (
                  <textarea
                    value={editData?.req_details || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, req_details: e.target.value } : null)}
                    placeholder="Enter detailed requirement specification"
                    className="w-full border rounded-md px-3 py-2 min-h-[80px] resize-y"
                  />
                ) : (
                  <p className="text-gray-700 text-sm leading-relaxed">{req.req_details}</p>
                )}
              </div>

              {/* Source Story ID */}
              {req.source_story_id && (
                <div className="text-xs text-gray-500">
                  Source: {req.source_story_id}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
