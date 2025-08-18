"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface RequirementsConstruct {
  name: string;
  description?: string;
  output_schema: string[];
  pattern: string;
  defaults: Record<string, string>;
  priority_rules: string[];
}

interface RequirementsConstructEditorProps {
  onSave: (construct: RequirementsConstruct) => void;
  initialConstruct?: RequirementsConstruct;
}

export function RequirementsConstructEditor({ onSave, initialConstruct }: RequirementsConstructEditorProps) {
  const [construct, setConstruct] = useState<RequirementsConstruct>({
    name: initialConstruct?.name || 'Requirements Template',
    description: initialConstruct?.description || 'Define the structure for your requirements',
    output_schema: initialConstruct?.output_schema || ['req_id', 'requirement', 'priority_level', 'req_details'],
    pattern: initialConstruct?.pattern || 'As a [stakeholder], I need [capability] so that [business_value]',
    defaults: initialConstruct?.defaults || {
      'req_id': 'REQ-{auto}',
      'priority_level': 'MEDIUM'
    },
    priority_rules: initialConstruct?.priority_rules || [
      'HIGH: Critical business functions, security, compliance, revenue impact',
      'MEDIUM: Important features, user experience improvements, operational efficiency',
      'LOW: Nice-to-have features, minor improvements, future enhancements'
    ]
  });

  const [newField, setNewField] = useState('');
  const [newDefaultKey, setNewDefaultKey] = useState('');
  const [newDefaultValue, setNewDefaultValue] = useState('');
  const [newPriorityRule, setNewPriorityRule] = useState('');

  const { toast } = useToast();

  const addField = () => {
    if (newField.trim() && !construct.output_schema.includes(newField.trim())) {
      setConstruct(prev => ({
        ...prev,
        output_schema: [...prev.output_schema, newField.trim()]
      }));
      setNewField('');
      toast({
        title: "Field added",
        description: `Added "${newField.trim()}" to requirements schema.`,
      });
    }
  };

  const removeField = (field: string) => {
    if (field === 'req_id' || field === 'requirement' || field === 'priority_level' || field === 'req_details') {
      toast({
        title: "Cannot remove core field",
        description: "This is a required core field that cannot be removed.",
        variant: "destructive",
      });
      return;
    }

    setConstruct(prev => ({
      ...prev,
      output_schema: prev.output_schema.filter(f => f !== field)
    }));

    // Also remove from defaults if it exists
    const newDefaults = { ...construct.defaults };
    delete newDefaults[field];
    setConstruct(prev => ({
      ...prev,
      defaults: newDefaults
    }));

    toast({
      title: "Field removed",
      description: `Removed "${field}" from requirements schema.`,
    });
  };

  const addDefault = () => {
    if (newDefaultKey.trim() && newDefaultValue.trim()) {
      setConstruct(prev => ({
        ...prev,
        defaults: { ...prev.defaults, [newDefaultKey.trim()]: newDefaultValue.trim() }
      }));
      setNewDefaultKey('');
      setNewDefaultValue('');
      toast({
        title: "Default added",
        description: `Added default value for "${newDefaultKey.trim()}".`,
      });
    }
  };

  const removeDefault = (key: string) => {
    setConstruct(prev => {
      const newDefaults = { ...prev.defaults };
      delete newDefaults[key];
      return { ...prev, defaults: newDefaults };
    });
    toast({
      title: "Default removed",
      description: `Removed default value for "${key}".`,
    });
  };

  const addPriorityRule = () => {
    if (newPriorityRule.trim()) {
      setConstruct(prev => ({
        ...prev,
        priority_rules: [...prev.priority_rules, newPriorityRule.trim()]
      }));
      setNewPriorityRule('');
      toast({
        title: "Priority rule added",
        description: "Added new priority classification rule.",
      });
    }
  };

  const removePriorityRule = (index: number) => {
    setConstruct(prev => ({
      ...prev,
      priority_rules: prev.priority_rules.filter((_, i) => i !== index)
    }));
    toast({
      title: "Priority rule removed",
      description: "Removed priority classification rule.",
    });
  };

  const handleSave = () => {
    if (construct.name.trim() && construct.output_schema.length > 0) {
      onSave(construct);
      toast({
        title: "Requirements construct saved!",
        description: `Your requirements template "${construct.name}" has been defined with ${construct.output_schema.length} fields.`,
      });
    } else {
      toast({
        title: "Validation error",
        description: "Please provide a name and at least one output field.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <Input
              value={construct.name}
              onChange={(e) => setConstruct(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Standard Requirements Template"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Input
              value={construct.description}
              onChange={(e) => setConstruct(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your requirements template"
            />
          </div>
        </CardContent>
      </Card>

      {/* Output Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Output Schema Fields</CardTitle>
          <p className="text-sm text-gray-600">
            Define the fields that will appear in your requirements output. Core fields (req_id, requirement, priority_level, req_details) cannot be removed.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              placeholder="Add new field name"
              onKeyPress={(e) => e.key === 'Enter' && addField()}
            />
            <Button onClick={addField} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {construct.output_schema.map((field, index) => (
              <div key={field} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Badge variant={field === 'req_id' || field === 'requirement' || field === 'priority_level' || field === 'req_details' ? 'default' : 'secondary'}>
                  {field}
                </Badge>
                {field !== 'req_id' && field !== 'requirement' && field !== 'priority_level' && field !== 'req_details' && (
                  <Button
                    onClick={() => removeField(field)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Default Values */}
      <Card>
        <CardHeader>
          <CardTitle>Default Values</CardTitle>
          <p className="text-sm text-gray-600">
            Set default values for fields that should have consistent values across requirements.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newDefaultKey}
              onChange={(e) => setNewDefaultKey(e.target.value)}
              placeholder="Field name"
            />
            <Input
              value={newDefaultValue}
              onChange={(e) => setNewDefaultValue(e.target.value)}
              placeholder="Default value"
            />
            <Button onClick={addDefault} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {Object.entries(construct.defaults).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{key}:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{value}</span>
                  <Button
                    onClick={() => removeDefault(key)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Classification Rules</CardTitle>
          <p className="text-sm text-gray-600">
            Define rules for how Gemini AI should classify requirement priorities.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newPriorityRule}
              onChange={(e) => setNewPriorityRule(e.target.value)}
              placeholder="e.g., HIGH: Critical business functions, security, compliance"
              onKeyPress={(e) => e.key === 'Enter' && addPriorityRule()}
            />
            <Button onClick={addPriorityRule} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {construct.priority_rules.map((rule, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{rule}</span>
                <Button
                  onClick={() => removePriorityRule(index)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button onClick={handleSave} size="lg" className="px-8">
          <Save className="mr-2 h-4 w-4" />
          Save Requirements Construct
        </Button>
      </div>
    </div>
  );
}
